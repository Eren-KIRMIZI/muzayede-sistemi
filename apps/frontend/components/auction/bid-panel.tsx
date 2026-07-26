'use client'

import { useCallback, useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Gavel, TrendingUp, Users, Zap, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CountdownBlocks } from '@/components/countdown'
import { cn, formatCurrency } from '@/lib/utils'
import { useSocket } from '@/lib/hooks/use-socket'
import { bidsApi } from '@/lib/api/bids'
import { useAuthStore } from '@/lib/stores/auth-store'
import type { Bid } from '@/lib/types'

function getEndsInMs(endsAt: string): number {
  return Math.max(0, new Date(endsAt).getTime() - Date.now())
}

function formatBidUser(bid: Bid): string {
  if (bid.user) {
    return `${bid.user.firstName} ${bid.user.lastName}`
  }
  return 'Anonymous'
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function BidPanel({
  auctionId,
  startBid,
  currentBid: initialBid,
  endsAt,
  bidders,
}: {
  auctionId: string
  startBid: number
  currentBid: number
  endsAt: string
  bidders: number
}) {
  const [currentBid, setCurrentBid] = useState(initialBid)
  const [count, setCount] = useState(bidders)
  const [flash, setFlash] = useState(false)
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  const { data: bidHistoryData } = useQuery({
    queryKey: ['bidHistory', auctionId],
    queryFn: () => bidsApi.getHistory(auctionId, 1, 20),
    staleTime: 10_000,
  })

  const initialBids = bidHistoryData?.data || []

  const [bids, setBids] = useState<Bid[]>(initialBids)

  useEffect(() => {
    if (initialBids.length > 0 && bids.length === 0) {
      setBids(initialBids)
    }
  }, [initialBids])

  const placeBidMutation = useMutation({
    mutationFn: (amount: number) => bidsApi.place(auctionId, amount),
    onSuccess: (newBid) => {
      setCurrentBid(newBid.amount)
      setCount((c) => c + 1)
      setBids((prev) => [newBid, ...prev])
      setFlash(true)
      setTimeout(() => setFlash(false), 700)
      queryClient.invalidateQueries({ queryKey: ['bidHistory', auctionId] })
    },
    onError: () => {
      // Optimistic update was already applied, revert on error
    },
  })

  const onBidReceived = useCallback(
    (data: { auctionId: string; bid: { id: string; userId: string; amount: number; createdAt: string; user?: { id: string; firstName: string; lastName: string } } }) => {
      if (data.auctionId !== auctionId) return
      const bid = data.bid
      setCurrentBid(bid.amount)
      setCount((c) => c + 1)
      setBids((prev) => [
        {
          id: bid.id,
          auctionId,
          userId: bid.userId,
          user: bid.user || { id: bid.userId, firstName: 'User', lastName: '' },
          amount: bid.amount,
          isAutoBid: false,
          status: 'PLACED',
          createdAt: bid.createdAt,
        } as Bid,
        ...prev,
      ])
      setFlash(true)
      setTimeout(() => setFlash(false), 700)
      queryClient.invalidateQueries({ queryKey: ['bidHistory', auctionId] })
    },
    [auctionId, queryClient],
  )

  const { isConnected } = useSocket({
    auctionId,
    onBid: onBidReceived,
  })

  const increment = Math.max(50, Math.round(currentBid * 0.02))
  const quickBids = [increment, increment * 2, increment * 5]

  const handlePlaceBid = (amount: number) => {
    const next = currentBid + amount
    // Optimistic update
    setCurrentBid(next)
    setCount((c) => c + 1)
    setBids((prev) => [
      {
        id: `optimistic-${Date.now()}`,
        auctionId,
        userId: user?.id || '',
        user: user ? { id: user.id, firstName: user.firstName, lastName: user.lastName } : { id: '', firstName: 'You', lastName: '' },
        amount: next,
        isAutoBid: false,
        status: 'WINNING',
        createdAt: new Date().toISOString(),
      } as Bid,
      ...prev,
    ])
    setFlash(true)
    setTimeout(() => setFlash(false), 700)

    placeBidMutation.mutate(next)
  }

  return (
    <div className="glass-strong rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald" />
          </span>
          Live auction
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {isConnected ? (
              <Wifi className="size-3.5 text-emerald" />
            ) : (
              <WifiOff className="size-3.5 text-destructive" />
            )}
            <span className={isConnected ? 'text-emerald' : 'text-destructive'}>
              {isConnected ? 'Connected' : 'Offline'}
            </span>
          </span>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="size-4" />
            {count} bidders
          </span>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Current bid</p>
        <p
          className={cn(
            'mt-1 font-mono text-4xl font-semibold tabular-nums transition-colors duration-500',
            flash ? 'text-emerald' : 'text-foreground',
          )}
        >
          {formatCurrency(currentBid)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Starting bid {formatCurrency(startBid)} · Next minimum {formatCurrency(currentBid + increment)}
        </p>
      </div>

      <div className="mt-5 rounded-2xl border border-border/60 bg-background/40 p-4">
        <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Auction ends in</p>
        <CountdownBlocks endsInMs={getEndsInMs(endsAt)} />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {quickBids.map((q) => (
          <Button
            key={q}
            variant="outline"
            size="lg"
            onClick={() => handlePlaceBid(q)}
            disabled={placeBidMutation.isPending}
            className="h-11 rounded-xl"
          >
            <span className="text-xs text-muted-foreground">+{formatCurrency(q)}</span>
          </Button>
        ))}
      </div>

      <Button
        size="lg"
        onClick={() => handlePlaceBid(increment)}
        disabled={placeBidMutation.isPending}
        className="mt-3 h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
      >
        <Gavel className="size-5" />
        {placeBidMutation.isPending ? 'Placing...' : `Place bid ${formatCurrency(currentBid + increment)}`}
      </Button>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <TrendingUp className="size-4 text-emerald" />
            Bid history
          </p>
          <span className="text-xs text-muted-foreground">{bids.length} bids</span>
        </div>
        <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto pr-1">
          {bids.map((b, i) => (
            <li
              key={b.id}
              className={cn(
                'flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors',
                i === 0 ? 'bg-emerald/10' : 'hover:bg-muted/40',
              )}
            >
              <span className="flex items-center gap-2">
                {i === 0 && <Zap className="size-3.5 text-emerald" />}
                <span className={cn('font-medium', b.userId === user?.id && 'text-primary')}>
                  {formatBidUser(b)}
                </span>
              </span>
              <span className="flex items-center gap-3">
                <span className="font-mono tabular-nums">{formatCurrency(b.amount)}</span>
                <span className="w-16 text-right text-xs text-muted-foreground">
                  {formatTimeAgo(b.createdAt)}
                </span>
              </span>
            </li>
          ))}
          {bids.length === 0 && (
            <li className="py-4 text-center text-sm text-muted-foreground">No bids yet. Be the first!</li>
          )}
        </ul>
      </div>
    </div>
  )
}
