'use client'

import { useEffect, useState, useRef } from 'react'
import { Gavel } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useSocket } from '@/lib/hooks/use-socket'

type FeedEvent = {
  id: string
  user: string
  item: string
  amount: number
  live: boolean
}

const fallbackUsers = ['Alex M.', 'Sara K.', 'James L.', 'Lin W.', 'Omar F.', 'Nina R.']
const fallbackItems = ['Vintage Rolex Submariner', 'Signed Basquiat Print', '1967 Shelby GT500', 'Patek Philippe Nautilus', 'First Edition Pokémon Cards']

export function LiveFeed() {
  const [events, setEvents] = useState<FeedEvent[]>([])
  const hasRealEvents = useRef(false)
  const idCounter = useRef(100)

  const { isConnected } = useSocket({
    onBid: () => {},
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const token = localStorage.getItem('access_token')
    if (!token) return

    let socket: any = null

    import('socket.io-client').then(({ io }) => {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001'

      socket = io(wsUrl, {
        transports: ['websocket', 'polling'],
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      })

      socket.on('feed:bid', (data: any) => {
        hasRealEvents.current = true
        const ev: FeedEvent = {
          id: `real-${Date.now()}-${Math.random()}`,
          user: data.user?.firstName || data.user || 'bidder',
          item: data.auctionTitle || 'Auction',
          amount: data.amount,
          live: true,
        }
        setEvents((prev) => [ev, ...prev].slice(0, 8))
      })
    })

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [])

  useEffect(() => {
    if (events.length > 0 && hasRealEvents.current) return

    const timer = setInterval(() => {
      idCounter.current += 1
      const ev: FeedEvent = {
        id: `sim-${idCounter.current}`,
        user: fallbackUsers[Math.floor(Math.random() * fallbackUsers.length)],
        item: fallbackItems[Math.floor(Math.random() * fallbackItems.length)],
        amount: Math.floor(1000 + Math.random() * 150000),
        live: false,
      }
      setEvents((prev) => [ev, ...prev].slice(0, 8))
    }, 2600)
    return () => clearInterval(timer)
  }, [events.length])

  return (
    <div className="space-y-2">
      {events.map((e, i) => (
        <div
          key={e.id}
          className={`flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 ${
            i === 0 && e.live ? 'animate-rise bg-primary/10' : 'bg-white/[0.02]'
          }`}
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Gavel className="size-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">
              <span className="font-medium text-foreground">{e.user}</span>{' '}
              <span className="text-muted-foreground">üzerinden teklif verdi</span>{' '}
              <span className="text-foreground">{e.item}</span>
            </p>
          </div>
          <div className="text-right">
            <span className="font-mono text-sm font-semibold text-emerald">
              {formatCurrency(e.amount)}
            </span>
            {e.live && (
              <span className="block text-[9px] text-bid">CANLI</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
