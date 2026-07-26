import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { NotificationService } from './notification.service'
import { AuctionGateway } from './notification.gateway'

@Processor('notification-queue')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name)

  constructor(
    private readonly notificationService: NotificationService,
    private readonly gateway: AuctionGateway,
  ) {
    super()
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.debug(`Processing notification job: ${job.id} of type ${job.name}`)

    const { userId, type, title, message, data, auctionId } = job.data

    try {
      // Create DB notification
      if (userId && type && title && message) {
        await this.notificationService.create(userId, type, title, message, data)
      }

      // Send WebSocket notification if applicable
      if (userId && auctionId) {
        this.gateway.sendNotification(userId, {
          type,
          title,
          message,
          auctionId,
        })
      }

      this.logger.debug(`Completed notification job: ${job.id}`)
    } catch (error: any) {
      this.logger.error(`Failed to process notification job ${job.id}: ${error.message}`)
      throw error // Let BullMQ handle retries
    }
  }
}
