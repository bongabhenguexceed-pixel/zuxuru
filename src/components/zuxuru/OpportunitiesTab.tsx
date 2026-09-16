// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Shogo Technologies, Inc.
import { useState } from 'react'
import { Loader2, Sparkles, TrendingUp, Search, Target, Lightbulb } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { BusinessFull, Dimension } from './types'
import { DIMENSION_LABEL } from './types'
import { StatusBadge } from './shared'
import { zuxuruApi } from './api'

function impactLabel(impact: number) {
  if (impact >= 8) return 'Very High'
  if (impact >= 6) return 'High'
  if (impact >= 4) return 'Medium'
  return 'Low'
}

export function OpportunitiesTab({
  business,
  onChanged,
  onGoToActions,
}: {
  business: BusinessFull
  onChanged: () => void
  onGoToActions: () => void
}) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const opportunities = [...business.opportunities].sort((a, b) => b.rankScore - a.rankScore)
  const actionedOpportunityIds = new Set(business.actions.map((a) => a.opportunityId))

  const recommend = async (id: string) => {
    if (busy) return
    setBusy(id)
    setError(null)
    try {
      await zuxuruApi.recommend(id)
      onChanged()
      onGoToActions()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create recommendation')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-purple-200/70">
        <TrendingUp className="h-4 w-4" />
        Ranked by Impact × Confidence × Business Relevance ÷ Effort — highest value first.
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {opportunities.length === 0 && (
        <Card className="border-white/10 bg-white/[0.03] text-white">
          <CardContent className="py-8 text-center text-sm text-purple-200/60">
            No open opportunities right now — visibility is healthy across all dimensions.
          </CardContent>
        </Card>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {opportunities.map((o, idx) => {
          const hasAction = actionedOpportunityIds.has(o.id)
          const finding = business.findings.find((f) => f.dimension === o.dimension)
          const evidence = business.evidence.find((e) => e.dimension === o.dimension)
          return (
            <Card key={o.id} className="border-white/10 bg-white/[0.03] text-white">
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge className="border-purple-500/30 bg-purple-500/15 text-purple-200">#{idx + 1}</Badge>
                    <Badge variant="outline" className="border-white/20 text-slate-300">
                      {DIMENSION_LABEL[o.dimension as Dimension] ?? o.dimension}
                    </Badge>
                    <StatusBadge status={o.status} />
                  </div>
                  <CardTitle className="text-base">{o.title}</CardTitle>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-pink-300">{o.rankScore.toFixed(1)}</div>
                  <div className="text-[10px] uppercase tracking-wide text-purple-200/50">rank score</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {finding && (
                  <div className="flex gap-2">
                    <Search className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                    <div>
                      <span className="font-semibold text-purple-200">Finding: </span>
                      <span className="text-slate-300">{finding.description}</span>
                    </div>
                  </div>
                )}
                {evidence && (
                  <div className="rounded-lg border border-white/10 bg-black/20 p-2.5 text-xs text-slate-400">
                    <span className="font-semibold text-purple-300">Evidence: </span>
                    {evidence.normalizedFinding}
                    <span className="ml-1 text-purple-200/50">({evidence.source}, {(evidence.confidence * 100).toFixed(0)}% confidence)</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 shrink-0 text-pink-400" />
                  <span className="font-semibold text-purple-200">Impact: </span>
                  <span className="text-slate-300">{impactLabel(o.impact)}</span>
                </div>
                <div>
                  <span className="font-semibold text-purple-200">Recommendation: </span>
                  <span className="text-slate-300">{o.description}</span>
                </div>
                {o.expectedOutcome && (
                  <div className="flex gap-2">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    <div>
                      <span className="font-semibold text-purple-200">Expected outcome: </span>
                      <span className="text-slate-300">{o.expectedOutcome}</span>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <Metric label="Impact" value={o.impact} />
                  <Metric label="Confidence" value={o.confidence} />
                  <Metric label="Relevance" value={o.relevance} />
                  <Metric label="Effort" value={o.effort} />
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                  disabled={hasAction || busy === o.id}
                  onClick={() => recommend(o.id)}
                >
                  {busy === o.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  {hasAction ? 'Recommendation created' : 'Fix it with Zuxuru'}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 py-2">
      <div className="font-semibold text-white">{value.toFixed(1)}</div>
      <div className="text-[10px] uppercase tracking-wide text-purple-200/50">{label}</div>
    </div>
  )
}
