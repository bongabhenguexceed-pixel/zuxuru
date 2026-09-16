// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Shogo Technologies, Inc.
//
// LAYER 3 — SCORING ENGINE
//
// Turns evidence into a 0-100 score. Every category has a published,
// fixed weight (shown to the owner) so the score is never "an AI-invented
// number" — it is fully reconstructible from the evidence on file. See
// the Zuxuru build spec: "Don't invent the score. Create a transparent
// scoring system."

import { prisma } from '../db'
import { clamp } from './random'

export const DIMENSIONS = [
  'discoverability',
  'clarity',
  'trust',
  'activity',
  'consistency',
  'conversion',
  'aiVisibility',
] as const
export type Dimension = (typeof DIMENSIONS)[number]

export const DIMENSION_WEIGHTS: Record<Dimension, number> = {
  discoverability: 0.2,
  clarity: 0.15,
  trust: 0.15,
  activity: 0.15,
  consistency: 0.1,
  conversion: 0.1,
  aiVisibility: 0.15,
}

export const DIMENSION_LABEL: Record<Dimension, string> = {
  discoverability: 'Discoverability',
  clarity: 'Clarity',
  trust: 'Trust',
  activity: 'Activity',
  consistency: 'Consistency',
  conversion: 'Conversion',
  aiVisibility: 'AI Visibility',
}

export async function computeScore(businessId: string) {
  const evidence = await prisma.evidence.findMany({ where: { businessId } })
  const scores: Record<Dimension, number> = {
    discoverability: 5,
    clarity: 5,
    trust: 5,
    activity: 5,
    consistency: 5,
    conversion: 5,
    aiVisibility: 5,
  }

  for (const dim of DIMENSIONS) {
    const rows = evidence.filter((e) => e.dimension === dim)
    if (rows.length === 0) continue
    let weighted = 0
    let weight = 0
    for (const r of rows) {
      const w = r.verificationStatus === 'verified' ? 1 : r.verificationStatus === 'candidate' ? 0.5 : 0.2
      weighted += r.confidence * w
      weight += w
    }
    scores[dim] = clamp(Math.round((weighted / Math.max(weight, 0.001)) * 100))
  }

  const overall = clamp(Math.round(DIMENSIONS.reduce((sum, d) => sum + scores[d] * DIMENSION_WEIGHTS[d], 0)))
  return { overall, scores }
}

/**
 * Potential Score — the achievable ceiling if every currently-open opportunity
 * were fixed. Ties directly to identified gaps, so "why 74%?" always has a
 * concrete answer: these N opportunities, worth this much headroom.
 */
export async function computePotential(businessId: string, scores: Record<Dimension, number>) {
  const openOpportunities = await prisma.opportunity.findMany({ where: { businessId, status: 'open' } })
  const dimsWithOpenGap = new Set(openOpportunities.map((o) => o.dimension))
  const potentialScores: Record<Dimension, number> = { ...scores }
  for (const dim of DIMENSIONS) {
    if (dimsWithOpenGap.has(dim)) {
      potentialScores[dim] = clamp(Math.round(scores[dim] + (100 - scores[dim]) * 0.65))
    }
  }
  const potential = clamp(
    Math.round(DIMENSIONS.reduce((sum, d) => sum + potentialScores[d] * DIMENSION_WEIGHTS[d], 0))
  )
  return { potential, potentialScores }
}
