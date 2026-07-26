import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { Subject } from 'rxjs'

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name)
  private notificationStream = new Subject<any>()

  constructor(private prisma: PrismaService) {}

  getStream() {
    return this.notificationStream.asObservable()
  }

  async create(userId: string, type: string, title: string, message: string, data?: Record<string, any>) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: type as any,
        title,
        message,
        data: data || undefined,
      },
    })
    
    // Emit to SSE clients
    this.notificationStream.next(notification)

    // Send push notification (FCM) based on preferences
    this.sendPushNotification(userId, title, message, data).catch(err => 
      this.logger.error(`Failed to send push notification: ${err.message}`)
    )
    
    return notification
  }

  private async sendPushNotification(userId: string, title: string, body: string, data?: Record<string, any>) {
    const prefs = await this.prisma.userNotificationPreference.findUnique({
      where: { userId },
    })

    // Default to false if no preference is found
    if (!prefs?.push) {
      return
    }

    // In a real implementation, you would use firebase-admin here
    // e.g. await admin.messaging().send({ token: user.fcmToken, notification: { title, body } })
    this.logger.log(`[FCM MOCK] Push notification sent to user ${userId}: ${title}`)
  }

  async findAll(userId: string, page = 1, limit = 20, unreadOnly = false) {
    const where: any = { userId }
    if (unreadOnly) where.isRead = false

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ])

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    })
    return { count }
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    })
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })
  }

  async remove(id: string, userId: string) {
    return this.prisma.notification.deleteMany({
      where: { id, userId },
    })
  }
}
