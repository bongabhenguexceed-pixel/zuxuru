// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Shogo Technologies, Inc.
//
// Cross-cutting audit trail — every engine layer calls this so the full
// DISCOVER -> SCORE -> CONNECT -> RECOMMEND -> EXECUTE -> MONITOR loop is
// traceable end-to-end for a given business.

import { prisma } from '../db'

export async function logAudit(businessId: string, type: string, payload: Record<string, unknown>) {
  await prisma.auditEvent.create({
    data: { businessId, type, payload: JSON.stringify(payload) },
  })
}
