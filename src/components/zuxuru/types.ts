// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Shogo Technologies, Inc.

export type Dimension =
  | 'discoverability'
  | 'clarity'
  | 'trust'
  | 'activity'
  | 'consistency'
  | 'conversion'
  | 'aiVisibility'

export const DIMENSIONS: Dimension[] = [
  'discoverability',
  'clarity',
  'trust',
  'activity',
  'consistency',
  'conversion',
  'aiVisibility',
]

export const DIMENSION_LABEL: Record<Dimension, string> = {
  discoverability: 'Discoverability',
  clarity: 'Clarity',
  trust: 'Trust',
  activity: 'Activity',
  consistency: 'Consistency',
  conversion: 'Conversion',
  aiVisibility: 'AI Visibility',
}

export interface EvidenceRow {
  id: string
  businessId: string
  source: string
  sourceType: string
  platform: string | null
  url: string | null
  title: string | null
  dimension: string
  rawFinding: string
  normalizedFinding: string
  verificationStatus: string
  confidence: number
  retrievedAt: string
  createdAt: string
}

export interface FindingRow {
  id: string
  businessId: string
  dimension: string
  severity: string
  description: string
  evidenceIds: string
  dedupKey: string
  status: string // open | reviewed | false_positive | resolved
  occurrenceCount: number
  lastSeenAt: string
  reviewedAt: string | null
  reviewedBy: string | null
  reviewNote: string | null
  createdAt: string
}

export interface ScoreSnapshotRow {
  id: string
  businessId: string
  phase: string
  overall: number
  discoverability: number
  clarity: number
  trust: number
  activity: number
  consistency: number
  conversion: number
  aiVisibility: number
  note: string | null
  createdAt: string
}

export interface OpportunityRow {
  id: string
  businessId: string
  title: string
  description: string
  dimension: string
  impact: number
  confidence: number
  relevance: number
  effort: number
  rankScore: number
  expectedOutcome: string
  status: string
  createdAt: string
}

export interface ExecutionRecordRow {
  id: string
  actionId: string
  businessId: string
  status: string
  resultSummary: string
  externalRef: string | null
  measuredImpact: string | null
  executedAt: string
  createdAt: string
}

export interface ActionRow {
  id: string
  businessId: string
  opportunityId: string
  title: string
  description: string
  automationLevel: 'green' | 'yellow' | 'red'
  status: string
  approvedAt: string | null
  createdAt: string
  opportunity: OpportunityRow
  executions: ExecutionRecordRow[]
}

export interface ConnectionRow {
  id: string
  businessId: string
  platform: string
  connected: boolean
  accountHandle: string | null
  connectedAt: string
}

export interface AuditEventRow {
  id: string
  businessId: string
  type: string
  payload: string | null
  createdAt: string
}

export interface PublishingJobRow {
  id: string
  businessId: string
  contentAssetId: string
  platform: string
  status: string
  externalPostId: string | null
  externalUrl: string | null
  publishedAt: string | null
  error: string | null
  createdAt: string
}

export interface ContentAssetRow {
  id: string
  businessId: string
  opportunityId: string | null
  assetType: string
  brief: string
  title: string
  body: string
  previewUrl: string | null
  status: string
  createdAt: string
  updatedAt: string
  publishingJobs: PublishingJobRow[]
}

export interface BusinessFull {
  id: string
  name: string
  location: string | null
  category: string | null
  website: string | null
  phase: string
  createdAt: string
  updatedAt: string
  evidence: EvidenceRow[]
  findings: FindingRow[]
  scores: ScoreSnapshotRow[]
  opportunities: OpportunityRow[]
  connections: ConnectionRow[]
  auditEvents: AuditEventRow[]
  actions: ActionRow[]
  contentAssets: ContentAssetRow[]
}

export interface BusinessListItem {
  id: string
  name: string
  location: string | null
  phase: string
  createdAt: string
  scores: { overall: number }[]
}
