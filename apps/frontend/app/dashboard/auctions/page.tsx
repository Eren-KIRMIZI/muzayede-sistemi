'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Package, Plus, Clock, CheckCircle, XCircle, Eye, Gavel } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/shell'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/skeleton'
import { auctionsApi } from '@/lib/api/auctions'
import { useAuthStore } from '@/lib/stores/auth-store'
import { formatCurrency } from '@/lib/utils'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  DRAFT: { label: 'Taslak', color: 'text-muted-foreground', icon: Clock },
  PENDING: { label: 'Beklemede', color: 'text-yellow-500', icon: Clock },
  ACTIVE: { label: 'Aktif', color: 'text-emerald', icon: CheckCircle },
  ENDED: { label: 'Bitmiş', color: 'text-muted-foreground', icon: XCircle },
  SOLD: { label: 'Satılmış', color: 'text-primary', icon: CheckCircle },
  CANCELLED: { label: 'İptal Edilmiş', color: 'text-destructive', icon: XCircle },
}

export default function MyAuctionsPage() {
  const user = useAuthStore((s) => s.user)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data, isLoading } = useQuery({
    queryKey: ['my-auctions', user?.id, statusFilter],
    queryFn: () =>
      auctionsApi.list({
        sellerId: user!.id,
        status: statusFilter || undefined,
        limit: 50,
      }),
    enabled: !!user?.id,
  })

  const auctions = data?.data || []

  return (
    <DashboardShell title="Müzayedelerim" subtitle="Satışa çıkardığınız müzayedeler">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['', 'DRAFT', 'ACTIVE', 'ENDED', 'SOLD'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s || 'Tümü'}
            </button>
          ))}
        </div>
        <Link href="/dashboard/auctions/new">
          <Button size="sm">
            <Plus className="mr-1 size-3" /> Yeni Müzayede
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : auctions.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Henüz müzayede listelenmemiş"
          description="İlk müzayedenizi oluşturun ve binlerce koleksiyoncuya ulaşın."
          action={
            <Link href="/dashboard/auctions/new">
              <Button size="sm">Müzayede oluştur</Button>
            </Link>
          }
        />
      ) : (
        <div className="mt-4 space-y-2">
          {auctions.map((a) => {
            const status = STATUS_CONFIG[a.status] || STATUS_CONFIG.DRAFT
            const StatusIcon = status.icon
            const img = a.images?.find((i) => i.isPrimary)?.url || a.images?.[0]?.url || '/placeholder.svg'
            return (
              <Link
                key={a.id}
                href={`/auctions/${a.id}`}
                className="flex items-center gap-4 rounded-xl border border-border/60 bg-background/20 p-3 transition-colors hover:bg-muted/40"
              >
                <Image
                  src={img}
                  alt={a.title}
                  width={64}
                  height={64}
                  className="size-14 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.category?.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold">{formatCurrency(a.currentPrice)}</p>
                  <p className="text-xs text-muted-foreground">{a.bids} teklif</p>
                </div>
                <span className={`flex items-center gap-1 text-xs ${status.color}`}>
                  <StatusIcon className="size-3" />
                  {status.label}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </DashboardShell>
  )
}
