'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Gavel, Trophy, ArrowRight } from 'lucide-react'
import { DashboardShell } from '@/components/dashboard/shell'
import { EmptyState } from '@/components/empty-state'
import { Skeleton } from '@/components/skeleton'
import { bidsApi } from '@/lib/api/bids'
import { formatCurrency } from '@/lib/utils'
import type { Bid } from '@/lib/types'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PLACED: { label: 'Placed', color: 'text-muted-foreground' },
  OUTBID: { label: 'Outbid', color: 'text-destructive' },
  WINNING: { label: 'Winning', color: 'text-emerald' },
  WON: { label: 'Won', color: 'text-primary' },
  CANCELLED: { label: 'Cancelled', color: 'text-muted-foreground' },
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function BidsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-bids'],
    queryFn: () => bidsApi.getMyBids(1, 50),
  })

  const bids: Bid[] = data?.data || []

  return (
    <DashboardShell title="My Bids" subtitle="Track all your placed bids">
      {isLoading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : bids.length === 0 ? (
        <EmptyState
          icon={Gavel}
          title="No bids placed yet"
          description="Browse active auctions and place your first bid."
          action={
            <Link href="/auctions">
              <span className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                Browse auctions <ArrowRight className="size-3" />
              </span>
            </Link>
          }
        />
      ) : (
        <div className="mt-4 space-y-2">
          {bids.map((bid) => {
            const status = STATUS_CONFIG[bid.status] || STATUS_CONFIG.PLACED
            const userName = bid.user ? `${bid.user.firstName} ${bid.user.lastName}` : 'You'
            return (
              <div
                key={bid.id}
                className="flex items-center gap-4 rounded-xl border border-border/60 bg-background/20 p-3 transition-colors hover:bg-muted/40"
              >
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                  bid.status === 'WON' ? 'bg-primary/15' : bid.status === 'OUTBID' ? 'bg-destructive/10' : 'bg-muted/50'
                }`}>
                  {bid.status === 'WON' ? (
                    <Trophy className="size-4 text-primary" />
                  ) : (
                    <Gavel className="size-4 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    Bid on auction
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(bid.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold">{formatCurrency(bid.amount)}</p>
                  {bid.maxAmount && (
                    <p className="text-xs text-muted-foreground">Max: {formatCurrency(bid.maxAmount)}</p>
                  )}
                </div>
                <span className={`text-xs font-medium ${status.color}`}>
                  {status.label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </DashboardShell>
  )
}
