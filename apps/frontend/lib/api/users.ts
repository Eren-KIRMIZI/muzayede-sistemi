import { apiClient } from '../api-client'
import type { ApiResponse } from '../types'

export interface UserStats {
  totalAuctions: number
  activeAuctions: number
  wonAuctions: number
  activeBids: number
  totalBids: number
  highestBid: number
  totalSpent: number
  totalEarned: number
  watchedCount: number
  bidsPerMonth: number[]
}

export interface WalletTransaction {
  id: string
  amount: number
  fee: number
  net: number
  status: string
  method: string
  escrowStatus: string
  createdAt: string
  auction: { id: string; title: string }
}

export interface UserWallet {
  availableBalance: number
  totalSpent: number
  heldInEscrow: number
  transactions: WalletTransaction[]
}

export const usersApi = {
  getMyStats: () =>
    apiClient
      .get<ApiResponse<UserStats>>('/users/me/stats')
      .then((r) => r.data.data),

  getMyWallet: () =>
    apiClient
      .get<ApiResponse<UserWallet>>('/users/me/wallet')
      .then((r) => r.data.data),
}
