import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { PlaceBidDto } from './dto/place-bid.dto'
import { NotificationService } from '../notification/notification.service'
import { AuctionGateway } from '../notification/notification.gateway'
import { CacheService, CacheKey, CacheTTL } from '../../common/cache/cache.service'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { BotDetectionService } from '../fraud/bot-detection.service'
import { ShillBiddingService } from '../fraud/shill-bidding.service'
@Injectable()
export class BidService {
  private readonly logger = new Logger(BidService.name)

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private gateway: AuctionGateway,
    private cache: CacheService,
    private botDetection: BotDetectionService,
    private shillBidding: ShillBiddingService,
    @InjectQueue('notification-queue') private notificationQueue: Queue,
  ) {}

  async placeBid(auctionId: string, userId: string, dto: PlaceBidDto) {
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
      include: { seller: true },
    })

    if (!auction) throw new NotFoundException('Auction not found')
    if (auction.deletedAt) throw new NotFoundException('Auction not found')
    if (auction.status !== 'ACTIVE') throw new BadRequestException('Auction is not active')
    if (auction.sellerId === userId) throw new ConflictException('Cannot bid on your own auction')
    if (auction.endsAt && auction.endsAt <= new Date()) throw new BadRequestException('Auction has ended')

    const minBid = Number(auction.currentPrice) + Number(auction.bidIncrement)
    if (dto.amount < minBid) {
      throw new BadRequestException(`Minimum bid is ${minBid}`)
    }

    // Capture bid event for bot detection (async)
    // Wait slightly to simulate processing, in real-world we'd pass request headers from controller
    this.botDetection.calculateBotScore([{
      userId,
      auctionId,
      timestamp: Date.now(),
      ip: '127.0.0.1', // Placeholder, should be injected from context
      userAgent: 'unknown', // Placeholder
      fingerprint: 'unknown',
      responseTimeMs: Math.random() * 1000,
    }]).then(profile => {
      if (profile.botScore > 0.8) {
        this.logger.warn(`High bot score detected for user ${userId}: ${profile.botScore}`)
      }
    }).catch(err => this.logger.error(`Bot detection failed: ${err.message}`))

    // Detect shill bidding (async)
    Promise.all([
      this.shillBidding.checkIPCorrelation(auctionId, auction.sellerId, userId, '127.0.0.1'),
      this.shillBidding.detectRapidEscalation(auctionId)
    ]).then(([ipResult, escalationResult]) => {
      if (ipResult.isMatch) {
        this.logger.warn(`Shill bidding IP match detected! Seller: ${auction.sellerId}, Bidder: ${userId}`)
      }
      if (escalationResult.suspicious) {
        this.logger.warn(`Suspicious rapid escalation detected on auction ${auctionId}. Pattern: ${escalationResult.pattern}`)
      }
    }).catch(err => this.logger.error(`Shill bidding detection failed: ${err.message}`))

    const previousVersion = auction.version

    // Track previous highest bidder for outbid notification
    const previousWinnerId = auction.winnerId

    // Mark previous winning bid as outbid
    if (auction.winningBidId) {
      await this.prisma.bid.update({
        where: { id: auction.winningBidId },
        data: { status: 'OUTBID' },
      })
    }

    // Create new bid
    const bid = await this.prisma.bid.create({
      data: {
        auctionId,
        userId,
        amount: dto.amount,
        maxAmount: dto.maxAmount,
        isAutoBid: dto.isAutoBid || false,
        status: 'WINNING',
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    })

    // Anti-Sniping: Extend by 5 minutes if bid placed in the last 5 minutes
    const now = new Date()
    let newEndsAt = auction.endsAt
    if (auction.endsAt && (auction.endsAt.getTime() - now.getTime()) < 5 * 60 * 1000) {
      newEndsAt = new Date(now.getTime() + 5 * 60 * 1000)
    }

    // Update auction with optimistic locking
    const updateResult = await this.prisma.auction.updateMany({
      where: { id: auctionId, version: previousVersion },
      data: {
        currentPrice: dto.amount,
        bidCount: { increment: 1 },
        winningBidId: bid.id,
        winnerId: userId,
        version: { increment: 1 },
        ...(newEndsAt !== auction.endsAt ? { endsAt: newEndsAt } : {}),
      },
    })

    if (updateResult.count === 0) {
      throw new ConflictException('Auction was modified by another user. Please try again.')
    }

    // Broadcast bid via WebSocket to all auction participants
    this.gateway.broadcastBid(auctionId, bid)

    // Invalidate auction cache after bid
    await this.cache.invalidateAuction(auctionId)

    // Notify outbid user (if different from current bidder)
    if (previousWinnerId && previousWinnerId !== userId) {
      this.notificationQueue.add('outbid', {
        userId: previousWinnerId,
        type: 'OUTBID',
        title: 'Teklifiniz geçildi!',
        message: `"${auction.title}" açık artırmasında teklifiniz geçildi. Yeni en yüksek teklif: ${dto.amount} TL`,
        data: { auctionId, newAmount: dto.amount.toString(), bidId: bid.id },
        auctionId,
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      }).catch((err) => this.logger.error(`Failed to queue outbid notification: ${err.message}`))
    }

    // Notify seller about new bid (if seller is not the bidder)
    if (auction.sellerId !== userId) {
      this.notificationQueue.add('bid_placed', {
        userId: auction.sellerId,
        type: 'BID_PLACED',
        title: 'Yeni teklif alındı',
        message: `"${auction.title}" açık artırmanıza yeni bir teklif geldi: ${dto.amount} TL`,
        data: { auctionId, bidId: bid.id, amount: dto.amount.toString() },
        auctionId,
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      }).catch((err) => this.logger.error(`Failed to queue seller notification: ${err.message}`))
    }

    // Process auto-bids from other users
    if (!dto.isAutoBid) {
      await this.processAutoBids(auctionId, userId, dto.amount)
    }

    return bid
  }

  private async processAutoBids(auctionId: string, currentBidderId: string, currentAmount: number) {
    const auction = await this.prisma.auction.findUnique({ where: { id: auctionId } })
    if (!auction) return

    const autoBids = await this.prisma.bid.findMany({
      where: {
        auctionId,
        isAutoBid: true,
        status: 'OUTBID',
        userId: { not: currentBidderId },
        maxAmount: { gt: currentAmount },
      },
      orderBy: { createdAt: 'desc' },
      distinct: ['userId'],
    })

    for (const autoBid of autoBids) {
      const nextBid = Math.min(
        currentAmount + Number(auction.bidIncrement),
        Number(autoBid.maxAmount),
      )

      if (nextBid > currentAmount) {
        // Mark previous winning as outbid
        if (auction.winningBidId) {
          await this.prisma.bid.update({
            where: { id: auction.winningBidId },
            data: { status: 'OUTBID' },
          })
        }

        const newBid = await this.prisma.bid.create({
          data: {
            auctionId,
            userId: autoBid.userId,
            amount: nextBid,
            maxAmount: autoBid.maxAmount,
            isAutoBid: true,
            status: 'WINNING',
          },
        })

        // Anti-Sniping for auto-bids
        const now = new Date()
        let newEndsAt = auction.endsAt
        if (auction.endsAt && (auction.endsAt.getTime() - now.getTime()) < 5 * 60 * 1000) {
          newEndsAt = new Date(now.getTime() + 5 * 60 * 1000)
        }

        const updateResult = await this.prisma.auction.updateMany({
          where: { id: auctionId, version: auction.version },
          data: {
            currentPrice: nextBid,
            bidCount: { increment: 1 },
            winningBidId: newBid.id,
            winnerId: autoBid.userId,
            version: { increment: 1 },
            ...(newEndsAt !== auction.endsAt ? { endsAt: newEndsAt } : {}),
          },
        })

        if (updateResult.count === 0) {
          this.logger.warn(`Auto-bid: optimistic lock conflict for auction ${auctionId}`)
          break
        }

        break
      }
    }
  }

  async getBidHistory(auctionId: string, page = 1, limit = 20) {
    const auction = await this.prisma.auction.findUnique({ where: { id: auctionId } })
    if (!auction) throw new NotFoundException('Auction not found')

    const [bids, total] = await Promise.all([
      this.prisma.bid.findMany({
        where: { auctionId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      }),
      this.prisma.bid.count({ where: { auctionId } }),
    ])

    return {
      data: bids,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async getUserBids(userId: string, page = 1, limit = 20) {
    const [bids, total] = await Promise.all([
      this.prisma.bid.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          auction: {
            include: {
              category: true,
              images: { where: { isPrimary: true }, take: 1 },
              seller: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
            },
          },
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      }),
      this.prisma.bid.count({ where: { userId } }),
    ])

    return {
      data: bids,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async getBidSummary(auctionId: string) {
    const auction = await this.prisma.auction.findUnique({ where: { id: auctionId } })
    if (!auction) throw new NotFoundException('Auction not found')

    return this.cache.getOrSet(
      `${CacheKey.BID_SUMMARY}${auctionId}`,
      async () => {
        const [totalBids, uniqueBidders, latestBid] = await Promise.all([
          this.prisma.bid.count({ where: { auctionId } }),
          this.prisma.bid.findMany({
            where: { auctionId },
            select: { userId: true },
            distinct: ['userId'],
          }),
          this.prisma.bid.findFirst({
            where: { auctionId },
            orderBy: { createdAt: 'desc' },
            include: {
              user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
            },
          }),
        ])

        return {
          totalBids,
          uniqueBidders: uniqueBidders.length,
          currentPrice: auction.currentPrice,
          startingPrice: auction.startingPrice,
          bidIncrement: auction.bidIncrement,
          latestBid,
          winner: auction.winnerId
            ? await this.prisma.user.findUnique({
                where: { id: auction.winnerId },
                select: { id: true, firstName: true, lastName: true, avatarUrl: true },
              })
            : null,
        }
      },
      CacheTTL.SHORT,
    )
  }
}
