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
    <DashboardShell title="Favorites" subtitle="Auctions you're watching">
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <AuctionCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={Heart}
          title="Failed to load favorites"
          description="Something went wrong while loading your watchlist."
          action={
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          }
        />
      ) : watched.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No favorites yet"
          description="Click the heart icon on any auction to add it to your watchlist."
          action={
            <Link href="/auctions">
              <Button variant="outline" size="sm">Browse auctions</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {watched.map((a) => (
            <AuctionCard key={a.id} auction={a} />
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
