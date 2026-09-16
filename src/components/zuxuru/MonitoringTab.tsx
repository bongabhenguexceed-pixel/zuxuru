// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Shogo Technologies, Inc.
import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { RadarIcon, Loader2, Activity, ListChecks } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { BusinessFull } from './types'
import { DIMENSION_LABEL } from './types'
import { timeAgo } from './shared'
import { zuxuruApi } from './api'

export function MonitoringTab({ business, onChanged }: { business: BusinessFull; onChanged: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<Awaited<ReturnType<typeof zuxuruApi.monitor>> | null>(null)

  const executedCount = business.actions.filter((a) => a.status === 'executed').length

  const runMonitor = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await zuxuruApi.monitor(business.id)
      setLastResult(result)
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Monitoring failed')
    } finally {
      setLoading(false)
    }
  }

  const chartData = business.scores.map((s, i) => ({
    label: `#${i + 1} (${s.phase})`,
    overall: s.overall,
    createdAt: s.createdAt,
  }))

  return (
    <div className="space-y-4">
      <Card className="border-white/10 bg-white/[0.03] text-white">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-purple-200">
            <Activity className="h-4 w-4" /> Rescore & Proof — visibility over time
          </CardTitle>
          <Button
            size="sm"
            disabled={loading || executedCount === 0}
            onClick={runMonitor}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
          >
            {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RadarIcon className="mr-1.5 h-3.5 w-3.5" />}
            Reinvestigate & Rescore
          </Button>
        </CardHeader>
        <CardContent>
          {executedCount === 0 && (
            <p className="mb-3 text-xs text-purple-200/50">
              Execute at least one approved action first — monitoring watches the effect of real executions.
            </p>
          )}
          {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: '#170a28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                  labelStyle={{ color: '#e9d5ff' }}
                />
                <Line type="monotone" dataKey="overall" stroke="#d946ef" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {lastResult && (
            <div className="mt-4 rounded-xl border border-purple-400/20 bg-purple-500/5 p-4">
              <div className="text-2xl font-bold">
                {lastResult.previousOverall} <span className="text-purple-300/70">→</span> {lastResult.newOverall}{' '}
                <span className={lastResult.delta >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  ({lastResult.delta >= 0 ? '+' : ''}
                  {lastResult.delta})
                </span>
              </div>
              <div className="mt-2 space-y-1 text-sm text-slate-300">
                <p>
                  <span className="font-semibold text-purple-200">What improved: </span>
                  {lastResult.improvedDimensions.length
                    ? lastResult.improvedDimensions
                        .map((d) => DIMENSION_LABEL[d as keyof typeof DIMENSION_LABEL] ?? d)
                        .join(', ')
                    : 'No dimension change detected yet.'}
                </p>
                <p>
                  <span className="font-semibold text-purple-200">Still weak: </span>
                  {lastResult.stillWeakDimensions.length
                    ? lastResult.stillWeakDimensions
                        .map((d) => DIMENSION_LABEL[d as keyof typeof DIMENSION_LABEL] ?? d)
                        .join(', ')
                    : 'Nothing critical remaining.'}
                </p>
                <p>
                  <span className="font-semibold text-purple-200">What happens next: </span>
                  {lastResult.nextOpportunity
                    ? lastResult.nextOpportunity.title
                    : 'No open opportunities — keep monitoring for decay.'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/[0.03] text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-purple-200">
            <ListChecks className="h-4 w-4" /> Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {business.auditEvents.map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs">
              <span className="font-mono text-purple-200">{e.type}</span>
              <span className="text-purple-200/50">{timeAgo(e.createdAt)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
