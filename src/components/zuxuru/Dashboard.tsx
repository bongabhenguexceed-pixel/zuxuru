// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Shogo Technologies, Inc.
import { useEffect, useState, useCallback } from 'react'
import { Loader2, Plus, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { BusinessFull, BusinessListItem } from './types'
import { zuxuruApi, type PotentialResult } from './api'
import { OverviewTab } from './OverviewTab'
import { EvidenceTab } from './EvidenceTab'
import { OpportunitiesTab } from './OpportunitiesTab'
import { ActionsTab } from './ActionsTab'
import { StudioTab } from './StudioTab'
import { MonitoringTab } from './MonitoringTab'
import { PlansTab } from './PlansTab'

export function Dashboard({ businessId, onNewBusiness }: { businessId: string; onNewBusiness: () => void }) {
  const [business, setBusiness] = useState<BusinessFull | null>(null)
  const [potential, setPotential] = useState<PotentialResult | null>(null)
  const [businesses, setBusinesses] = useState<BusinessListItem[]>([])
  const [currentId, setCurrentId] = useState(businessId)
  const [tab, setTab] = useState('overview')
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const { business, potential } = await zuxuruApi.getBusiness(currentId)
      setBusiness(business)
      setPotential(potential)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load business')
    }
  }, [currentId])

  useEffect(() => {
    void refresh()
    zuxuruApi
      .listBusinesses()
      .then((r) => setBusinesses(r.businesses))
      .catch(() => {})
  }, [refresh])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0514] text-red-400">{error}</div>
    )
  }

  if (!business) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0514] text-white">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  const latest = business.scores[business.scores.length - 1]

  return (
    <div className="min-h-screen w-full bg-[#0a0514] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(147,51,234,0.15),_transparent_60%)]" />
      <header className="relative z-10 flex flex-col gap-3 border-b border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 font-bold text-white">
            Z
          </div>
          <div>
            <div className="flex items-center gap-2 text-lg font-bold leading-tight">
              {business.name}
              {latest && (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-purple-200">
                  {latest.overall}/100
                </span>
              )}
            </div>
            <div className="text-xs text-purple-200/50">
              {business.location ?? 'Location unknown'} · phase: {business.phase}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {businesses.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex h-9 items-center gap-1.5 rounded-md border border-white/20 bg-transparent px-3 text-sm font-medium text-white hover:bg-white/10">
                Switch business <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {businesses.map((b) => (
                  <DropdownMenuItem key={b.id} onClick={() => setCurrentId(b.id)}>
                    {b.name} {b.scores[0] ? `— ${b.scores[0].overall}/100` : ''}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            size="sm"
            onClick={onNewBusiness}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New business
          </Button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6 flex w-full flex-wrap justify-start gap-1 bg-white/5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="studio">Studio</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring &amp; Rescore</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <OverviewTab business={business} potential={potential} onChanged={refresh} onGoToOpportunities={() => setTab('opportunities')} />
          </TabsContent>
          <TabsContent value="evidence">
            <EvidenceTab business={business} onChanged={refresh} />
          </TabsContent>
          <TabsContent value="opportunities">
            <OpportunitiesTab business={business} onChanged={refresh} onGoToActions={() => setTab('actions')} />
          </TabsContent>
          <TabsContent value="studio">
            <StudioTab business={business} onChanged={refresh} />
          </TabsContent>
          <TabsContent value="actions">
            <ActionsTab business={business} onChanged={refresh} />
          </TabsContent>
          <TabsContent value="monitoring">
            <MonitoringTab business={business} onChanged={refresh} />
          </TabsContent>
          <TabsContent value="plans">
            <PlansTab business={business} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
