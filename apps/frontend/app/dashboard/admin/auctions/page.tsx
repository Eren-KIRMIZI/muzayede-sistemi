'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Gavel, Search, Star, XCircle, Eye } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/shell'
import { adminApi, type AdminAuction } from '@/lib/api/admin'
import { formatCurrency } from '@/lib/utils'

const statuses = ['', 'ACTIVE', 'DRAFT', 'PENDING', 'ENDED', 'SOLD', 'CANCELLED']

export default function AdminAuctionsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'auctions', page, status],
    queryFn: () => adminApi.getAuctions(page, 20, status || undefined),
    staleTime: 15_000,
  })

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.cancelAuction(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'auctions'] }),
  })

  const featureMutation = useMutation({
    mutationFn: ({ id, featured, hot }: { id: string; featured: boolean; hot: boolean }) =>
      adminApi.featureAuction(id, featured, hot),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'auctions'] }),
  })

  const statusColor: Record<string, string> = {
    ACTIVE: 'bg-emerald/10 text-emerald',
    DRAFT: 'bg-muted text-muted-foreground',
    PENDING: 'bg-amber/10 text-amber',
    ENDED: 'bg-muted text-muted-foreground',
    SOLD: 'bg-primary/10 text-primary',
    CANCELLED: 'bg-destructive/10 text-destructive',
  }

  return (
    <DashboardShell title="Müzayede Yönetimi" subtitle="Tüm müzayedeleri görüntüleyin ve yönetin">
      <div className="flex items-center gap-3">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="rounded-xl border border-border bg-input/40 px-3 py-2 text-sm"
        >
          <option value="">Tüm Durumlar</option>
          {statuses.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="mt-4 space-y-3">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted/30" />
          ))
        ) : data?.data?.length === 0 ? (
          <div className="rounded-2xl glass p-8 text-center text-muted-foreground">Müzayede bulunamadı</div>
        ) : (
          data?.data?.map((auction: AdminAuction) => {
            const img = auction.images?.[0]?.url || '/placeholder.svg'
            return (
              <div key={auction.id} className="flex items-center gap-4 rounded-2xl glass p-4 transition-colors hover:bg-white/[0.02]">
                <Image
                  src={img}
                  alt={auction.title}
                  width={56}
                  height={56}
                  className="size-14 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{auction.title}</p>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor[auction.status] || ''}`}>
                      {auction.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {auction.seller.firstName} {auction.seller.lastName} tarafından · {auction.category.name} · {auction._count.bids} teklif
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold">{formatCurrency(auction.currentPrice || auction.startingPrice)}</p>
                  <p className="text-xs text-muted-foreground">Oluşturulma {new Date(auction.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => featureMutation.mutate({ id: auction.id, featured: !auction.isFeatured, hot: auction.isHot })}
                    className={`rounded-lg p-1.5 transition-colors ${auction.isFeatured ? 'text-amber hover:bg-amber/10' : 'text-muted-foreground hover:bg-white/5'}`}
                    title={auction.isFeatured ? 'Öne çıkarmayı kaldır' : 'Öne çıkar'}
                  >
                    <Star className={`size-4 ${auction.isFeatured ? 'fill-amber' : ''}`} />
                  </button>
                  {auction.status !== 'CANCELLED' && auction.status !== 'ENDED' && auction.status !== 'SOLD' && (
                    <button
                      onClick={() => cancelMutation.mutate({ id: auction.id, reason: 'Yönetici tarafından iptal edildi' })}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      title="Müzayede iptal et"
                    >
                      <XCircle className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {data.total} kayıttan {((page - 1) * 20) + 1}-{Math.min(page * 20, data.total)} arası gösteriliyor
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Önceki
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
              className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Sonraki
            </button>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
