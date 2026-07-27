'use client'

import { useQuery } from '@tanstack/react-query'
import { Radio } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/shell'
import { AuctionCard } from '@/components/auction-card'
import { AuctionCardSkeleton } from '@/components/skeleton'
import { auctionsApi } from '@/lib/api/auctions'

export default function LiveAuctionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['auctions', 'ending-soon'],
    queryFn: () => auctionsApi.getEndingSoon(),
    staleTime: 30_000,
  })

  const live = data?.data || []

  return (
    <DashboardShell title="Canlı Müzayedeler" subtitle="Şu anda devam eden müzayedeler">
      <div className="flex items-center gap-2 mb-6">
        <span className="relative flex size-2">
          <span className="animate-pulse-ring absolute inline-flex size-full rounded-full bg-bid" />
          <span className="relative inline-flex size-2 rounded-full bg-bid" />
        </span>
        <span className="text-sm text-bid font-medium">{live.length} şu anda canlı</span>
      </div>
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <AuctionCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {live.map((a) => (
            <AuctionCard key={a.id} auction={a} />
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
