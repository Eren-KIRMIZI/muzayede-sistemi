'use client'

import { useEffect, useState } from 'react'
import { Gavel } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

type Event = { id: number; user: string; item: string; amount: number }

const users = ['bidder_92', 'collector_x', 'vault_owl', 'aria_k', 'nova_bid', 'lot_hunter']
const items = ['Chrono Skeleton', 'Aero Runner OG', 'Spectrum No. 7', 'Emerald Roadster', 'Rangefinder Silver']

export function LiveFeed() {
  const [events, setEvents] = useState<Event[]>([
    { id: 1, user: 'bidder_92', item: 'Chrono Skeleton', amount: 12400 },
    { id: 2, user: 'aria_k', item: 'Aero Runner OG', amount: 3850 },
    { id: 3, user: 'vault_owl', item: 'Emerald Roadster', amount: 142000 },
  ])

  useEffect(() => {
    let id = 100
    const timer = setInterval(() => {
      id += 1
      const ev: Event = {
        id,
        user: users[Math.floor(Math.random() * users.length)],
        item: items[Math.floor(Math.random() * items.length)],
        amount: Math.floor(1000 + Math.random() * 150000),
      }
      setEvents((prev) => [ev, ...prev].slice(0, 8))
    }, 2600)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="space-y-2">
      {events.map((e, i) => (
        <div
          key={e.id}
          className={`flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 ${
            i === 0 ? 'animate-rise bg-primary/10' : 'bg-white/[0.02]'
          }`}
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Gavel className="size-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">
              <span className="font-medium text-foreground">{e.user}</span>{' '}
              <span className="text-muted-foreground">bid on</span>{' '}
              <span className="text-foreground">{e.item}</span>
            </p>
          </div>
          <span className="font-mono text-sm font-semibold text-emerald">
            {formatCurrency(e.amount)}
          </span>
        </div>
      ))}
    </div>
  )
}
