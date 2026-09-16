// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Shogo Technologies, Inc.
import { useState } from 'react'
import { Loader2, Wand2, ShieldCheck, Send, ImageIcon, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { BusinessFull } from './types'
import { DIMENSION_LABEL } from './types'
import { StatusBadge, timeAgo } from './shared'
import { zuxuruApi } from './api'

export function StudioTab({ business, onChanged }: { business: BusinessFull; onChanged: () => void }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const openOpportunities = business.opportunities.filter((o) => o.status === 'open')
  const connectedPlatforms = business.connections.map((c) => c.platform)

  const generate = async (opportunityId: string) => {
    if (busy) return
    setBusy(opportunityId)
    setError(null)
    try {
      await zuxuruApi.generateContent(opportunityId)
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Content generation failed')
    } finally {
      setBusy(null)
    }
  }

  const approve = async (id: string) => {
    if (busy) return
    setBusy(id)
    setError(null)
    try {
      await zuxuruApi.approveContent(id)
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Approval failed')
    } finally {
      setBusy(null)
    }
  }

  const publish = async (id: string, platform: string) => {
    if (busy) return
    setBusy(id)
    setError(null)
    try {
      await zuxuruApi.publishContent(id, platform)
      onChanged()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publish failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-purple-200/70">
        <Wand2 className="h-4 w-4" />
        Creation Studio: Opportunity → Creative Brief → Asset → Approval → Publish (Distribution Engine).
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-purple-200">Generate content from an opportunity</h3>
        <div className="flex flex-wrap gap-2">
          {openOpportunities.length === 0 && (
            <p className="text-sm text-purple-200/50">No open opportunities to brief right now.</p>
          )}
          {openOpportunities.map((o) => (
            <Button
              key={o.id}
              size="sm"
              variant="outline"
              disabled={busy === o.id}
              onClick={() => generate(o.id)}
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
            >
              {busy === o.id ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Wand2 className="mr-1.5 h-3.5 w-3.5" />
              )}
              {o.title}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {business.contentAssets.map((asset) => (
          <Card key={asset.id} className="border-white/10 bg-white/[0.03] text-white">
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <StatusBadge status={asset.status} />
                  <span className="text-xs uppercase tracking-wide text-purple-200/50">{asset.assetType}</span>
                </div>
                <CardTitle className="text-base">{asset.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {asset.previewUrl && (
                <div className="overflow-hidden rounded-lg border border-white/10">
                  <img src={asset.previewUrl} alt={asset.title} className="h-40 w-full object-cover" />
                </div>
              )}
              {!asset.previewUrl && asset.assetType === 'image' && (
                <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-white/20 text-purple-200/40">
                  <ImageIcon className="h-6 w-6" />
                </div>
              )}
              <p className="whitespace-pre-line text-sm text-slate-300">{asset.body}</p>

              <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
                {asset.status === 'generated' && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy === asset.id}
                    onClick={() => approve(asset.id)}
                    className="border-white/20 bg-transparent text-white hover:bg-white/10"
                  >
                    {busy === asset.id ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Approve
                  </Button>
                )}
                {asset.status === 'approved' && (
                  <DropdownMenu key={busy === asset.id ? 'busy' : 'idle'}>
                    <DropdownMenuTrigger
                      className={`inline-flex h-9 items-center gap-1.5 rounded-md bg-gradient-to-r from-purple-600 to-pink-600 px-3 text-sm font-medium text-white hover:from-purple-500 hover:to-pink-500 ${
                        busy === asset.id ? 'pointer-events-none opacity-50' : ''
                      }`}
                    >
                      {busy === asset.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      Publish to...
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {connectedPlatforms.length === 0 && (
                        <div className="px-2 py-1.5 text-xs text-slate-400">Connect a platform first</div>
                      )}
                      {connectedPlatforms.map((p) => (
                        <DropdownMenuItem key={p} onClick={() => publish(asset.id, p)}>
                          {p}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {asset.publishingJobs.length > 0 && (
                <div className="space-y-2 border-t border-white/10 pt-3">
                  {asset.publishingJobs.map((job) => (
                    <div key={job.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-2.5 text-xs">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={job.status} />
                        <span className="text-purple-200/70">{job.platform}</span>
                      </div>
                      <div className="flex items-center gap-2 text-purple-200/50">
                        {job.externalUrl && (
                          <a href={job.externalUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-purple-300 hover:underline">
                            view <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        <span>{timeAgo(job.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {business.contentAssets.length === 0 && (
          <Card className="border-white/10 bg-white/[0.03] text-white lg:col-span-2">
            <CardContent className="py-10 text-center text-sm text-purple-200/60">
              No content generated yet — pick an opportunity above to brief the Studio.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
