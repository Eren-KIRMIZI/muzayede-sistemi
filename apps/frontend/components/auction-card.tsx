'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Flame, Gavel, Users } from 'lucide-react'
import type { Auction } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { CountdownInline } from '@/components/countdown'

function getEndsInMs(endsAt: string): number {
  const diff = new Date(endsAt).getTime() - Date.now()
  return Math.max(0, diff)
}

function sellerName(seller: Auction['seller']): string {
  return `${seller.firstName} ${seller.lastName}`
}

function primaryImage(auction: Auction): string {
  const primary = auction.images?.find((img) => img.isPrimary)
  return primary?.url || auction.images?.[0]?.url || '/placeholder.svg'
}

export function AuctionCard({ auction }: { auction: Auction }) {
  const endsInMs = getEndsInMs(auction.endsAt)
  const isLive = auction.status === 'ACTIVE' && endsInMs > 0
  const isHot = auction.bids >= 20

  return (
    <Link
      href={`/auctions/${auction.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl glass transition-all duration-300 hover:-translate-y-1.5 hover:glow-brand"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={primaryImage(auction)}
          alt={auction.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent" />
        <div className="absolute left-3 top-3 flex gap-2">
          {isLive && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/70 px-2.5 py-1 text-[11px] font-medium text-bid backdrop-blur">
              <span className="relative flex size-1.5">
                <span className="animate-pulse-ring absolute inline-flex size-full rounded-full bg-bid" />
                <span className="relative inline-flex size-1.5 rounded-full bg-bid" />
              </span>
              LIVE
            </span>
          )}
          {isHot && (
            <span className="inline-flex items-center gap-1 rounded-full bg-background/70 px-2.5 py-1 text-[11px] font-medium text-foreground backdrop-blur">
              <Flame className="size-3 text-bid" /> Hot
            </span>
          )}
        </div>
        <span className="absolute right-3 top-3 rounded-full bg-background/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur">
          {auction.category?.name}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-balance font-semibold leading-tight text-foreground">
            {auction.title}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">by {sellerName(auction.seller)}</p>
        </div>

        <div className="mt-auto flex items-end justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Current bid</p>
            <p className="text-lg font-semibold text-foreground">
              {formatCurrency(auction.currentPrice)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Ends in</p>
            <CountdownInline endsInMs={endsInMs} />
          </div>
        </div>

        <div className="flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Gavel className="size-3.5" /> {auction.bids} bids
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-3.5" /> {auction.watchers} watching
          </span>
        </div>
      </div>
    </Link>
  )
}
