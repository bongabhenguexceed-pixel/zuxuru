// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Shogo Technologies, Inc.
//
// LAYER 5 — AI EXECUTION LAYER
//
// Creates/executes approved actions. Instead of "your Instagram needs
// improvement", this layer says "I'll fix it": generates content,
// schedules/publishes it, and optimizes profiles.

import { prisma } from '../db'
import { rng, slugHandle } from './random'
import { OPPORTUNITY_TEMPLATES } from './opportunity-engine'
import type { Dimension } from './scoring-engine'
import { DIMENSION_LABEL } from './scoring-engine'
import { logAudit } from './audit'

export async function createActionFromOpportunity(opportunityId: string) {
  const opp = await prisma.opportunity.findUniqueOrThrow({ where: { id: opportunityId } })
  const tpl = OPPORTUNITY_TEMPLATES[opp.dimension as Dimension]
  const automationLevel = tpl?.automationLevel ?? 'yellow'
  const status = automationLevel === 'green' ? 'approved' : 'pending_approval'
  const action = await prisma.action.create({
    data: {
      businessId: opp.businessId,
      opportunityId: opp.id,
      title: `Recommendation: ${opp.title}`,
      description: opp.description,
      automationLevel,
      status,
      approvedAt: status === 'approved' ? new Date() : null,
    },
  })
  await logAudit(opp.businessId, 'recommendation.created', { opportunityId, automationLevel, status })
  return action
}

export async function approveAction(actionId: string) {
  const action = await prisma.action.findUniqueOrThrow({ where: { id: actionId } })
  if (action.status !== 'pending_approval') {
    throw new Error(`Action cannot be approved from status "${action.status}"`)
  }
  const updated = await prisma.action.update({
    where: { id: actionId },
    data: { status: 'approved', approvedAt: new Date() },
  })
  await logAudit(action.businessId, 'action.approved', { actionId })
  return updated
}

export async function executeAction(actionId: string) {
  const action = await prisma.action.findUniqueOrThrow({ where: { id: actionId }, include: { opportunity: true } })
  if (action.status !== 'approved') {
    throw new Error(`Action cannot be executed from status "${action.status}" — approval required first`)
  }
  await prisma.action.update({ where: { id: actionId }, data: { status: 'executing' } })

  const rand = rng(`${actionId}|execute`)
  const success = rand() > 0.08
  await prisma.action.update({
    where: { id: actionId },
    data: { status: success ? 'executed' : 'failed' },
  })
  const record = await prisma.executionRecord.create({
    data: {
      actionId,
      businessId: action.businessId,
      status: success ? 'success' : 'failed',
      resultSummary: success
        ? `Executed via Execution Engine: "${action.title}". Change is now live and queued for monitoring.`
        : `Execution failed via connector for "${action.title}". Will retry on next approval.`,
    },
  })
  if (success) {
    await prisma.opportunity.update({ where: { id: action.opportunityId }, data: { status: 'actioned' } })
  }
  await logAudit(action.businessId, 'execution.completed', { actionId, success })
  return record
}

function buildCreativeBody(dim: Dimension, businessName: string, oppTitle: string) {
  const bodies: Record<Dimension, string> = {
    discoverability: `📍 ${businessName} is here! Find us on Google Maps and see why locals choose us. #${businessName.replace(/\s+/g, '')}`,
    clarity: `${businessName} — clear, simple, and built for you. Here's exactly what we offer and how to get started today.`,
    trust: `Loved by our customers 💬 "${businessName} exceeded expectations." Leave us a review and tell us your story.`,
    activity: `We're back with fresh updates from ${businessName}! Here's what's new this week — swipe through to see more.`,
    consistency: `Same great ${businessName}, everywhere you find us. Updated details across every listing so you always reach the right place.`,
    conversion: `Ready when you are — book with ${businessName} in one tap. Link in bio, or just message us now.`,
    aiVisibility: `${businessName} — consistent facts, clear services, and real reviews published everywhere, so when someone asks an AI assistant for a recommendation, we're the answer.`,
  }
  return `${bodies[dim]}\n\n(Creative brief: ${oppTitle})`
}

export async function generateContentAsset(opportunityId: string) {
  const opp = await prisma.opportunity.findUniqueOrThrow({
    where: { id: opportunityId },
    include: { business: true },
  })
  const dim = opp.dimension as Dimension
  const assetType =
    dim === 'clarity' || dim === 'consistency' ? 'website_copy' : dim === 'discoverability' ? 'image' : 'social_post'
  const rand = rng(`${opp.businessId}|${opportunityId}|studio|${Date.now()}`)
  const title = `${DIMENSION_LABEL[dim]} content — ${opp.business.name}`
  const body = buildCreativeBody(dim, opp.business.name, opp.title)
  const previewUrl =
    assetType === 'image' ? `https://picsum.photos/seed/${slugHandle(opp.business.name)}${Math.floor(rand() * 1000)}/640/400` : null

  const asset = await prisma.contentAsset.create({
    data: {
      businessId: opp.businessId,
      opportunityId: opp.id,
      assetType,
      brief: opp.description,
      title,
      body,
      previewUrl,
      status: 'generated',
    },
  })
  await logAudit(opp.businessId, 'studio.asset.generated', { opportunityId, assetType })
  return asset
}

export async function approveContentAsset(id: string) {
  const asset = await prisma.contentAsset.findUniqueOrThrow({ where: { id } })
  if (asset.status !== 'generated') {
    throw new Error(`Content cannot be approved from status "${asset.status}"`)
  }
  const updated = await prisma.contentAsset.update({ where: { id }, data: { status: 'approved' } })
  await logAudit(asset.businessId, 'studio.asset.approved', { id })
  return updated
}

export async function publishContentAsset(id: string, platform: string) {
  const asset = await prisma.contentAsset.findUniqueOrThrow({ where: { id } })
  if (asset.status !== 'approved') {
    throw new Error('Content must be approved before publishing')
  }
  const connection = await prisma.connection.findFirst({ where: { businessId: asset.businessId, platform } })
  if (!connection) {
    throw new Error(`Connect ${platform} before publishing to it`)
  }

  const rand = rng(`${id}|publish|${platform}`)
  const success = rand() > 0.06
  const job = await prisma.publishingJob.create({
    data: {
      businessId: asset.businessId,
      contentAssetId: id,
      platform,
      status: success ? 'published' : 'failed',
      externalPostId: success ? `post_${Math.floor(rand() * 1e8)}` : null,
      externalUrl: success ? `https://${platform.toLowerCase().replace(/\s+/g, '')}.com/p/${slugHandle(asset.title)}` : null,
      publishedAt: success ? new Date() : null,
      error: success ? null : 'Connector timeout — will retry on next approval.',
    },
  })

  if (success) {
    await prisma.contentAsset.update({ where: { id }, data: { status: 'published' } })
    if (asset.opportunityId) {
      const action = await prisma.action.create({
        data: {
          businessId: asset.businessId,
          opportunityId: asset.opportunityId,
          title: `Published: ${asset.title}`,
          description: `Distribution Engine published approved content to ${platform}.`,
          automationLevel: 'green',
          status: 'executed',
          approvedAt: new Date(),
        },
      })
      await prisma.executionRecord.create({
        data: {
          actionId: action.id,
          businessId: asset.businessId,
          status: 'success',
          resultSummary: `Published to ${platform}: ${job.externalUrl}`,
          externalRef: job.externalPostId ?? undefined,
        },
      })
      await prisma.opportunity.update({ where: { id: asset.opportunityId }, data: { status: 'actioned' } })
    }
  }
  await logAudit(asset.businessId, 'publishing.completed', { id, platform, success })
  return job
}
