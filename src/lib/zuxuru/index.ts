// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Shogo Technologies, Inc.
//
// ZUXURU — ORCHESTRATOR
//
// Wires the 7-layer architecture from the build spec together in the
// exact pipeline order:
//
//   1. Business database      (./business-db)
//   2. Public Intelligence    (./intelligence-engine)
//   3. Scoring Engine         (./scoring-engine)
//   4. Opportunity Engine     (./opportunity-engine)
//   5. AI Execution Layer     (./execution-engine)
//   6. Monitoring Engine      (./monitoring-engine)
//   7. Dashboard              (src/components/zuxuru/*, browser-side)
//
// DISCOVER -> SCORE -> CONNECT -> RECOMMEND -> EXECUTE -> MONITOR ->
// RESCORE. Only the orchestration functions below (runDiscovery,
// connectPlatform) call across layer boundaries — every other layer
// only calls the layers beneath it, never sideways or upward.

import { prisma } from '../db'
import { createBusiness, setBusinessPhase } from './business-db'
import { investigatePublic, investigateConnected, persistEvidence } from './intelligence-engine'
import { computeScore } from './scoring-engine'
import { generateFindings, generateOpportunities } from './opportunity-engine'
import { logAudit } from './audit'

export async function runDiscovery(name: string, location?: string, category?: string) {
  const business = await createBusiness(name, location, category)
  await logAudit(business.id, 'investigation.public.started', { name, location })

  const items = investigatePublic({ name, location, category })
  await persistEvidence(business.id, items)

  const { overall, scores } = await computeScore(business.id)
  await prisma.scoreSnapshot.create({
    data: {
      businessId: business.id,
      phase: 'public',
      overall,
      ...scores,
      note: 'Initial public discovery — unauthenticated investigation only.',
    },
  })
  await generateFindings(business.id, scores)
  await generateOpportunities(business.id, scores)
  await logAudit(business.id, 'score.computed', { phase: 'public', overall })

  return business.id
}

export async function connectPlatform(businessId: string, platform: string, accountHandle?: string) {
  const business = await prisma.business.findUniqueOrThrow({ where: { id: businessId } })
  await prisma.connection.create({
    data: { businessId, platform, accountHandle: accountHandle || null, connected: true },
  })
  await logAudit(businessId, 'connection.established', { platform })

  const items = investigateConnected(business.name, platform)
  await persistEvidence(businessId, items)

  await setBusinessPhase(businessId, 'connected')

  const { overall, scores } = await computeScore(businessId)
  await prisma.scoreSnapshot.create({
    data: {
      businessId,
      phase: 'connected',
      overall,
      ...scores,
      note: `Connected ${platform} — deeper verified evidence incorporated.`,
    },
  })
  await generateFindings(businessId, scores)
  await generateOpportunities(businessId, scores)
  await logAudit(businessId, 'score.computed', { phase: 'connected', overall })

  return { overall, scores }
}

export { DIMENSIONS, DIMENSION_WEIGHTS, DIMENSION_LABEL, computeScore, computePotential, type Dimension } from './scoring-engine'
export { PLATFORM_OPTIONS, PLATFORM_DIMENSIONS } from './intelligence-engine'
export {
  generateFindings,
  generateOpportunities,
  reviewFinding,
  listReviewQueue,
  OPPORTUNITY_TEMPLATES,
  type FindingReviewStatus,
} from './opportunity-engine'
export {
  createActionFromOpportunity,
  approveAction,
  executeAction,
  generateContentAsset,
  approveContentAsset,
  publishContentAsset,
} from './execution-engine'
export { monitorAndRescore } from './monitoring-engine'
export { listBusinesses, getBusinessFull, getBusinessOrThrow } from './business-db'
