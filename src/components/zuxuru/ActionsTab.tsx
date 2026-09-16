// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Shogo Technologies, Inc.
import { useState } from 'react'
import { Loader2, ShieldCheck, Zap, History } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { BusinessFull } from './types'
import { AutomationBadge, StatusBadge, timeAgo } from './shared'
import { zuxuruApi } from './api'

export function ActionsTab({ business, onChanged }: { business: BusinessFull; onChanged: () => void }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const approve = async (id: string) => {
    if (busy) return
    setBusy(id)
    setError(null)
    try {
      await zuxuruApi.approve(id)
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Approval failed')
    } finally {
      setBusy(null)
    }
  }

  const execute = async (id: string) => {
    if (busy) return
    setBusy(id)
    setError(null)
    try {
      await zuxuruApi.execute(id)
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Execution failed')
    } finally {
      setBusy(null)
    }
  }

  if (business.actions.length === 0) {
    return (
      <Card className="border-white/10 bg-white/[0.03] text-white">
        <CardContent className="py-10 text-center text-sm text-purple-200/60">
          No recommendations yet. Go to Opportunities and create one to start the approval → execution loop.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-400">{error}</p>}
      {business.actions.map((a) => (
        <Card key={a.id} className="border-white/10 bg-white/[0.03] text-white">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <AutomationBadge level={a.automationLevel} />
                <StatusBadge status={a.status} />
              </div>
              <CardTitle className="text-base">{a.title}</CardTitle>
            </div>
            <div className="flex gap-2">
              {a.status === 'pending_approval' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/20 bg-transparent text-white hover:bg-white/10"
                  disabled={busy === a.id}
                  onClick={() => approve(a.id)}
                >
                  {busy === a.id ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Approve
                </Button>
              )}
              {a.status === 'approved' && (
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                  disabled={busy === a.id}
                  onClick={() => execute(a.id)}
                >
                  {busy === a.id ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Zap className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Execute
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-300">{a.description}</p>
            {a.executions.length > 0 && (
              <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-purple-200">
                  <History className="h-3.5 w-3.5" /> Execution history
                </div>
                {a.executions.map((e) => (
                  <div key={e.id} className="rounded-lg border border-white/10 bg-black/20 p-2.5 text-xs">
                    <div className="mb-1 flex items-center justify-between">
                      <StatusBadge status={e.status} />
                      <span className="text-purple-200/50">{timeAgo(e.executedAt)}</span>
                    </div>
                    <p className="text-slate-300">{e.resultSummary}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
