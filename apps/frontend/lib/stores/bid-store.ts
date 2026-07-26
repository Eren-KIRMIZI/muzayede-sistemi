'use client'

import { create } from 'zustand'

interface BidState {
  currentBid: number | null
  bidCount: number
  recentBids: Array<{
    id: string
    userId: string
    userName: string
    amount: number
    timestamp: string
    isYou: boolean
  }>
  isBidding: boolean
  bidError: string | null

  setCurrentBid: (amount: number) => void
  addBid: (bid: BidState['recentBids'][0]) => void
  setRecentBids: (bids: BidState['recentBids']) => void
  setBidding: (isBidding: boolean) => void
  setBidError: (error: string | null) => void
  reset: () => void
}

export const useBidStore = create<BidState>((set) => ({
  currentBid: null,
  bidCount: 0,
  recentBids: [],
  isBidding: false,
  bidError: null,

  setCurrentBid: (amount) => set({ currentBid: amount }),

  addBid: (bid) =>
    set((state) => ({
      recentBids: [bid, ...state.recentBids].slice(0, 50),
      currentBid: bid.amount,
      bidCount: state.bidCount + 1,
    })),

  setRecentBids: (bids) => set({ recentBids: bids }),

  setBidding: (isBidding) => set({ isBidding }),

  setBidError: (error) => set({ bidError: error }),

  reset: () =>
    set({
      currentBid: null,
      bidCount: 0,
      recentBids: [],
      isBidding: false,
      bidError: null,
    }),
}))
