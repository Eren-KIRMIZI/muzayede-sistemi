'use client'

import { create } from 'zustand'
import type { Auction, AuctionFilters, SortOption } from '../types'

interface AuctionState {
  auctions: Auction[]
  selectedAuction: Auction | null
  filters: AuctionFilters
  isLoading: boolean
  hasMore: boolean
  total: number

  setAuctions: (auctions: Auction[]) => void
  appendAuctions: (auctions: Auction[]) => void
  setSelectedAuction: (auction: Auction | null) => void
  updateAuction: (id: string, data: Partial<Auction>) => void
  setFilters: (filters: Partial<AuctionFilters>) => void
  resetFilters: () => void
  setLoading: (loading: boolean) => void
  setHasMore: (hasMore: boolean) => void
  setTotal: (total: number) => void
}

const defaultFilters: AuctionFilters = {
  sort: 'ending_soon',
  page: 1,
  limit: 20,
}

export const useAuctionStore = create<AuctionState>((set) => ({
  auctions: [],
  selectedAuction: null,
  filters: { ...defaultFilters },
  isLoading: false,
  hasMore: true,
  total: 0,

  setAuctions: (auctions) => set({ auctions }),

  appendAuctions: (newAuctions) =>
    set((state) => ({ auctions: [...state.auctions, ...newAuctions] })),

  setSelectedAuction: (auction) => set({ selectedAuction: auction }),

  updateAuction: (id, data) =>
    set((state) => ({
      auctions: state.auctions.map((a) => (a.id === id ? { ...a, ...data } : a)),
      selectedAuction:
        state.selectedAuction?.id === id
          ? { ...state.selectedAuction, ...data }
          : state.selectedAuction,
    })),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters, page: 1 },
      auctions: [],
      hasMore: true,
    })),

  resetFilters: () =>
    set({ filters: { ...defaultFilters }, auctions: [], hasMore: true }),

  setLoading: (isLoading) => set({ isLoading }),

  setHasMore: (hasMore) => set({ hasMore }),

  setTotal: (total) => set({ total }),
}))
