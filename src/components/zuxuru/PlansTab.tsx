// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Shogo Technologies, Inc.
import { useState } from 'react'
import { Check, HandCoins } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import type { BusinessFull } from './types'

const PLANS = [
  {
    id: 'foundation',
    name: 'Visibility Foundation',
    price: 'R1,999',
    period: '/month',
    tagline: 'Know exactly where you stand and what to fix first.',
    features: [
      'Full Discover → Score → Diagnose scan, refreshed monthly',
      'Evidence-backed findings (not guesses)',
      'Top 3 ranked opportunities',
      'Monthly rescore + progress tracking',
    ],
  },
  {
    id: 'operations',
    name: 'AI Visibility Operations',
    price: 'R3,999',
    period: '/month',
    tagline: 'Zuxuru fixes the highest-value gaps for you.',
    features: [
      'Everything in Foundation',
      'Connect Google, website & 1 social platform',
      'AI Studio: monthly content generated & approved',
      'Autopilot publishes green-tier actions automatically',
    ],
    highlight: true,
  },
  {
    id: 'growth',
    name: 'AI Brand & Growth Operations',
    price: 'R6,999',
    period: '/month',
    tagline: 'Full autopilot across every platform you have.',
    features: [
      'Everything in Operations',
      'Unlimited connected platforms',
      'Weekly content cadence + campaign creation',
      'Priority opportunity execution & dedicated rescoring cadence',
    ],
  },
]

export function PlansTab({ business }: { business: BusinessFull }) {
  const [chosen, setChosen] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2 text-sm text-purple-200/70">
        <HandCoins className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          These prices are a <span className="text-purple-200">willingness-to-pay test</span>, not a final price
          list. Choosing a plan here does not charge anything — it tells us which package a real owner would
          actually buy, which is stronger evidence than a compliment.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={cn(
              'border-white/10 bg-white/[0.03] text-white',
              plan.highlight && 'border-purple-400/40 bg-purple-500/[0.06] ring-1 ring-purple-400/30'
            )}
          >
            <CardHeader>
              {plan.highlight && (
                <span className="mb-2 w-fit rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                  Most tested
                </span>
              )}
              <CardTitle className="text-base">{plan.name}</CardTitle>
              <div className="flex items-baseline gap-1 pt-1">
                <span className="text-3xl font-extrabold">{plan.price}</span>
                <span className="text-sm text-purple-200/50">{plan.period}</span>
              </div>
              <p className="pt-1 text-sm text-purple-200/60">{plan.tagline}</p>
            </CardHeader>
            <CardContent>
              <ul className="mb-4 space-y-2 text-sm text-slate-300">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className={cn(
                  'w-full',
                  plan.highlight
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
                    : 'border border-white/20 bg-transparent text-white hover:bg-white/10'
                )}
                onClick={() => setChosen(plan.id)}
              >
                {chosen === plan.id ? 'Noted — thank you' : `I'd choose ${plan.name}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {chosen && (
        <Card className="border-emerald-500/20 bg-emerald-500/5 text-white">
          <CardContent className="py-4 text-sm text-emerald-300">
            Recorded: for {business.name}, the tested preference is{' '}
            <strong>{PLANS.find((p) => p.id === chosen)?.name}</strong> at{' '}
            <strong>{PLANS.find((p) => p.id === chosen)?.price}/month</strong>. In a live launch this is the moment
            to ask for a card, not a "maybe" — actual payment is the only validation that counts.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
