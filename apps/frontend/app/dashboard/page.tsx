'use client'

import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import {
  Gavel,
  Trophy,
  TrendingUp,
  DollarSign,
  Radio,
  ArrowUpRight,
} from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/shell'
import { StatCard } from '@/components/dashboard/stat-card'
import { AreaChart, BarChart, DonutChart } from '@/components/dashboard/charts'
import { LiveFeed } from '@/components/dashboard/live-feed'
import { CountdownInline } from '@/components/countdown'
import { auctionsApi } from '@/lib/api/auctions'
import { bidsApi } from '@/lib/api/bids'
import { formatCurrency } from '@/lib/utils'

const revenueSeries = [18, 24, 21, 32, 28, 41, 38, 52, 47, 63, 58, 72]
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
const bidsPerMonth = [42, 58, 49, 71, 63, 88, 76]

function getEndsInMs(endsAt: string): number {
  return Math.max(0, new Date(endsAt).getTime() - Date.now())
}

export default function DashboardPage() {
  const { data: endingData } = useQuery({
    queryKey: ['auctions', 'ending-soon'],
    queryFn: () => auctionsApi.getEndingSoon(),
    staleTime: 30_000,
  })

  const endingSoon = endingData?.data || []

  return (
    <DashboardShell title="Dashboard" subtitle="Welcome back — here is your auction activity">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Auctions"
          value="128"
          delta="12.4%"
          icon={Gavel}
          accent="oklch(0.62 0.22 295)"
          spark={[10, 14, 12, 18, 16, 22, 26]}
        />
        <StatCard
          label="Won Auctions"
          value="47"
          delta="8.1%"
          icon={Trophy}
          accent="oklch(0.72 0.16 165)"
          spark={[6, 8, 7, 11, 10, 14, 17]}
        />
        <StatCard
          label="Active Bids"
          value="19"
          delta="3.2%"
          up={false}
          icon={TrendingUp}
          accent="oklch(0.65 0.17 245)"
          spark={[22, 18, 20, 16, 19, 15, 12]}
        />
        <StatCard
          label="Highest Bid"
          value="$142K"
          delta="21.5%"
          icon={DollarSign}
          accent="oklch(0.72 0.19 55)"
          spark={[40, 55, 48, 70, 66, 90, 110]}
        />
      </div>

      {/* Charts row */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl glass p-5 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-semibold">Revenue</h2>
              <p className="text-sm text-muted-foreground">Settlements over the last 12 months</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-xl font-semibold">{formatCurrency(486200)}</p>
              <span className="inline-flex items-center gap-0.5 text-xs text-emerald">
                <ArrowUpRight className="size-3.5" /> 21.5% vs last year
              </span>
            </div>
          </div>
          <div className="mt-4 h-56">
            <AreaChart data={revenueSeries} />
          </div>
        </div>

        <div className="rounded-2xl glass p-5">
          <h2 className="font-semibold">Bid outcomes</h2>
          <p className="text-sm text-muted-foreground">This quarter</p>
          <div className="mt-4 flex items-center justify-center">
            <DonutChart
              segments={[
                { value: 47, color: 'oklch(0.72 0.16 165)', label: 'Won' },
                { value: 62, color: 'oklch(0.62 0.22 295)', label: 'Active' },
                { value: 19, color: 'oklch(0.72 0.19 55)', label: 'Lost' },
              ]}
            />
          </div>
          <div className="mt-4 space-y-2">
            {[
              { label: 'Won', value: 47, color: 'oklch(0.72 0.16 165)' },
              { label: 'Active', value: 62, color: 'oklch(0.62 0.22 295)' },
              { label: 'Lost', value: 19, color: 'oklch(0.72 0.19 55)' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 text-sm">
                <span className="size-2.5 rounded-full" style={{ background: s.color }} />
                <span className="flex-1 text-muted-foreground">{s.label}</span>
                <span className="font-mono font-medium">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feed + activity row */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl glass p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Live auction feed</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-bid/10 px-2.5 py-1 text-[11px] font-medium text-bid">
              <span className="relative flex size-1.5">
                <span className="animate-pulse-ring absolute inline-flex size-full rounded-full bg-bid" />
                <span className="relative inline-flex size-1.5 rounded-full bg-bid" />
              </span>
              Live
            </span>
          </div>
          <div className="mt-4">
            <LiveFeed />
          </div>
        </div>

        <div className="rounded-2xl glass p-5">
          <h2 className="font-semibold">Bids this month</h2>
          <p className="text-sm text-muted-foreground">Total placed per month</p>
          <div className="mt-6">
            <BarChart data={bidsPerMonth} labels={months} height={180} />
          </div>
        </div>

        <div className="rounded-2xl glass p-5">
          <h2 className="font-semibold">Recent bids</h2>
          <p className="text-sm text-muted-foreground">Latest activity on your auctions</p>
          <div className="mt-4 space-y-1">
            {endingSoon.slice(0, 5).map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-lg px-2.5 py-2 text-sm"
              >
                <span className="truncate text-muted-foreground">{a.title}</span>
                <span className="font-mono text-foreground">{formatCurrency(a.currentPrice)}</span>
              </div>
            ))}
            {endingSoon.length === 0 && (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {/* Countdown / ending soon */}
      <div className="mt-6 rounded-2xl glass p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Ending soon</h2>
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Radio className="size-4 text-bid" /> Countdown timers
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {endingSoon.slice(0, 3).map((a) => {
            const img = a.images?.find((i) => i.isPrimary)?.url || a.images?.[0]?.url || '/placeholder.svg'
            return (
              <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <Image
                  src={img}
                  alt={a.title}
                  width={56}
                  height={56}
                  className="size-14 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(a.currentPrice)}</p>
                </div>
                <div className="rounded-lg bg-bid/10 px-2.5 py-1.5 text-xs">
                  <CountdownInline endsInMs={getEndsInMs(a.endsAt)} />
                </div>
              </div>
            )
          })}
          {endingSoon.length === 0 && (
            <p className="text-sm text-muted-foreground">No auctions ending soon</p>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
