import { apiClient } from '../api-client'
import type { ApiResponse, PaginatedResponse } from '../types'

export interface Payment {
  id: string
  auctionId: string
  buyerId: string
  sellerId: string
  amount: number
  fee: number
  net: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  method: 'CARD' | 'BANK_TRANSFER' | 'WALLET'
  escrowStatus: 'HELD' | 'RELEASED' | 'REFUNDED'
  paidAt?: string
  releasedAt?: string
  refundedAt?: string
  createdAt: string
  auction?: { id: string; title: string; images?: { url: string }[] }
  buyer?: { id: string; firstName: string; lastName: string }
  seller?: { id: string; firstName: string; lastName: string }
}

export interface PaginatedPaymentsResponse {
  success: boolean
  data: Payment[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const paymentsApi = {
  create: (auctionId: string) =>
    apiClient
      .post<ApiResponse<Payment>>(`/payments/auction/${auctionId}`)
      .then((r) => r.data.data),

  list: (page = 1, limit = 20) =>
    apiClient
      .get<PaginatedPaymentsResponse>('/payments', { params: { page, limit } })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient
      .get<ApiResponse<Payment>>(`/payments/${id}`)
      .then((r) => r.data.data),

  releaseEscrow: (id: string) =>
    apiClient
      .patch<ApiResponse<Payment>>(`/payments/${id}/release`)
      .then((r) => r.data.data),

  refund: (id: string) =>
    apiClient
      .patch<ApiResponse<Payment>>(`/payments/${id}/refund`)
      .then((r) => r.data.data),
}
