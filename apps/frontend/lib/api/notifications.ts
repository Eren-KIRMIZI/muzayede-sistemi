import { apiClient } from '../api-client'
import type { Notification, ApiResponse } from '../types'

export interface PaginatedNotificationsResponse {
  success: boolean
  data: Notification[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const notificationsApi = {
  list: (page = 1, limit = 20, unreadOnly = false) =>
    apiClient
      .get<PaginatedNotificationsResponse>('/notifications', { params: { page, limit, unreadOnly: unreadOnly ? 'true' : undefined } })
      .then((r) => r.data),

  getUnreadCount: () =>
    apiClient.get<ApiResponse<{ count: number }>>('/notifications/unread-count').then((r) => r.data.data),

  markAsRead: (id: string) =>
    apiClient.patch<ApiResponse<void>>(`/notifications/${id}/read`).then((r) => r.data),

  markAllAsRead: () =>
    apiClient.patch<ApiResponse<void>>('/notifications/read-all').then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/notifications/${id}`).then((r) => r.data),
}
