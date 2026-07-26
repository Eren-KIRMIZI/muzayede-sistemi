import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from '../../prisma/prisma.service'
import { NotificationService } from '../notification/notification.service'
import { AuctionGateway } from '../notification/notification.gateway'
import { PaymentService } from '../payment/payment.service'

@Injectable()
export class AuctionScheduler {
  private readonly logger = new Logger(AuctionScheduler.name)

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private gateway: AuctionGateway,
    private paymentService: PaymentService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleAuctionEnd() {
    const now = new Date()

    const endedAuctions = await this.prisma.auction.findMany({
      where: {
        status: 'ACTIVE',
        endsAt: { lte: now },
        deletedAt: null,
      },
      include: {
        seller: { select: { id: true, firstName: true, lastName: true } },
        winner: { select: { id: true, firstName: true, lastName: true } },
        category: { select: { name: true } },
      },
    })

    if (endedAuctions.length === 0) return

    this.logger.log(`Processing ${endedAuctions.length} ended auction(s)`)

    for (const auction of endedAuctions) {
      try {
        await this.closeAuction(auction)
      } catch (error: any) {
        this.logger.error(`Failed to close auction ${auction.id}: ${error.message}`)
      }
    }
  }

  private async closeAuction(auction: any) {
    const hasBids = auction.bidCount > 0
    const reserveMet = auction.reservePrice
      ? auction.currentPrice && Number(auction.currentPrice) >= Number(auction.reservePrice)
      : true

    let finalStatus: string
    let winnerId: string | null = null

    if (hasBids && reserveMet) {
      finalStatus = 'SOLD'
      winnerId = auction.winnerId
    } else {
      finalStatus = 'ENDED'
      winnerId = null
    }

    await this.prisma.auction.update({
      where: { id: auction.id },
      data: {
        status: finalStatus as any,
        winnerId,
        isLive: false,
      },
    })

    this.logger.log(`Auction ${auction.id} closed with status: ${finalStatus}`)

    // Broadcast auction end via WebSocket
    this.gateway.broadcastAuctionEnd(auction.id, winnerId)

    // Send notifications
    if (finalStatus === 'SOLD' && winnerId) {
      // Create payment record automatically
      try {
        await this.paymentService.createPayment(auction.id, winnerId)
        this.logger.log(`Payment created for auction ${auction.id}, winner ${winnerId}`)
      } catch (err: any) {
        this.logger.error(`Failed to create payment for auction ${auction.id}: ${err.message}`)
      }

      // Notify winner
      await this.notificationService.create(
        winnerId,
        'AUCTION_WON',
        'Tebrikler! Kazandınız!',
        `"${auction.title}" açık artırmayı ${auction.currentPrice} TL'ye kazandınız.`,
        { auctionId: auction.id, amount: auction.currentPrice?.toString() },
      )

      // Send WS notification to winner
      this.gateway.sendNotification(winnerId, {
        type: 'AUCTION_WON',
        title: 'Tebrikler! Kazandınız!',
        message: `"${auction.title}" açık artırmayı kazandınız.`,
        auctionId: auction.id,
      })

      // Notify seller
      if (auction.sellerId !== winnerId) {
        await this.notificationService.create(
          auction.sellerId,
          'AUCTION_ENDED',
          'Açık artırma tamamlandı',
          `"${auction.title}" açık artırması satıldı.`,
          { auctionId: auction.id, winnerId, amount: auction.currentPrice?.toString() },
        )
      }
    } else {
      // No winner - notify seller
      await this.notificationService.create(
        auction.sellerId,
        'AUCTION_ENDED',
        'Açık artırma sona erdi',
        `"${auction.title}" açık artırması yeterli teklif almadı.`,
        { auctionId: auction.id, status: finalStatus },
      )
    }

    // Notify all outbid users
    const outbidUsers = await this.prisma.bid.findMany({
      where: {
        auctionId: auction.id,
        status: 'OUTBID',
      },
      select: { userId: true },
      distinct: ['userId'],
    })

    for (const { userId } of outbidUsers) {
      if (userId !== winnerId) {
        await this.notificationService.create(
          userId,
          'AUCTION_ENDED',
          'Açık artırma sona erdi',
          `Takip ettiğiniz "${auction.title}" açık artırması sona erdi.`,
          { auctionId: auction.id },
        )
      }
    }
  }
}
