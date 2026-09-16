// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Shogo Technologies, Inc.
/**
 * Custom API Routes
 *
 * This file is the editable surface for custom backend logic that
 * doesn't fit the auto-generated CRUD model (per-model GET/POST/PATCH/
 * DELETE under `/api/<model>s`). Anything you mount on the exported
 * Hono app shows up at `/api/...` alongside the generated CRUD routes.
 */

import { Hono } from 'hono'
import { prisma } from './src/lib/db'
import {
  runDiscovery,
  connectPlatform,
  createActionFromOpportunity,
  approveAction,
  executeAction,
  monitorAndRescore,
  generateContentAsset,
  approveContentAsset,
  publishContentAsset,
  computePotential,
  reviewFinding,
  listReviewQueue,
  DIMENSION_WEIGHTS,
  PLATFORM_OPTIONS,
  type Dimension,
  type FindingReviewStatus,
} from './src/lib/zuxuru'

const app = new Hono()

// ---------------------------------------------------------------------
// ZUXURU — Business Visibility Operating System API
// Mounted under /api/zuxuru/*
// ---------------------------------------------------------------------

app.get('/zuxuru/platforms', (c) => c.json({ platforms: PLATFORM_OPTIONS }))

app.get('/zuxuru/scoring-weights', (c) => c.json({ weights: DIMENSION_WEIGHTS }))

app.get('/zuxuru/businesses', async (c) => {
  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: 'desc' },
    include: { scores: { orderBy: { createdAt: 'desc' }, take: 1 } },
  })
  return c.json({ businesses })
})

app.post('/zuxuru/discover', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const name = (body?.name ?? '').toString().trim()
  if (!name) return c.json({ error: 'Business name is required' }, 400)
  const location = body?.location ? String(body.location) : undefined
  const category = body?.category ? String(body.category) : undefined
  try {
    const businessId = await runDiscovery(name, location, category)
    return c.json({ businessId })
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Discovery failed' }, 500)
  }
})

app.get('/zuxuru/businesses/:id', async (c) => {
  const id = c.req.param('id')
  const business = await prisma.business.findUnique({
    where: { id },
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
  if (!business) return c.json({ error: 'Business not found' }, 404)

  const latest = business.scores[business.scores.length - 1]
  let potential: { potential: number; potentialScores: Record<Dimension, number> } | null = null
  if (latest) {
    const scores = Object.fromEntries(
      (Object.keys(DIMENSION_WEIGHTS) as Dimension[]).map((d) => [d, (latest as unknown as Record<string, number>)[d]])
    ) as Record<Dimension, number>
    potential = await computePotential(id, scores)
  }

  return c.json({ business, potential })
})

app.post('/zuxuru/businesses/:id/connect', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({}))
  const platform = (body?.platform ?? '').toString().trim()
  if (!platform) return c.json({ error: 'platform is required' }, 400)
  try {
    const result = await connectPlatform(id, platform, body?.accountHandle)
    return c.json({ ok: true, ...result })
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Connect failed' }, 500)
  }
})

app.post('/zuxuru/opportunities/:id/recommend', async (c) => {
  const id = c.req.param('id')
  try {
    const action = await createActionFromOpportunity(id)
    return c.json({ action })
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Failed to create recommendation' }, 500)
  }
})

app.post('/zuxuru/actions/:id/approve', async (c) => {
  const id = c.req.param('id')
  try {
    const action = await approveAction(id)
    return c.json({ action })
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Approval failed' }, 400)
  }
})

app.post('/zuxuru/actions/:id/execute', async (c) => {
  const id = c.req.param('id')
  try {
    const record = await executeAction(id)
    return c.json({ record })
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Execution failed' }, 400)
  }
})

// Findings review queue — dedup collapses repeat rescans into one row,
// this surfaces what still needs a human decision (open) ranked by how
// often it keeps recurring. Optional ?businessId= to scope to one business.
app.get('/zuxuru/findings/review-queue', async (c) => {
  const businessId = c.req.query('businessId') || undefined
  try {
    const findings = await listReviewQueue(businessId)
    return c.json({ findings })
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Failed to load review queue' }, 500)
  }
})

app.post('/zuxuru/findings/:id/review', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({}))
  const status = (body?.status ?? '').toString().trim() as FindingReviewStatus
  const validStatuses: FindingReviewStatus[] = ['reviewed', 'false_positive', 'resolved', 'open']
  if (!validStatuses.includes(status)) {
    return c.json({ error: `status must be one of: ${validStatuses.join(', ')}` }, 400)
  }
  const reviewedBy = body?.reviewedBy ? String(body.reviewedBy) : undefined
  const reviewNote = body?.reviewNote ? String(body.reviewNote) : undefined
  try {
    const finding = await reviewFinding(id, status, reviewedBy, reviewNote)
    return c.json({ finding })
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Review failed' }, 400)
  }
})

app.post('/zuxuru/businesses/:id/monitor', async (c) => {
  const id = c.req.param('id')
  try {
    const result = await monitorAndRescore(id)
    return c.json(result)
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Monitoring failed' }, 400)
  }
})

app.post('/zuxuru/opportunities/:id/generate-content', async (c) => {
  const id = c.req.param('id')
  try {
    const asset = await generateContentAsset(id)
    return c.json({ asset })
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Content generation failed' }, 500)
  }
})

app.post('/zuxuru/content/:id/approve', async (c) => {
  const id = c.req.param('id')
  try {
    const asset = await approveContentAsset(id)
    return c.json({ asset })
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Approval failed' }, 400)
  }
})

app.post('/zuxuru/content/:id/publish', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({}))
  const platform = (body?.platform ?? '').toString().trim()
  if (!platform) return c.json({ error: 'platform is required' }, 400)
  try {
    const job = await publishContentAsset(id, platform)
    return c.json({ job })
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Publish failed' }, 400)
  }
})

export default app
