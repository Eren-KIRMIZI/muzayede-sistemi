'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { io, type Socket } from 'socket.io-client'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001'

interface UseSocketOptions {
  auctionId?: string
  onBid?: (data: any) => void
  onAuctionEnd?: (data: any) => void
  onNotification?: (data: any) => void
  onAuctionUpdate?: (data: any) => void
}

export function useSocket({ auctionId, onBid, onAuctionEnd, onNotification, onAuctionUpdate }: UseSocketOptions = {}): { socket: Socket | null; isConnected: boolean; emit: (event: string, data?: unknown) => void } {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null

    const socket = io(WS_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
      auth: token ? { token } : undefined,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
      if (auctionId) {
        socket.emit('join:auction', { auctionId })
      }
    })

    socket.on('disconnect', () => setIsConnected(false))

    socket.on('bid:new', (data) => onBid?.(data))
    socket.on('auction:ended', (data) => onAuctionEnd?.(data))
    socket.on('notification', (data) => onNotification?.(data))
    socket.on('auction:updated', (data) => onAuctionUpdate?.(data))

    return () => {
      if (auctionId) {
        socket.emit('leave:auction', { auctionId })
      }
      socket.disconnect()
    }
  }, [auctionId, onBid, onAuctionEnd, onNotification, onAuctionUpdate])

  const emit = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data)
  }, [])

  return { socket: socketRef.current, isConnected, emit }
}
