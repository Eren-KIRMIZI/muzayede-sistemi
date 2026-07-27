'use client'

import { useQuery } from '@tanstack/react-query'
import {
  BarChart3,
  Gavel,
  Trophy,
  TrendingUp,
  DollarSign,
  Eye,
} from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/shell'
import { AreaChart, BarChart, DonutChart } from '@/components/dashboard/charts'
import { usersApi } from '@/lib/api/users'
import { formatCurrency } from '@/lib/utils'

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']

export default function ReportsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['users', 'me', 'stats'],
    queryFn: () => usersApi.getMyStats(),
    staleTime: 30_000,
  })

  return (
    <DashboardShell title="Reports" subtitle="Analytics and activity reports">
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted/30" />
          ))}
        </div>
      ) : stats ? (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl glass p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Gavel className="size-5" />
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">Total Bids</p>
                  <p className="font-mono text-2xl font-semibold">{stats.totalBids}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl glass p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-emerald/15 text-emerald">
                  <Trophy className="size-5" />
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="font-mono text-2xl font-semibold">
                    {stats.totalBids > 0 ? Math.round((stats.wonAuctions / stats.totalBids) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl glass p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-amber/15 text-amber">
                  <DollarSign className="size-5" />
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="font-mono text-2xl font-semibold">{formatCurrency(stats.totalSpent)}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl glass p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-purple-500/15 text-purple-500">
                  <Eye className="size-5" />
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">Items Watched</p>
                  <p className="font-mono text-2xl font-semibold">{stats.watchedCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl glass p-5">
              <h2 className="font-semibold">Bid Activity</h2>
              <p className="text-sm text-muted-foreground">Your bids per month</p>
              <div className="mt-4 h-56">
                <AreaChart data={stats.bidsPerMonth.length > 0 ? stats.bidsPerMonth : [0, 0, 0, 0, 0, 0, 0]} color="oklch(0.65 0.17 245)" />
              </div>
            </div>
            <div className="rounded-2xl glass p-5">
              <h2 className="font-semibold">Monthly Breakdown</h2>
              <p className="text-sm text-muted-foreground">Bids placed each month</p>
              <div className="mt-4">
                <BarChart data={stats.bidsPerMonth.length > 0 ? stats.bidsPerMonth : [0, 0, 0, 0, 0, 0, 0]} labels={months} height={200} />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-6 rounded-2xl glass p-5">
            <h2 className="font-semibold">Performance Summary</h2>
            <p className="text-sm text-muted-foreground">Your auction activity at a glance</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: 'Auctions Listed', value: stats.totalAuctions, sub: `${stats.activeAuctions} active`, color: 'text-primary' },
                { label: 'Auctions Won', value: stats.wonAuctions, sub: `${stats.totalBids - stats.wonAuctions} lost`, color: 'text-emerald' },
                { label: 'Total Earned', value: formatCurrency(stats.totalEarned), sub: 'from sales', color: 'text-amber' },
                { label: 'Highest Bid', value: stats.highestBid > 0 ? formatCurrency(stats.highestBid) : '$0', sub: 'personal best', color: 'text-purple-500' },
                { label: 'Active Bids', value: stats.activeBids, sub: 'in progress', color: 'text-bid' },
                { label: 'Win Rate', value: `${stats.totalBids > 0 ? Math.round((stats.wonAuctions / stats.totalBids) * 100) : 0}%`, sub: `${stats.wonAuctions} wins`, color: 'text-emerald' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-border p-4">
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className={`mt-1 font-mono text-xl font-semibold ${item.color}`}>{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 px-6 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/50">
            <BarChart3 className="size-7 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No data yet</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Start participating in auctions to see your analytics and reports here.
          </p>
        </div>
      )}
    </DashboardShell>
  )
}
