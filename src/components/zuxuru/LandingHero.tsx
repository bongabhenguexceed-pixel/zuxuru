// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Shogo Technologies, Inc.
import { useState } from 'react'
import { Search, Sparkles, BarChart3, Share2, Plug, Rocket, Target, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Props {
  onDiscover: (name: string, location: string) => Promise<void>
  loading: boolean
  error: string | null
}

const FEATURES = [
  { icon: Search, title: 'DeepSearch Engine', desc: 'Scans 1000+ platforms, directories, socials, maps & more.' },
  { icon: BarChart3, title: 'Visibility Score', desc: 'Get your public score and discover your invisible gaps.' },
  { icon: Share2, title: 'Business Graph', desc: 'Zuxuru builds your digital entity, connections and authority map.' },
  { icon: Plug, title: 'Connect & Unlock', desc: 'Connect your platforms for deeper insights and control.' },
  { icon: Rocket, title: 'Autopilot Growth', desc: 'AI agents publish, optimize and grow your presence 24/7.' },
  { icon: Target, title: 'Rescore & Grow', desc: 'Track improvement and dominate your market.' },
]

export function LandingHero({ onDiscover, loading, error }: Props) {
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || loading) return
    void onDiscover(name.trim(), location.trim())
  }

  return (
    <div className="min-h-screen w-full bg-[#0a0514] text-white overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(147,51,234,0.25),_transparent_60%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(219,39,119,0.15),_transparent_50%)]" />

      <header className="relative z-10 flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 font-bold text-white">
            Z
          </div>
          <span className="text-lg font-bold tracking-tight">ZUXURU</span>
        </div>
        <div className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-purple-200 sm:flex">
          <Sparkles className="h-3 w-3 text-pink-400" />
          Autopilot is here
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6 sm:pt-16">
        <div className="mx-auto mb-4 w-fit rounded-full border border-purple-400/30 bg-purple-500/10 px-3 py-1 text-center text-[11px] font-medium tracking-wide text-purple-200 sm:text-xs">
          #1 AI-POWERED BUSINESS VISIBILITY PLATFORM
        </div>

        <h1 className="text-center text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          Be Found.
          <br />
          Be Chosen.
          <br />
          Be{' '}
          <span className="bg-gradient-to-r from-sky-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Alive
          </span>{' '}
          with Zuxuru.
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-center text-sm text-purple-100/70 sm:text-base">
          Zuxuru scans your entire digital presence, reveals your visibility score, and shows you exactly how to
          grow, rank and win online.
        </p>

        <form onSubmit={submit} className="mx-auto mt-8 flex max-w-xl flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your business name to check your visibility"
              className="h-12 rounded-xl border-0 bg-white pl-9 text-slate-900 placeholder:text-slate-400 sm:rounded-r-none"
            />
          </div>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City (optional)"
            className="h-12 w-full rounded-xl border-0 bg-white text-slate-900 placeholder:text-slate-400 sm:w-40"
          />
          <Button
            type="submit"
            disabled={loading || !name.trim()}
            className="h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 font-semibold hover:from-purple-500 hover:to-pink-500 sm:rounded-l-none"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scanning...
              </>
            ) : (
              'Check My Score →'
            )}
          </Button>
        </form>
        {error && <p className="mt-3 text-center text-sm text-red-400">{error}</p>}
        <p className="mt-3 text-center text-xs text-purple-200/50">
          It's free. No signup required. · Runs the full DISCOVER → SCORE → OPPORTUNITY loop live.
        </p>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.06]"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-purple-400/30 bg-purple-500/10">
                <f.icon className="h-5 w-5 text-purple-300" />
              </div>
              <div className="font-semibold">{f.title}</div>
              <div className="mt-1 text-sm text-purple-100/60">{f.desc}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
