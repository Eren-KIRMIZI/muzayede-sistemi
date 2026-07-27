'use client'

import { useQuery } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/shell'
import { AuctionCard } from '@/components/auction-card'
import { AuctionCardSkeleton } from '@/components/skeleton'
import { EmptyState } from '@/components/empty-state'
import { auctionsApi } from '@/lib/api/auctions'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function FavoritesPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => auctionsApi.getWatchlist(),
  })

  const watched = data?.data || []

  return (
    <DashboardShell title="Favoriler" subtitle="İzlediğiniz müzayedeler">
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <AuctionCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={Heart}
          title="Favoriler yüklenemedi"
          description="İzleme listeniz yüklenirken bir hata oluştu."
          action={
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Tekrar dene
            </Button>
          }
        />
      ) : watched.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Henüz favori yok"
          description="Herhangi bir müzayeded kalp simgesine tıklayarak izleme listenize ekleyebilirsiniz."
          action={
            <Link href="/auctions">
              <Button variant="outline" size="sm">Müzayedelere göz at</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {watched.map((a, i) => (
            <AuctionCard key={`${a.id}-${i}`} auction={a} />
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
