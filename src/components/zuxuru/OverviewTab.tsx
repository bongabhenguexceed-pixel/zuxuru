// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Shogo Technologies, Inc.
import { useEffect, useState } from 'react'
import { Plug, Loader2, CheckCircle2, Sparkles, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { BusinessFull, Dimension } from './types'
import { DIMENSION_LABEL, DIMENSIONS } from './types'
import { DimensionBar, scoreColor } from './shared'
import { zuxuruApi, type PotentialResult } from './api'

const AVAILABLE_PLATFORMS = ['Google Business Profile', 'Website', 'Instagram', 'Facebook', 'TikTok']

function impactLabel(impact: number) {
  if (impact >= 8) return 'Very High'
  if (impact >= 6) return 'High'
  if (impact >= 4) return 'Medium'
  return 'Low'
}

function findingIcon(severity: string) {
  if (severity === 'critical' || severity === 'high') return '❌'
  return '⚠️'
}

export function OverviewTab({
  business,
  potential,
  onChanged,
  onGoToOpportunities,
}: {
  business: BusinessFull
  potential: PotentialResult | null
  onChanged: () => void
  onGoToOpportunities: () => void
}) {
  const [connecting, setConnecting] = useState<string | null>(null)
  const [fixing, setFixing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [weights, setWeights] = useState<Record<Dimension, number> | null>(null)
  const [showWeights, setShowWeights] = useState(false)
  const latest = business.scores[business.scores.length - 1]
  const connectedPlatforms = new Set(business.connections.map((c) => c.platform))
  const topOpportunity = [...business.opportunities].sort((a, b) => b.rankScore - a.rankScore)[0]

  useEffect(() => {
    zuxuruApi
      .scoringWeights()
      .then((r) => setWeights(r.weights))
      .catch(() => {})
  }, [])

  const connect = async (platform: string) => {
    if (connecting) return
    setConnecting(platform)
    setError(null)
    try {
      await zuxuruApi.connect(business.id, platform)
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connect failed')
    } finally {
      setConnecting(null)
    }
  }

  const fixTopOpportunity = async () => {
    if (fixing || !topOpportunity) return
    setFixing(true)
    setError(null)
    try {
      await zuxuruApi.recommend(topOpportunity.id)
      onChanged()
      onGoToOpportunities()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create recommendation')
    } finally {
      setFixing(false)
    }
  }

  if (!latest) return null

  const gap = potential ? potential.potential - latest.overall : null

  return (
    <div className="space-y-4">
      {/* Hero: Where am I? What's hurting me? What should I do first? */}
      <Card className="border-purple-400/20 bg-gradient-to-br from-purple-500/10 to-pink-500/5 text-white">
        <CardContent className="grid grid-cols-1 gap-6 py-6 md:grid-cols-[1fr_auto]">
          <div>
            <div className="flex flex-wrap items-end gap-x-8 gap-y-2">
              <div>
                <div className="text-xs uppercase tracking-wide text-purple-200/60">Current visibility</div>
                <div className={`text-5xl font-extrabold ${scoreColor(latest.overall)}`}>{latest.overall}%</div>
              </div>
              {potential && (
                <>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-purple-200/60">Potential visibility</div>
                    <div className="text-3xl font-bold text-purple-300">{potential.potential}%</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-purple-200/60">Visibility gap</div>
                    <div className="text-3xl font-bold text-pink-300">{gap}%</div>
                  </div>
                </>
              )}
            </div>

            {business.findings.length > 0 && (
              <div className="mt-4 space-y-1 text-sm text-slate-200">
                <span className="text-purple-200/70">You are losing visibility because:</span>
                {business.findings.slice(0, 4).map((f) => (
                  <div key={f.id} className="flex items-start gap-2">
                    <span>{findingIcon(f.severity)}</span>
                    <span>{DIMENSION_LABEL[f.dimension as Dimension] ?? f.dimension} — {f.description.split('. ')[1] ?? f.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {topOpportunity && (
            <div className="w-full max-w-xs shrink-0 rounded-xl border border-white/10 bg-black/30 p-4 md:w-72">
              <div className="text-xs uppercase tracking-wide text-purple-200/60">Your biggest opportunity</div>
              <div className="mt-1 text-base font-semibold">{topOpportunity.title}</div>
              <div className="mt-1 text-xs text-purple-200/50">
                Potential impact: <span className="font-semibold text-pink-300">{impactLabel(topOpportunity.impact)}</span>
              </div>
              <Button
                className="mt-3 w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                disabled={fixing}
                onClick={fixTopOpportunity}
              >
                {fixing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
                Fix It With AI
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-white/10 bg-white/[0.03] text-white lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-purple-200">Score Breakdown</CardTitle>
            <button
              onClick={() => setShowWeights((s) => !s)}
              className="flex items-center gap-1 text-[11px] text-purple-300/70 hover:text-purple-200"
            >
              <Info className="h-3 w-3" /> how it's calculated
            </button>
          </CardHeader>
          <CardContent>
            {showWeights && weights && (
              <div className="mb-4 rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-slate-300">
                Weighted average, not a guess — every dimension has a published weight:
                <ul className="mt-1.5 space-y-0.5">
                  {DIMENSIONS.map((d) => (
                    <li key={d} className="flex justify-between">
                      <span>{DIMENSION_LABEL[d]}</span>
                      <span className="font-mono text-purple-300">{Math.round(weights[d] * 100)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="space-y-4">
              {DIMENSIONS.map((d) => (
                <DimensionBar key={d} label={DIMENSION_LABEL[d]} score={latest[d]} />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.03] text-white lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-purple-200">
              Evidence-backed findings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {business.findings.length === 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-300">
                <CheckCircle2 className="h-4 w-4" /> No major visibility gaps detected right now.
              </div>
            )}
            {business.findings.slice(0, 6).map((f) => (
              <div key={f.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-purple-300">
                    <span>{findingIcon(f.severity)}</span>
                    {DIMENSION_LABEL[f.dimension as Dimension] ?? f.dimension}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      f.severity === 'critical'
                        ? 'bg-red-500/20 text-red-300'
                        : f.severity === 'high'
                          ? 'bg-orange-500/20 text-orange-300'
                          : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {f.severity}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-200">{f.description}</p>
              </div>
            ))}

            <div className="mt-6 border-t border-white/10 pt-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-purple-200">
                <Plug className="h-4 w-4" /> Connect platforms for deeper analysis
              </div>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_PLATFORMS.map((p) => {
                  const isConnected = connectedPlatforms.has(p)
                  return (
                    <Button
                      key={p}
                      size="sm"
                      variant={isConnected ? 'secondary' : 'outline'}
                      disabled={isConnected || connecting === p}
                      onClick={() => connect(p)}
                      className={isConnected ? '' : 'border-white/20 bg-transparent text-white hover:bg-white/10'}
                    >
                      {connecting === p ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : isConnected ? (
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
                      ) : null}
                      {p}
                    </Button>
                  )
                })}
              </div>
              {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
