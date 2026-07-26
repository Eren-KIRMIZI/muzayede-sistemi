import { apiClient } from '../api-client'
import type { Bid, BidSummary, ApiResponse } from '../types'

export interface PaginatedBidsResponse {
  success: boolean
  data: Bid[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const bidsApi = {
  place: (auctionId: string, amount: number, maxAmount?: number) =>
    apiClient
      .post<ApiResponse<Bid>>(`/auctions/${auctionId}/bids`, { amount, maxAmount })
      .then((r) => r.data.data),

  getHistory: (auctionId: string, page = 1, limit = 20) =>
    apiClient
      .get<PaginatedBidsResponse>(`/auctions/${auctionId}/bids`, { params: { page, limit } })
      .then((r) => r.data),

  getMyBids: (page = 1, limit = 20) =>
    apiClient
      .get<PaginatedBidsResponse>('/users/me/bids', { params: { page, limit } })
      .then((r) => r.data),

  getSummary: (auctionId: string) =>
    apiClient
      .get<ApiResponse<BidSummary>>(`/auctions/${auctionId}/bids/summary`)
      .then((r) => r.data.data),
}
