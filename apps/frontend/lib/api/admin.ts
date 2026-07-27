import { apiClient } from '../api-client'
import type { ApiResponse, PaginatedResponse } from '../types'

export interface AdminDashboardStats {
  users: { total: number; todayNew: number }
  auctions: { total: number; active: number; todayNew: number }
  payments: { total: number; platformRevenue: number }
  fraud: { pending: number }
}

export interface AdminUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  emailVerified: boolean
  isActive: boolean
  createdAt: string
  lastLoginAt: string | null
  _count: { auctions: number; bids: number }
}

export interface AdminAuction {
  id: string
  title: string
  status: string
  startingPrice: number
  currentPrice: number | null
  bidCount: number
  isFeatured: boolean
  isHot: boolean
  createdAt: string
  seller: { id: string; firstName: string; lastName: string; email: string }
  category: { id: string; name: string }
  images: { url: string }[]
  _count: { bids: number }
}

export interface AdminPayment {
  id: string
  amount: number
  fee: number
  net: number
  status: string
  method: string
  escrowStatus: string
  createdAt: string
  buyer: { id: string; firstName: string; lastName: string; email: string }
  seller: { id: string; firstName: string; lastName: string }
  auction: { id: string; title: string }
}

export interface FraudEvent {
  id: string
  eventType: string
  severity: string
  status: string
  riskScore: number
  createdAt: string
  user: { id: string; firstName: string; lastName: string; email: string }
}

export interface AuditLog {
  id: string
  userId: string | null
  action: string
  resource: string
  resourceId: string | null
  ipAddress: string | null
  createdAt: string
}

export interface AdminUserDetails extends AdminUser {
  auctions: { id: string; title: string; status: string; createdAt: string }[]
  bids: { id: string; amount: number; status: string; createdAt: string }[]
  fraudEvents: { id: string; eventType: string; severity: string; status: string }[]
  _count: { auctions: number; bids: number; notifications: number }
}

export const adminApi = {
  getDashboard: () =>
    apiClient
      .get<ApiResponse<AdminDashboardStats>>('/admin/dashboard')
      .then((r) => r.data.data),

  getUsers: (page = 1, limit = 20, search?: string, role?: string) =>
    apiClient
      .get<PaginatedResponse<AdminUser>>('/admin/users', { params: { page, limit, search, role } })
      .then((r) => r.data),

  getUserDetails: (id: string) =>
    apiClient
      .get<ApiResponse<AdminUserDetails>>(`/admin/users/${id}`)
      .then((r) => r.data.data),

  banUser: (id: string, reason: string) =>
    apiClient
      .post<ApiResponse<{ message: string }>>(`/admin/users/${id}/ban`, { reason })
      .then((r) => r.data),

  unbanUser: (id: string) =>
    apiClient
      .post<ApiResponse<{ message: string }>>(`/admin/users/${id}/unban`)
      .then((r) => r.data),

  changeRole: (id: string, role: string) =>
    apiClient
      .patch<ApiResponse<{ message: string }>>(`/admin/users/${id}/role`, { role })
      .then((r) => r.data),

  getAuctions: (page = 1, limit = 20, status?: string) =>
    apiClient
      .get<PaginatedResponse<AdminAuction>>('/admin/auctions', { params: { page, limit, status } })
      .then((r) => r.data),

  cancelAuction: (id: string, reason: string) =>
    apiClient
      .post<ApiResponse<{ message: string }>>(`/admin/auctions/${id}/cancel`, { reason })
      .then((r) => r.data),

  featureAuction: (id: string, featured: boolean, hot: boolean) =>
    apiClient
      .patch<ApiResponse<{ message: string }>>(`/admin/auctions/${id}/feature`, { featured, hot })
      .then((r) => r.data),

  getPayments: (page = 1, limit = 20, status?: string) =>
    apiClient
      .get<PaginatedResponse<AdminPayment>>('/admin/payments', { params: { page, limit, status } })
      .then((r) => r.data),

  getFraudEvents: (page = 1, limit = 20, status?: string) =>
    apiClient
      .get<PaginatedResponse<FraudEvent>>('/admin/fraud', { params: { page, limit, status } })
      .then((r) => r.data),

  resolveFraud: (id: string, status: string, note: string) =>
    apiClient
      .post<ApiResponse<{ message: string }>>(`/admin/fraud/${id}/resolve`, { status, note })
      .then((r) => r.data),

  getAuditLogs: (page = 1, limit = 50, action?: string, userId?: string) =>
    apiClient
      .get<PaginatedResponse<AuditLog>>('/admin/audit-logs', { params: { page, limit, action, userId } })
      .then((r) => r.data),
}
