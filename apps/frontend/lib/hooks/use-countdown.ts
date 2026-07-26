'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

interface UseCountdownOptions {
  targetMs: number
  onEnd?: () => void
}

export function useCountdown({ targetMs, onEnd }: UseCountdownOptions) {
  const [remaining, setRemaining] = useState(Math.max(0, targetMs))
  const onEndRef = useRef(onEnd)
  onEndRef.current = onEnd

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.max(0, targetMs - (Date.now() - (targetMs - targetMs)))
      setRemaining((prev) => {
        const next = Math.max(0, prev - 1000)
        if (next <= 0) {
          clearInterval(interval)
          onEndRef.current?.()
        }
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [targetMs])

  const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000)

  const isUrgent = remaining < 1000 * 60 * 10
  const isEnded = remaining <= 0

  const formatted = isEnded
    ? 'Ended'
    : days > 0
      ? `${days}d ${hours}h ${minutes}m`
      : hours > 0
        ? `${hours}h ${minutes}m ${seconds}s`
        : minutes > 0
          ? `${minutes}m ${seconds}s`
          : `${seconds}s`

  return { days, hours, minutes, seconds, remaining, isUrgent, isEnded, formatted }
}
