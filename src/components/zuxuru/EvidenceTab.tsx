// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Shogo Technologies, Inc.
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { BusinessFull, FindingRow } from './types'
import { DIMENSION_LABEL } from './types'
import { StatusBadge, timeAgo } from './shared'
import { zuxuruApi } from './api'
import { Database, ShieldAlert, Check, EyeOff, RotateCcw, Repeat2 } from 'lucide-react'

const SEVERITY_STYLE: Record<string, string> = {
  critical: 'border-red-500/40 text-red-300',
  high: 'border-orange-500/40 text-orange-300',
  medium: 'border-amber-500/40 text-amber-300',
  low: 'border-slate-500/40 text-slate-300',
}

function FindingCard({ finding, onChanged }: { finding: FindingRow; onChanged: () => void }) {
  const [note, setNote] = useState(finding.reviewNote ?? '')
  const [busy, setBusy] = useState(false)
  const [showNote, setShowNote] = useState(false)

  const review = async (status: 'reviewed' | 'false_positive' | 'resolved' | 'open') => {
    setBusy(true)
    try {
      await zuxuruApi.reviewFinding(finding.id, status, note || undefined)
      onChanged()
    } finally {
      setBusy(false)
      setShowNote(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={SEVERITY_STYLE[finding.severity] ?? SEVERITY_STYLE.medium}>
          {finding.severity}
        </Badge>
        <Badge variant="outline" className="border-white/20 text-slate-300">
          {DIMENSION_LABEL[finding.dimension as keyof typeof DIMENSION_LABEL] ?? finding.dimension}
        </Badge>
        <StatusBadge status={finding.status} />
        {finding.occurrenceCount > 1 && (
          <span className="flex items-center gap-1 text-xs text-purple-200/60">
            <Repeat2 className="h-3 w-3" /> seen {finding.occurrenceCount}x
          </span>
        )}
        <span className="ml-auto text-xs text-purple-200/40">{timeAgo(finding.lastSeenAt)}</span>
      </div>
      <p className="text-sm text-slate-200">{finding.description}</p>
      {finding.reviewNote && (
        <p className="rounded-md bg-white/5 px-2 py-1 text-xs text-purple-200/70">
          Review note ({finding.reviewedBy ?? 'reviewer'}): {finding.reviewNote}
        </p>
      )}

      {showNote && (
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note explaining this review decision..."
          className="border-white/10 bg-white/5 text-sm text-white"
        />
      )}

      <div className="flex flex-wrap gap-2">
        {finding.status !== 'reviewed' && (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            className="border-sky-500/30 text-sky-200 hover:bg-sky-500/10"
            onClick={() => review('reviewed')}
          >
            <Check className="mr-1 h-3.5 w-3.5" /> Confirm real
          </Button>
        )}
        {finding.status !== 'false_positive' && (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            className="border-slate-500/30 text-slate-300 hover:bg-white/10"
            onClick={() => (showNote ? review('false_positive') : setShowNote(true))}
          >
            <EyeOff className="mr-1 h-3.5 w-3.5" /> Mark false positive
          </Button>
        )}
        {finding.status !== 'resolved' && (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
            onClick={() => review('resolved')}
          >
            <ShieldAlert className="mr-1 h-3.5 w-3.5" /> Mark resolved
          </Button>
        )}
        {finding.status !== 'open' && (
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            className="text-purple-200/60 hover:bg-white/10"
            onClick={() => review('open')}
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reopen
          </Button>
        )}
      </div>
    </div>
  )
}

export function EvidenceTab({ business, onChanged }: { business: BusinessFull; onChanged?: () => void }) {
  const findings = business.findings
  const openCount = findings.filter((f) => f.status === 'open').length
  const suppressedCount = findings.filter((f) => f.status === 'false_positive').length

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm text-purple-200/70">
          <ShieldAlert className="h-4 w-4" />
          Findings — deduped across rescans. {openCount} open · {suppressedCount} dismissed as false positive.
        </div>
        <Card className="border-white/10 bg-white/[0.03] text-white">
          <CardContent className="divide-y divide-white/5 p-0">
            {findings.map((f) => (
              <FindingCard key={f.id} finding={f} onChanged={() => onChanged?.()} />
            ))}
            {findings.length === 0 && (
              <div className="p-8 text-center text-sm text-purple-200/60">No findings — every dimension is above threshold.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2 text-sm text-purple-200/70">
          <Database className="h-4 w-4" />
          Normalized evidence from the Investigation Engine — every score is traceable back to a source.
        </div>
        <Card className="border-white/10 bg-white/[0.03] text-white">
          <CardContent className="divide-y divide-white/5 p-0">
            {business.evidence.map((e) => (
              <div key={e.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="border-purple-400/30 text-purple-200">
                      {e.source}
                    </Badge>
                    <Badge variant="outline" className="border-white/20 text-slate-300">
                      {DIMENSION_LABEL[e.dimension as keyof typeof DIMENSION_LABEL] ?? e.dimension}
                    </Badge>
                    {e.platform && (
                      <span className="text-xs text-purple-200/60">{e.platform}</span>
                    )}
                    <StatusBadge status={e.verificationStatus} />
                  </div>
                  <p className="text-sm text-slate-200">{e.normalizedFinding}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs text-purple-200/50">
                  <span>confidence {(e.confidence * 100).toFixed(0)}%</span>
                  <span>{timeAgo(e.retrievedAt)}</span>
                </div>
              </div>
            ))}
            {business.evidence.length === 0 && (
              <div className="p-8 text-center text-sm text-purple-200/60">No evidence collected yet.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
