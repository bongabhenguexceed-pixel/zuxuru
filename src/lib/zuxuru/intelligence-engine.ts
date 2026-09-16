// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Shogo Technologies, Inc.
//
// LAYER 2 — PUBLIC INTELLIGENCE ENGINE
//
// Collects publicly available information about a business (Agent-Reach,
// Maigret, Maps MCP, Website/Search Intelligence — SIMULATED here with a
// deterministic generator so the full loop works end-to-end without
// external API keys). Also handles the deeper, verified investigation
// once a platform is connected. Produces normalized Evidence rows only —
// no scoring, no opportunity logic lives here.

import { prisma } from '../db'
import { rng, clamp, slugHandle } from './random'
import type { Dimension } from './scoring-engine'

export interface EvidenceInput {
  source: string
  sourceType: string
  platform?: string
  url?: string
  title?: string
  dimension: Dimension
  rawFinding: Record<string, unknown>
  normalizedFinding: string
  confidence: number
  verificationStatus: 'candidate' | 'verified' | 'rejected'
}

export const PLATFORM_DIMENSIONS: Record<string, Dimension[]> = {
  'Google Business Profile': ['discoverability', 'trust'],
  Website: ['clarity', 'conversion'],
  Instagram: ['activity', 'consistency'],
  Facebook: ['activity', 'consistency'],
  TikTok: ['activity'],
}
export const PLATFORM_OPTIONS = Object.keys(PLATFORM_DIMENSIONS)

/** Public-phase investigation: Agent-Reach + Maigret + Maps MCP + Website/Search Intelligence */
export function investigatePublic(business: {
  name: string
  location?: string | null
  category?: string | null
}): EvidenceInput[] {
  const rand = rng(`${business.name}|${business.location ?? ''}|public`)
  const handle = slugHandle(business.name)
  const evidence: EvidenceInput[] = []

  // Maps MCP -> local listing evidence (discoverability + trust)
  const hasListing = rand() > 0.15
  if (hasListing) {
    const rating = +(2.8 + rand() * 2.1).toFixed(1)
    const reviewCount = Math.floor(rand() * 60)
    evidence.push({
      source: 'maps_mcp',
      sourceType: 'listing',
      platform: 'Google Business Profile',
      url: `https://maps.google.com/?q=${encodeURIComponent(business.name)}`,
      title: business.name,
      dimension: 'discoverability',
      rawFinding: { rating, reviewCount, category: business.category },
      normalizedFinding: `Google Business Profile found. Rating ${rating}/5 from ${reviewCount} reviews.`,
      confidence: clamp(0.4 + reviewCount / 100, 0, 1),
      verificationStatus: reviewCount > 5 ? 'verified' : 'candidate',
    })
    evidence.push({
      source: 'maps_mcp',
      sourceType: 'listing',
      platform: 'Google Business Profile',
      dimension: 'trust',
      rawFinding: { rating, reviewCount },
      normalizedFinding:
        reviewCount < 10
          ? `Review volume is low (${reviewCount}) — trust signal weak.`
          : `Review volume is healthy (${reviewCount}), rating ${rating}/5.`,
      confidence: clamp(reviewCount / 40, 0, 1),
      verificationStatus: reviewCount > 5 ? 'verified' : 'candidate',
    })
  } else {
    evidence.push({
      source: 'maps_mcp',
      sourceType: 'listing',
      platform: 'Google Business Profile',
      dimension: 'discoverability',
      rawFinding: { found: false },
      normalizedFinding: 'No Google Business Profile detected for this business.',
      confidence: 0.85,
      verificationStatus: 'verified',
    })
  }

  // Website Intelligence -> clarity + conversion
  const hasWebsite = rand() > 0.25
  if (hasWebsite) {
    const hasSchema = rand() > 0.5
    const hasCTA = rand() > 0.45
    const mobileFriendly = rand() > 0.3
    evidence.push({
      source: 'website_intelligence',
      sourceType: 'website',
      platform: 'Website',
      url: `https://www.${handle}.com`,
      dimension: 'clarity',
      rawFinding: { hasSchema, mobileFriendly },
      normalizedFinding: hasSchema
        ? 'Website has structured local business schema.'
        : 'Website is missing local business schema / structured data — messaging is unclear to search engines.',
      confidence: clamp(0.45 + (hasSchema ? 0.3 : 0) + (mobileFriendly ? 0.15 : 0), 0, 1),
      verificationStatus: 'verified',
    })
    evidence.push({
      source: 'website_intelligence',
      sourceType: 'website',
      platform: 'Website',
      dimension: 'conversion',
      rawFinding: { hasCTA },
      normalizedFinding: hasCTA
        ? 'Website has a clear call-to-action (contact/booking).'
        : 'Website has no clear call-to-action — visitors have no obvious next step.',
      confidence: clamp(hasCTA ? 0.75 : 0.35, 0, 1),
      verificationStatus: 'verified',
    })
  } else {
    evidence.push({
      source: 'website_intelligence',
      sourceType: 'website',
      dimension: 'clarity',
      rawFinding: { found: false },
      normalizedFinding: 'No website detected — business identity is unclear online.',
      confidence: 0.9,
      verificationStatus: 'verified',
    })
  }

  // Maigret -> candidate social accounts (activity, unverified until connected)
  const platforms = ['Instagram', 'Facebook', 'TikTok']
  for (const platform of platforms) {
    const exists = rand() > 0.35
    if (exists) {
      const active = rand() > 0.55
      evidence.push({
        source: 'maigret',
        sourceType: 'social',
        platform,
        url: `https://${platform.toLowerCase()}.com/${handle}`,
        dimension: 'activity',
        rawFinding: { candidate: true, active },
        normalizedFinding: active
          ? `Candidate ${platform} account found and appears active.`
          : `Candidate ${platform} account found but appears inactive.`,
        confidence: active ? 0.55 : 0.4,
        verificationStatus: 'candidate',
      })
    }
  }

  // Search Intelligence -> discoverability + consistency
  const searchVisible = rand() > 0.3
  evidence.push({
    source: 'search_intelligence',
    sourceType: 'search',
    dimension: 'discoverability',
    rawFinding: { searchVisible },
    normalizedFinding: searchVisible
      ? 'Business name returns relevant results in search.'
      : 'Business name barely surfaces in search results — low discoverability.',
    confidence: searchVisible ? 0.6 : 0.7,
    verificationStatus: 'verified',
  })
  const napConsistent = rand() > 0.45
  evidence.push({
    source: 'search_intelligence',
    sourceType: 'search',
    dimension: 'consistency',
    rawFinding: { napConsistent },
    normalizedFinding: napConsistent
      ? 'Name / address / phone are consistent across the sources found so far.'
      : 'Name / address / phone details are inconsistent across the sources found so far.',
    confidence: napConsistent ? 0.6 : 0.65,
    verificationStatus: 'verified',
  })

  // AI Search Intelligence -> would an AI assistant (ChatGPT, Google AI Overviews) recommend this business?
  const aiIndexed = hasWebsite && hasListing && rand() > 0.4
  const aiRecommends = aiIndexed && rand() > 0.35
  evidence.push({
    source: 'ai_search_intelligence',
    sourceType: 'ai_search',
    dimension: 'aiVisibility',
    rawFinding: { aiIndexed, aiRecommends },
    normalizedFinding: aiRecommends
      ? 'AI assistants (ChatGPT / Google AI Overviews) can find consistent enough facts to recommend this business.'
      : aiIndexed
        ? 'Business facts are partially indexed but not consistent/complete enough for AI assistants to confidently recommend it.'
        : 'AI assistants have no reliable structured facts about this business — it will not surface in AI-generated recommendations.',
    confidence: aiRecommends ? 0.75 : aiIndexed ? 0.5 : 0.8,
    verificationStatus: 'verified',
  })

  return evidence
}

/** Connected-phase investigation: deeper, verified evidence for a specific connected platform */
export function investigateConnected(businessName: string, platform: string): EvidenceInput[] {
  const rand = rng(`${businessName}|${platform}|connected|${Date.now()}`)
  const out: EvidenceInput[] = []
  const engagementRate = +(1 + rand() * 6).toFixed(1)
  const postFrequencyPerWeek = +(rand() * 5).toFixed(1)

  if (/google/i.test(platform)) {
    const responseRate = Math.round(rand() * 100)
    out.push({
      source: 'agent_reach',
      sourceType: 'listing',
      platform,
      dimension: 'trust',
      rawFinding: { responseRate },
      normalizedFinding: `Connected data: business responds to ${responseRate}% of reviews.`,
      confidence: 0.9,
      verificationStatus: 'verified',
    })
    out.push({
      source: 'agent_reach',
      sourceType: 'listing',
      platform,
      dimension: 'discoverability',
      rawFinding: { complete: rand() > 0.4 },
      normalizedFinding: 'Connected data: profile completeness verified directly from account.',
      confidence: 0.92,
      verificationStatus: 'verified',
    })
  } else if (/website/i.test(platform)) {
    out.push({
      source: 'agent_reach',
      sourceType: 'website',
      platform,
      dimension: 'clarity',
      rawFinding: { verifiedOwnership: true },
      normalizedFinding: 'Connected data: website ownership verified, full content audit possible.',
      confidence: 0.9,
      verificationStatus: 'verified',
    })
    out.push({
      source: 'agent_reach',
      sourceType: 'website',
      platform,
      dimension: 'conversion',
      rawFinding: { conversionPathsFound: Math.floor(rand() * 3) },
      normalizedFinding: 'Connected data: conversion paths audited on live site.',
      confidence: 0.85,
      verificationStatus: 'verified',
    })
  } else {
    out.push({
      source: 'agent_reach',
      sourceType: 'social',
      platform,
      dimension: 'activity',
      rawFinding: { engagementRate, postFrequencyPerWeek },
      normalizedFinding: `Connected data: ${postFrequencyPerWeek} posts/week, ${engagementRate}% engagement rate.`,
      confidence: 0.9,
      verificationStatus: 'verified',
    })
    out.push({
      source: 'agent_reach',
      sourceType: 'social',
      platform,
      dimension: 'consistency',
      rawFinding: { brandConsistent: rand() > 0.3 },
      normalizedFinding: 'Connected data: brand consistency across posts verified.',
      confidence: 0.8,
      verificationStatus: 'verified',
    })
  }
  return out
}

export async function persistEvidence(businessId: string, items: EvidenceInput[]) {
  if (items.length === 0) return
  await prisma.evidence.createMany({
    data: items.map((e) => ({
      businessId,
      source: e.source,
      sourceType: e.sourceType,
      platform: e.platform,
      url: e.url,
      title: e.title,
      dimension: e.dimension,
      rawFinding: JSON.stringify(e.rawFinding),
      normalizedFinding: e.normalizedFinding,
      verificationStatus: e.verificationStatus,
      confidence: e.confidence,
    })),
  })
}
