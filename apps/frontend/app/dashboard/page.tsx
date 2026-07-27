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
import { usersApi } from '@/lib/api/users'
import { formatCurrency } from '@/lib/utils'

const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem']

function getEndsInMs(endsAt: string): number {
  return Math.max(0, new Date(endsAt).getTime() - Date.now())
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['users', 'me', 'stats'],
    queryFn: () => usersApi.getMyStats(),
    staleTime: 30_000,
  })

  const { data: endingData } = useQuery({
    queryKey: ['auctions', 'ending-soon'],
    queryFn: () => auctionsApi.getEndingSoon(),
    staleTime: 30_000,
  })

  const endingSoon = endingData?.data || []

  const bidOutcomes = stats
    ? [
        { value: stats.wonAuctions || 1, color: 'oklch(0.72 0.16 165)', label: 'Kazanılan' },
        { value: stats.activeBids || 1, color: 'oklch(0.62 0.22 295)', label: 'Aktif' },
        { value: Math.max(0, (stats.totalBids || 0) - (stats.wonAuctions || 0) - (stats.activeBids || 0)) || 1, color: 'oklch(0.72 0.19 55)', label: 'Kaybedilen' },
      ]
    : []

  return (
    <DashboardShell title="Kontrol Paneli" subtitle="Tekrar hoş geldiniz — müzayede aktiviteniz burada">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted/30" />
          ))
        ) : stats ? (
          <>
            <StatCard
              label="Toplam Müzayede"
              value={String(stats.totalAuctions)}
              delta={`${stats.activeAuctions} aktif`}
              icon={Gavel}
              accent="oklch(0.62 0.22 295)"
              spark={stats.bidsPerMonth.length > 0 ? stats.bidsPerMonth : [0, 0, 0, 0, 0, 0, 0]}
            />
            <StatCard
              label="Kazanılan Müzayedeler"
              value={String(stats.wonAuctions)}
              delta={`${stats.totalBids} toplam teklif`}
              icon={Trophy}
              accent="oklch(0.72 0.16 165)"
              spark={[stats.wonAuctions, stats.wonAuctions + 1, stats.wonAuctions, stats.wonAuctions + 2, stats.wonAuctions + 1, stats.wonAuctions + 3, stats.wonAuctions + 2]}
            />
            <StatCard
              label="Aktif Teklifler"
              value={String(stats.activeBids)}
              delta={`${stats.activeBids} devam ediyor`}
              up={stats.activeBids > 0}
              icon={TrendingUp}
              accent="oklch(0.65 0.17 245)"
              spark={[stats.activeBids + 3, stats.activeBids + 1, stats.activeBids + 2, stats.activeBids, stats.activeBids + 1, stats.activeBids - 1, stats.activeBids]}
            />
            <StatCard
              label="En Yüksek Teklif"
              value={stats.highestBid > 0 ? formatCurrency(stats.highestBid) : '$0'}
              delta={`${stats.watchedCount} takip ediliyor`}
              icon={DollarSign}
              accent="oklch(0.72 0.19 55)"
              spark={[40, 55, 48, 70, 66, 90, stats.highestBid > 0 ? Math.min(stats.highestBid / 1000, 150) : 110]}
            />
          </>
        ) : null}
      </div>

      {/* Charts row */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl glass p-5 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-semibold">Kazanç Genel Bakışı</h2>
              <p className="text-sm text-muted-foreground">Müzayede kazançlarınız</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-xl font-semibold">{formatCurrency(stats?.totalEarned || 0)}</p>
              <span className="inline-flex items-center gap-0.5 text-xs text-emerald">
                <ArrowUpRight className="size-3.5" /> {stats?.totalSpent ? `Harcanan ${formatCurrency(stats.totalSpent)}` : 'Henüz aktivite yok'}
              </span>
            </div>
          </div>
          <div className="mt-4 h-56">
            <AreaChart data={stats?.bidsPerMonth && stats.bidsPerMonth.length > 0 ? stats.bidsPerMonth : [0, 0, 0, 0, 0, 0, 0]} />
          </div>
        </div>

        <div className="rounded-2xl glass p-5">
          <h2 className="font-semibold">Teklif sonuçları</h2>
          <p className="text-sm text-muted-foreground">Tüm zamanlar</p>
          <div className="mt-4 flex items-center justify-center">
            <DonutChart segments={bidOutcomes} />
          </div>
          <div className="mt-4 space-y-2">
            {bidOutcomes.map((s) => (
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
            <h2 className="font-semibold">Canlı müzayede akışı</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-bid/10 px-2.5 py-1 text-[11px] font-medium text-bid">
              <span className="relative flex size-1.5">
                <span className="animate-pulse-ring absolute inline-flex size-full rounded-full bg-bid" />
                <span className="relative inline-flex size-1.5 rounded-full bg-bid" />
              </span>
              Canlı
            </span>
          </div>
          <div className="mt-4">
            <LiveFeed />
          </div>
        </div>

        <div className="rounded-2xl glass p-5">
          <h2 className="font-semibold">Bu ayki teklifler</h2>
          <p className="text-sm text-muted-foreground">Aylık aktiviteniz</p>
          <div className="mt-6">
            <BarChart data={stats?.bidsPerMonth || [0, 0, 0, 0, 0, 0, 0]} labels={months} height={180} />
          </div>
        </div>

        <div className="rounded-2xl glass p-5">
          <h2 className="font-semibold">Son teklifler</h2>
          <p className="text-sm text-muted-foreground">Müzayedelerinizdeki son aktivite</p>
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
              <p className="text-sm text-muted-foreground">Son aktivite yok</p>
            )}
          </div>
        </div>
      </div>

      {/* Countdown / ending soon */}
      <div className="mt-6 rounded-2xl glass p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Yakında bitiyor</h2>
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Radio className="size-4 text-bid" /> Geri sayım zamanlayıcıları
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
            <p className="text-sm text-muted-foreground">Yakında bitecek müzayede yok</p>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
