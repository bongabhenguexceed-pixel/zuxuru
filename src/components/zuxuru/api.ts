// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Shogo Technologies, Inc.
import type { BusinessFull, BusinessListItem, ContentAssetRow, Dimension, FindingRow, PublishingJobRow } from './types'

export interface PotentialResult {
  potential: number
  potentialScores: Record<Dimension, number>
}

async function handle<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body?.error ?? `Request failed (${res.status})`)
  }
  return body as T
}

export const zuxuruApi = {
  listBusinesses: () =>
    fetch('/api/zuxuru/businesses').then((r) => handle<{ businesses: BusinessListItem[] }>(r)),

  discover: (name: string, location?: string) =>
    fetch('/api/zuxuru/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, location }),
    }).then((r) => handle<{ businessId: string }>(r)),

  getBusiness: (id: string) =>
    fetch(`/api/zuxuru/businesses/${id}`).then((r) =>
      handle<{ business: BusinessFull; potential: PotentialResult | null }>(r)
    ),

  scoringWeights: () => fetch('/api/zuxuru/scoring-weights').then((r) => handle<{ weights: Record<Dimension, number> }>(r)),

  connect: (id: string, platform: string) =>
    fetch(`/api/zuxuru/businesses/${id}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform }),
    }).then((r) => handle<{ ok: boolean }>(r)),

  recommend: (opportunityId: string) =>
    fetch(`/api/zuxuru/opportunities/${opportunityId}/recommend`, { method: 'POST' }).then((r) =>
      handle<{ action: unknown }>(r)
    ),

  approve: (actionId: string) =>
    fetch(`/api/zuxuru/actions/${actionId}/approve`, { method: 'POST' }).then((r) => handle<{ action: unknown }>(r)),

  execute: (actionId: string) =>
    fetch(`/api/zuxuru/actions/${actionId}/execute`, { method: 'POST' }).then((r) => handle<{ record: unknown }>(r)),

  monitor: (id: string) =>
    fetch(`/api/zuxuru/businesses/${id}/monitor`, { method: 'POST' }).then((r) =>
      handle<{
        previousOverall: number
        newOverall: number
        delta: number
        improvedDimensions: string[]
        stillWeakDimensions: string[]
        nextOpportunity: { title: string } | null
      }>(r)
    ),

  platforms: () => fetch('/api/zuxuru/platforms').then((r) => handle<{ platforms: string[] }>(r)),

  generateContent: (opportunityId: string) =>
    fetch(`/api/zuxuru/opportunities/${opportunityId}/generate-content`, { method: 'POST' }).then((r) =>
      handle<{ asset: ContentAssetRow }>(r)
    ),

  approveContent: (contentId: string) =>
    fetch(`/api/zuxuru/content/${contentId}/approve`, { method: 'POST' }).then((r) =>
      handle<{ asset: ContentAssetRow }>(r)
    ),

  publishContent: (contentId: string, platform: string) =>
    fetch(`/api/zuxuru/content/${contentId}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform }),
    }).then((r) => handle<{ job: PublishingJobRow }>(r)),

  reviewQueue: (businessId?: string) =>
    fetch(`/api/zuxuru/findings/review-queue${businessId ? `?businessId=${businessId}` : ''}`).then((r) =>
      handle<{ findings: FindingRow[] }>(r)
    ),

  reviewFinding: (findingId: string, status: 'reviewed' | 'false_positive' | 'resolved' | 'open', reviewNote?: string) =>
    fetch(`/api/zuxuru/findings/${findingId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reviewNote, reviewedBy: 'owner' }),
    }).then((r) => handle<{ finding: FindingRow }>(r)),
}
