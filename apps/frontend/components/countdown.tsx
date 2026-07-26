'use client'

import { useEffect, useState } from 'react'

function useCountdown(targetMs: number) {
  const [remaining, setRemaining] = useState(targetMs)
  useEffect(() => {
    setRemaining(targetMs)
    const start = Date.now()
    const id = setInterval(() => {
      const next = targetMs - (Date.now() - start)
      setRemaining(next > 0 ? next : 0)
    }, 1000)
    return () => clearInterval(id)
  }, [targetMs])

  const totalSeconds = Math.max(0, Math.floor(remaining / 1000))
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return { days, hours, minutes, seconds, urgent: totalSeconds < 3600 }
}

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

export function CountdownInline({ endsInMs }: { endsInMs: number }) {
  const { days, hours, minutes, seconds, urgent } = useCountdown(endsInMs)
  const label = days > 0 ? `${days}d ${pad(hours)}h ${pad(minutes)}m` : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  return (
    <span
      className={`font-mono tabular-nums ${urgent ? 'text-bid' : 'text-foreground'}`}
    >
      {label}
    </span>
  )
}

export function CountdownBlocks({ endsInMs }: { endsInMs: number }) {
  const { days, hours, minutes, seconds } = useCountdown(endsInMs)
  const items = [
    { v: days, l: 'Days' },
    { v: hours, l: 'Hrs' },
    { v: minutes, l: 'Min' },
    { v: seconds, l: 'Sec' },
  ]
  return (
    <div className="flex gap-2">
      {items.map((it) => (
        <div
          key={it.l}
          className="neu flex min-w-14 flex-col items-center rounded-xl px-3 py-2"
        >
          <span className="font-mono text-xl font-semibold tabular-nums text-foreground">
            {pad(it.v)}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {it.l}
          </span>
        </div>
      ))}
    </div>
  )
}
