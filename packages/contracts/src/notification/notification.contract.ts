export interface CreateNotificationDto {
  userId: string
  type: string
  title: string
  message: string
  data?: Record<string, unknown>
}

export interface NotificationDto {
  id: string
  userId: string
  type: string
  title: string
  message: string
  data?: Record<string, unknown>
  isRead: boolean
  createdAt: Date
}
