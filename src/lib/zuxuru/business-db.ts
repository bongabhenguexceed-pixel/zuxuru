// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Shogo Technologies, Inc.
//
// LAYER 1 — BUSINESS DATABASE
//
// Stores: Business, Website, Location, Industry, Platforms (Connections),
// Visibility history (ScoreSnapshots). This is the single source of truth
// every other engine layer reads from / writes to. No investigation,
// scoring, or opportunity logic lives here — only persistence.

import { prisma } from '../db'

export function createBusiness(name: string, location?: string, category?: string) {
  return prisma.business.create({
    data: { name, location, category, phase: 'public' },
  })
}

export function getBusinessOrThrow(businessId: string) {
  return prisma.business.findUniqueOrThrow({ where: { id: businessId } })
}

export function setBusinessPhase(businessId: string, phase: string) {
  return prisma.business.update({ where: { id: businessId }, data: { phase } })
}

export function listBusinesses() {
  return prisma.business.findMany({
    orderBy: { createdAt: 'desc' },
    include: { scores: { orderBy: { createdAt: 'desc' }, take: 1 } },
  })
}

export function getBusinessFull(businessId: string) {
  return prisma.business.findUnique({
    where: { id: businessId },
    include: {
      evidence: { orderBy: { createdAt: 'desc' } },
      findings: { orderBy: { createdAt: 'desc' } },
      scores: { orderBy: { createdAt: 'asc' } },
      opportunities: { orderBy: { rankScore: 'desc' } },
      connections: { orderBy: { connectedAt: 'desc' } },
      auditEvents: { orderBy: { createdAt: 'desc' }, take: 30 },
      actions: {
        orderBy: { createdAt: 'desc' },
        include: { opportunity: true, executions: { orderBy: { createdAt: 'desc' } } },
      },
      contentAssets: {
        orderBy: { createdAt: 'desc' },
        include: { publishingJobs: { orderBy: { createdAt: 'desc' } } },
      },
    },
  })
}
