// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Shogo Technologies, Inc.
//
// LAYER 4 — OPPORTUNITY ENGINE
//
// Determines: "What should this business fix first?" Turns weak
// dimensions into verified Findings (deduped across rescans, with a
// human review workflow) and ranked Opportunities (Impact x Confidence
// x Relevance / Effort). Every recommendation is structured as
// Finding -> Evidence -> Impact -> Recommendation -> Expected Outcome
// so nothing looks like invented AI marketing advice.

import { prisma } from '../db'
import { clamp } from './random'
import { DIMENSIONS, DIMENSION_LABEL, type Dimension } from './scoring-engine'

// ---------------------------------------------------------------------
// FINDINGS — with dedup so repeat rescans collapse into one row instead
// of piling up duplicates every time discover/connect/monitor re-runs
// the same weak-dimension check. Once a human marks a finding
// false_positive (or resolved) with the SAME signature, the engine
// suppresses it instead of re-creating it on the next scoring pass —
// this is what stops the "false positive keeps coming back" pattern.
// ---------------------------------------------------------------------
function severityBucket(score: number): 'critical' | 'high' | 'medium' {
  return score < 20 ? 'critical' : score < 35 ? 'high' : 'medium'
}

function hashSignature(input: string): string {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

function buildDedupKey(businessId: string, dimension: Dimension, signature: string): string {
  return hashSignature(`${businessId}:${dimension}:${signature}`)
}

export async function generateFindings(businessId: string, scores: Record<Dimension, number>) {
  const created = []
  const suppressed = []
  const updated = []
  for (const dim of DIMENSIONS) {
    const score = scores[dim]
    if (score >= 55) continue
    const severity = severityBucket(score)
    const evidenceRows = await prisma.evidence.findMany({
      where: { businessId, dimension: dim },
      orderBy: { confidence: 'desc' },
      take: 3,
    })
    const evidenceIds = evidenceRows.map((e) => e.id)
    const signature = `${severity}:${evidenceRows[0]?.normalizedFinding ?? 'none'}`
    const dedupKey = buildDedupKey(businessId, dim, signature)
    const description = `${DIMENSION_LABEL[dim]} is weak (${score}/100). ${
      evidenceRows[0]?.normalizedFinding ?? 'No strong signal detected.'
    }`

    const existingSameSignature = await prisma.finding.findFirst({
      where: { businessId, dimension: dim, dedupKey },
      orderBy: { createdAt: 'desc' },
    })

    if (existingSameSignature) {
      if (existingSameSignature.status === 'false_positive') {
        await prisma.finding.update({
          where: { id: existingSameSignature.id },
          data: { lastSeenAt: new Date(), occurrenceCount: { increment: 1 } },
        })
        suppressed.push(existingSameSignature)
        continue
      }
      const reopened = existingSameSignature.status === 'resolved' ? 'open' : existingSameSignature.status
      const finding = await prisma.finding.update({
        where: { id: existingSameSignature.id },
        data: {
          severity,
          description,
          evidenceIds: JSON.stringify(evidenceIds),
          lastSeenAt: new Date(),
          occurrenceCount: { increment: 1 },
          status: reopened,
        },
      })
      updated.push(finding)
      continue
    }

    const finding = await prisma.finding.create({
      data: {
        businessId,
        dimension: dim,
        severity,
        description,
        evidenceIds: JSON.stringify(evidenceIds),
        dedupKey,
        status: 'open',
      },
    })
    created.push(finding)
  }
  return { created, updated, suppressed }
}

const FINDING_REVIEW_STATUSES = ['reviewed', 'false_positive', 'resolved', 'open'] as const
export type FindingReviewStatus = (typeof FINDING_REVIEW_STATUSES)[number]

export async function reviewFinding(
  findingId: string,
  status: FindingReviewStatus,
  reviewedBy?: string,
  reviewNote?: string
) {
  if (!FINDING_REVIEW_STATUSES.includes(status)) {
    throw new Error(`Invalid review status: ${status}`)
  }
  const existing = await prisma.finding.findUnique({ where: { id: findingId } })
  if (!existing) throw new Error('Finding not found')
  return prisma.finding.update({
    where: { id: findingId },
    data: {
      status,
      reviewedAt: new Date(),
      reviewedBy: reviewedBy ?? null,
      reviewNote: reviewNote ?? null,
    },
  })
}

export async function listReviewQueue(businessId?: string) {
  return prisma.finding.findMany({
    where: {
      status: 'open',
      ...(businessId ? { businessId } : {}),
    },
    orderBy: [{ occurrenceCount: 'desc' }, { createdAt: 'desc' }],
    include: { business: { select: { id: true, name: true } } },
  })
}

export const OPPORTUNITY_TEMPLATES: Record<
  Dimension,
  {
    title: string
    description: string
    effort: number
    automationLevel: 'green' | 'yellow' | 'red'
    expectedOutcome: string
  }
> = {
  discoverability: {
    title: 'Claim & complete Google Business Profile',
    description: 'Fully claim, verify and complete the Google Business Profile so the business surfaces in local search and maps.',
    effort: 2,
    automationLevel: 'green',
    expectedOutcome: 'Improved local search & maps ranking, more "near me" impressions.',
  },
  trust: {
    title: 'Launch a review generation campaign',
    description: 'Prompt recent customers for reviews and respond to existing ones to lift rating and review volume.',
    effort: 5,
    automationLevel: 'yellow',
    expectedOutcome: 'Higher star rating and review count — the #1 factor customers cite before choosing a business.',
  },
  activity: {
    title: 'Restart social publishing cadence',
    description: 'Publish a consistent stream of posts across active social accounts to reverse an activity/decay gap.',
    effort: 4,
    automationLevel: 'yellow',
    expectedOutcome: 'Signals to customers and platforms that the business is active and trustworthy right now.',
  },
  clarity: {
    title: 'Rewrite website homepage messaging',
    description: 'Clarify who the business serves, what it offers, and add structured local business schema.',
    effort: 7,
    automationLevel: 'red',
    expectedOutcome: 'Visitors instantly understand the offer, and search engines can parse it correctly.',
  },
  consistency: {
    title: 'Fix NAP consistency across listings',
    description: 'Align name, address and phone number across every discovered listing and profile.',
    effort: 3,
    automationLevel: 'yellow',
    expectedOutcome: 'Removes the #1 cause of "wrong info" complaints and de-ranking in local search.',
  },
  conversion: {
    title: 'Add a clear call-to-action / booking link',
    description: 'Add a single obvious next step (book, call, message) across the website and top social profiles.',
    effort: 2,
    automationLevel: 'green',
    expectedOutcome: 'Turns visibility into enquiries — visitors know exactly what to do next.',
  },
  aiVisibility: {
    title: 'Optimize for AI assistant recommendations',
    description:
      'Add structured, consistent business facts (services, hours, location, reviews) across the web so AI assistants like ChatGPT and Google AI Overviews can confidently recommend this business.',
    effort: 6,
    automationLevel: 'red',
    expectedOutcome: 'Business starts appearing when customers ask AI assistants "who should I use for X near me?"',
  },
}

export async function generateOpportunities(businessId: string, scores: Record<Dimension, number>) {
  const existing = await prisma.opportunity.findMany({ where: { businessId } })
  const existingDims = new Set(existing.filter((o) => o.status === 'open').map((o) => o.dimension))
  const created = []

  for (const dim of DIMENSIONS) {
    const score = scores[dim]
    if (score >= 55) continue
    if (existingDims.has(dim)) continue
    const tpl = OPPORTUNITY_TEMPLATES[dim]
    const evidenceRows = await prisma.evidence.findMany({ where: { businessId, dimension: dim } })
    const avgConfidence =
      evidenceRows.length > 0 ? evidenceRows.reduce((s, e) => s + e.confidence, 0) / evidenceRows.length : 0.5

    const impact = clamp(((100 - score) / 100) * 10, 1, 10)
    const confidence = clamp(avgConfidence * 10, 1, 10)
    const relevance = clamp(7 + (score < 25 ? 2 : 0), 1, 10)
    const effort = tpl.effort
    const rankScore = +((impact * confidence * relevance) / effort).toFixed(2)

    const opp = await prisma.opportunity.create({
      data: {
        businessId,
        title: tpl.title,
        description: tpl.description,
        dimension: dim,
        impact,
        confidence,
        relevance,
        effort,
        rankScore,
        expectedOutcome: tpl.expectedOutcome,
      },
    })
    created.push(opp)
  }
  return created
}
