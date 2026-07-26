import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService } from '../../prisma/prisma.service'
import { NotificationService } from '../notification/notification.service'
import { AuctionGateway } from '../notification/notification.gateway'
import { InMemoryEventBus } from '../../common/events/in-memory-event-bus'

@Injectable()
export class AuctionJobsService {
  private readonly logger = new Logger(AuctionJobsService.name)

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private gateway: AuctionGateway,
    private eventBus: InMemoryEventBus,
  ) {}

  // ── Auction Expiry ────────────────────────────────────────────────────────
  // Runs every minute — finds auctions that have passed endsAt
  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredAuctions() {
    const now = new Date()

    const expired = await this.prisma.auction.findMany({
      where: {
        status: 'ACTIVE',
        endsAt: { lte: now },
      },
      include: {
        bids: {
          where: { status: 'WINNING' },
          orderBy: { amount: 'desc' },
          take: 1,
          include: { user: { select: { id: true, firstName: true, email: true } } },
        },
        seller: { select: { id: true, firstName: true } },
      },
    })

    if (expired.length === 0) return
    this.logger.log(`Processing ${expired.length} expired auction(s)`)

    for (const auction of expired) {
      const winningBid = auction.bids[0]

      if (winningBid) {
        // Has a winner
        await this.prisma.auction.update({
          where: { id: auction.id },
          data: {
            status: 'SOLD',
            isLive: false,
            winnerId: winningBid.userId,
            winningBidId: winningBid.id,
          },
        })

        // Notify winner
        this.notificationService.create(
          winningBid.userId,
          'AUCTION_END',
          '🏆 You Won!',
          `Congratulations! You won "${auction.title}" with a bid of $${winningBid.amount}.`,
          { auctionId: auction.id, bidId: winningBid.id, amount: winningBid.amount },
        ).catch((e) => this.logger.error(`Winner notification error: ${e.message}`))

        // Notify seller
        this.notificationService.create(
          auction.sellerId,
          'AUCTION_END',
          '🎉 Auction Sold!',
          `Your auction "${auction.title}" has ended. Winner: ${winningBid.user.firstName} ($${winningBid.amount}).`,
          { auctionId: auction.id, winnerId: winningBid.userId },
        ).catch((e) => this.logger.error(`Seller notification error: ${e.message}`))

        // Broadcast via WebSocket
        this.gateway.broadcastAuctionEnd(auction.id, {
          auctionId: auction.id,
          winnerId: winningBid.userId,
          winningAmount: winningBid.amount,
          status: 'SOLD',
        })

      } else {
        // No bids — mark as ENDED without a winner
        await this.prisma.auction.update({
          where: { id: auction.id },
          data: { status: 'ENDED', isLive: false },
        })

        // Notify seller
        this.notificationService.create(
          auction.sellerId,
          'AUCTION_END',
          '⏰ Auction Ended',
          `Your auction "${auction.title}" ended without any bids.`,
          { auctionId: auction.id },
        ).catch((e) => this.logger.error(`Seller notification error: ${e.message}`))

        this.gateway.broadcastAuctionEnd(auction.id, {
          auctionId: auction.id,
          status: 'ENDED',
        })
      }

      this.logger.log(`Auction ${auction.id} ended: ${winningBid ? 'SOLD' : 'ENDED (no bids)'}`)
    }
  }

  // ── Auto-Bid Processing ──────────────────────────────────────────────────
  // Runs every 30 seconds — process auto-bids for active auctions
  @Cron('*/30 * * * * *')
  async processAutoBids() {
    // Get all active auctions that have pending auto-bids
    const auctionsWithAutoBids = await this.prisma.auction.findMany({
      where: {
        status: 'ACTIVE',
        endsAt: { gt: new Date() },
        bids: { some: { isAutoBid: true, maxAmount: { not: null } } },
      },
      include: {
        bids: {
          where: { status: 'WINNING' },
          orderBy: { amount: 'desc' },
          take: 1,
        },
      },
      take: 50, // Process max 50 auctions per run
    })

    for (const auction of auctionsWithAutoBids) {
      await this.processAutoBidForAuction(auction)
    }
  }

  private async processAutoBidForAuction(auction: any) {
    const currentWinner = auction.bids[0]

    // Find the highest auto-bidder who is NOT the current winner
    const eligibleAutoBids = await this.prisma.bid.findMany({
      where: {
        auctionId: auction.id,
        isAutoBid: true,
        maxAmount: { not: null, gt: auction.currentPrice },
        userId: { not: currentWinner?.userId },
        status: { in: ['OUTBID', 'WINNING'] },
      },
      orderBy: { maxAmount: 'desc' },
    })

    if (eligibleAutoBids.length === 0) return

    const topAutoBid = eligibleAutoBids[0]
    const newBidAmount = Math.min(
      Number(topAutoBid.maxAmount!),
      Number(auction.currentPrice) + Number(auction.bidIncrement),
    )

    if (newBidAmount <= Number(auction.currentPrice)) return

    try {
      // Place the auto-bid in a transaction
      await this.prisma.$transaction(async (tx) => {
        // Outbid current winner
        if (currentWinner) {
          await tx.bid.update({
            where: { id: currentWinner.id },
            data: { status: 'OUTBID' },
          })

          // Notify outbid user
          this.notificationService.create(
            currentWinner.userId,
            'BID',
            '📢 You\'ve Been Outbid',
            `An auto-bid has surpassed your bid on "${auction.title}". Current price: $${newBidAmount}.`,
            { auctionId: auction.id },
          ).catch(() => {})
        }

        // Create the auto-bid
        const newBid = await tx.bid.create({
          data: {
            auctionId: auction.id,
            userId: topAutoBid.userId,
            amount: newBidAmount,
            maxAmount: topAutoBid.maxAmount,
            isAutoBid: true,
            status: 'WINNING',
          },
        })

        // Update auction current price and bid count
        await tx.auction.update({
          where: { id: auction.id },
          data: {
            currentPrice: newBidAmount,
            bidCount: { increment: 1 },
            winningBidId: newBid.id,
          },
        })

        // Broadcast the auto-bid
        this.gateway.broadcastBid(auction.id, {
          bid: {
            id: newBid.id,
            amount: newBidAmount,
            userId: topAutoBid.userId,
            isAutoBid: true,
            auctionId: auction.id,
          },
          currentPrice: newBidAmount,
          bidCount: auction.bidCount + 1,
        })
      })

      this.logger.debug(`Auto-bid placed on auction ${auction.id}: $${newBidAmount} by user ${topAutoBid.userId}`)
    } catch (err: any) {
      this.logger.error(`Auto-bid failed for auction ${auction.id}: ${err.message}`)
    }
  }

  // ── Escrow Auto-Release ──────────────────────────────────────────────────
  // Runs every day at 3am — release escrow for completed payments older than 7 days
  @Cron('0 3 * * *')
  async autoReleaseEscrow() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        escrowStatus: 'HELD',
        paidAt: { lte: sevenDaysAgo },
      },
      take: 100,
    })

    if (payments.length === 0) return
    this.logger.log(`Auto-releasing escrow for ${payments.length} payment(s)`)

    for (const payment of payments) {
      await this.prisma.payment
        .update({
          where: { id: payment.id },
          data: { escrowStatus: 'RELEASED', releasedAt: new Date() },
        })
        .then(() => {
          this.notificationService.create(
            payment.sellerId,
            'PAYMENT',
            '💳 Funds Released',
            `Escrow funds for your auction have been released to your account.`,
            { paymentId: payment.id, amount: payment.net },
          ).catch(() => {})
        })
        .catch((err) => this.logger.error(`Escrow release failed for ${payment.id}: ${err.message}`))
    }
  }

  // ── Watchlist Reminder ──────────────────────────────────────────────────
  // Runs every hour — notify watchers when auction is ending in 1 hour
  @Cron(CronExpression.EVERY_HOUR)
  async sendEndingSoonNotifications() {
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000)
    const fiftyMinFromNow = new Date(Date.now() + 50 * 60 * 1000)

    const endingSoon = await this.prisma.auction.findMany({
      where: {
        status: 'ACTIVE',
        endsAt: { gte: fiftyMinFromNow, lte: oneHourFromNow },
      },
      include: {
        watchers: { select: { userId: true } },
      },
    })

    for (const auction of endingSoon) {
      for (const watcher of auction.watchers) {
        this.notificationService.create(
          watcher.userId,
          'AUCTION_END',
          '⏳ Auction Ending Soon',
          `"${auction.title}" ends in about 1 hour!`,
          { auctionId: auction.id },
        ).catch(() => {})
      }
    }

    if (endingSoon.length > 0) {
      this.logger.log(`Sent ending-soon notifications for ${endingSoon.length} auction(s)`)
    }
  }
}
