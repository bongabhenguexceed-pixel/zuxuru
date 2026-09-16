// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Shogo Technologies, Inc.
import { cn } from '@/lib/cn'
import { Badge } from '@/components/ui/badge'

export function scoreColor(score: number) {
  if (score >= 70) return 'text-emerald-400'
  if (score >= 45) return 'text-amber-400'
  return 'text-red-400'
}

export function scoreBarColor(score: number) {
  if (score >= 70) return 'bg-emerald-500'
  if (score >= 45) return 'bg-amber-500'
  return 'bg-red-500'
}

export function DimensionBar({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-200">{label}</span>
        <span className={cn('font-semibold', scoreColor(score))}>{score}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={cn('h-full rounded-full transition-all', scoreBarColor(score))}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

export function AutomationBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    green: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    yellow: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    red: 'bg-red-500/15 text-red-300 border-red-500/30',
  }
  const text: Record<string, string> = {
    green: 'Auto-safe',
    yellow: 'Approval required',
    red: 'Human decision',
  }
  return (
    <Badge variant="outline" className={cn('border', map[level] ?? map.yellow)}>
      {text[level] ?? level}
    </Badge>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    pending_approval: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    approved: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    executing: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    executed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    failed: 'bg-red-500/15 text-red-300 border-red-500/30',
    success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    open: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    actioned: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    verified: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    candidate: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    reviewed: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    false_positive: 'bg-slate-500/15 text-slate-400 border-slate-500/30 line-through',
    resolved: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  }
  return (
    <Badge variant="outline" className={cn('border capitalize', map[status] ?? map.draft)}>
      {status.replace(/_/g, ' ')}
    </Badge>
  )
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  return `${days}d ago`
}
