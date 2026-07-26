import { apiClient } from '../api-client'
import type { Auction, AuctionDetail, AuctionCategory, ApiResponse, AuctionFilters } from '../types'

export interface PaginatedAuctionsResponse {
  success: boolean
  data: Auction[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const auctionsApi = {
  list: (filters?: AuctionFilters) =>
    apiClient
      .get<PaginatedAuctionsResponse>('/auctions', { params: filters })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<ApiResponse<AuctionDetail>>(`/auctions/${id}`).then((r) => r.data),

  getFeatured: () =>
    apiClient.get<ApiResponse<Auction[]>>('/auctions/featured').then((r) => r.data),

  getEndingSoon: () =>
    apiClient
      .get<ApiResponse<Auction[]>>('/auctions/ending-soon')
      .then((r) => r.data),

  getCategories: () =>
    apiClient.get<ApiResponse<AuctionCategory[]>>('/auctions/categories').then((r) => r.data),

  toggleWatch: (auctionId: string) =>
    apiClient.post<ApiResponse<{ watching: boolean }>>(`/auctions/${auctionId}/watch`).then((r) => r.data),

  getWatchlist: (page = 1, limit = 20) =>
    apiClient.get<PaginatedAuctionsResponse>('/auctions/watchlist', { params: { page, limit } }).then((r) => r.data),

  create: (data: {
    title: string
    description: string
    categoryId: string
    startingPrice: number
    reservePrice?: number
    bidIncrement: number
    endsAt: string
    location?: string
    shipping?: string
    imageUrls?: string[]
  }) =>
    apiClient.post<ApiResponse<Auction>>('/auctions', data).then((r) => r.data),

  update: (id: string, data: Partial<Auction>) =>
    apiClient.patch<ApiResponse<Auction>>(`/auctions/${id}`, data).then((r) => r.data),

  publish: (id: string) =>
    apiClient.post<ApiResponse<Auction>>(`/auctions/${id}/publish`).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete<ApiResponse<{ message: string }>>(`/auctions/${id}`).then((r) => r.data),
}
