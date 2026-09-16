// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Shogo Technologies, Inc.
import { useState } from 'react'
import { LandingHero } from '@/components/zuxuru/LandingHero'
import { Dashboard } from '@/components/zuxuru/Dashboard'
import { zuxuruApi } from '@/components/zuxuru/api'

export default function App() {
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDiscover = async (name: string, location: string) => {
    setLoading(true)
    setError(null)
    try {
      const { businessId } = await zuxuruApi.discover(name, location || undefined)
      setBusinessId(businessId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Discovery failed — please try again')
    } finally {
      setLoading(false)
    }
  }

  if (!businessId) {
    return <LandingHero onDiscover={handleDiscover} loading={loading} error={error} />
  }

  return <Dashboard businessId={businessId} onNewBusiness={() => setBusinessId(null)} />
}
