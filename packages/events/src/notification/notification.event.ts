export interface NotificationCreatedEvent {
  eventName: 'notification.created'
  notificationId: string
  userId: string
  type: string
  title: string
  message: string
  data?: Record<string, unknown>
  timestamp: Date
}
