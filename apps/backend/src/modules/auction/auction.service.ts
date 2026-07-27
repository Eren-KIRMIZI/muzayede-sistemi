import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException, Logger } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateAuctionDto } from './dto/create-auction.dto'
import { UpdateAuctionDto } from './dto/update-auction.dto'
import { QueryAuctionDto } from './dto/query-auction.dto'
import { NotificationService } from '../notification/notification.service'
import { CacheService, CacheKey, CacheTTL } from '../../common/cache/cache.service'

@Injectable()
export class AuctionService {
  private readonly logger = new Logger(AuctionService.name)

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private cache: CacheService,
  ) {}

  async create(dto: CreateAuctionDto, sellerId: string) {
    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } })
    if (!category) throw new BadRequestException('Category not found')

    const endsAt = new Date(dto.endsAt)
    if (endsAt <= new Date()) throw new BadRequestException('End time must be in the future')

    const auction = await this.prisma.auction.create({
      data: {
        sellerId,
        categoryId: dto.categoryId,
        title: dto.title,
        description: dto.description,
        startingPrice: dto.startingPrice,
        reservePrice: dto.reservePrice,
        currentPrice: dto.startingPrice,
        bidIncrement: dto.bidIncrement,
        endsAt,
        location: dto.location,
        shipping: dto.shipping,
        images: dto.imageUrls?.length
          ? {
              create: dto.imageUrls.map((url, i) => ({
                url,
                sortOrder: i,
                isPrimary: i === 0,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        seller: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    })

    await this.cache.invalidateAuction(auction.id)

    return auction
  }

  async findAll(query: QueryAuctionDto) {
    const cacheKey = `${CacheKey.AUCTION_LIST}${JSON.stringify(query)}`
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const where: any = { deletedAt: null }

        if (query.search) {
          where.OR = [
            { title: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
          ]
        }
        if (query.categoryId) where.categoryId = query.categoryId
        if (query.status) where.status = query.status
        if (query.sellerId) where.sellerId = query.sellerId
        if (query.featured) where.isFeatured = true
        if (query.live) where.isLive = true
        if (query.endingSoon) {
          where.endsAt = { gte: new Date(), lte: new Date(Date.now() + 3 * 60 * 60 * 1000) }
        }
        if (query.minPrice || query.maxPrice) {
          where.currentPrice = {}
          if (query.minPrice) where.currentPrice.gte = query.minPrice
          if (query.maxPrice) where.currentPrice.lte = query.maxPrice
        }

        let orderBy: any = { createdAt: 'desc' }
        switch (query.sort) {
          case 'ending_soon':
            orderBy = { endsAt: 'asc' }
            break
          case 'newly_listed':
            orderBy = { createdAt: 'desc' }
            break
          case 'price_high':
            orderBy = { currentPrice: 'desc' }
            break
          case 'price_low':
            orderBy = { currentPrice: 'asc' }
            break
          case 'most_bids':
            orderBy = { bidCount: 'desc' }
            break
          case 'most_watched':
            orderBy = { watcherCount: 'desc' }
            break
        }

        const [data, total] = await Promise.all([
          this.prisma.auction.findMany({
            where,
            orderBy,
            skip: ((query.page || 1) - 1) * (query.limit || 20),
            take: query.limit || 20,
            include: {
              category: true,
              images: { where: { isPrimary: true }, take: 1 },
              seller: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
              _count: { select: { bids: true, watchers: true } },
            },
          }),
          this.prisma.auction.count({ where }),
        ])

        return {
          data: data.map((a) => ({ ...a, bids: a._count.bids, watchers: a._count.watchers })),
          total,
          page: query.page,
          limit: query.limit,
          totalPages: Math.ceil(total / (query.limit || 20)),
        }
      },
      CacheTTL.SHORT,
    )
  }

  async findOne(id: string) {
    return this.cache.getOrSet(
      `${CacheKey.AUCTION_BY_ID}${id}`,
      async () => {
        const auction = await this.prisma.auction.findUnique({
          where: { id },
          include: {
            category: true,
            images: { orderBy: { sortOrder: 'asc' } },
            seller: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, bio: true } },
            bids: {
              orderBy: { createdAt: 'desc' },
              take: 10,
              include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
            },
            _count: { select: { bids: true, watchers: true } },
          },
        })

        if (!auction || auction.deletedAt) throw new NotFoundException('Auction not found')
        return { ...auction, bids: auction._count.bids, watchers: auction._count.watchers }
      },
      CacheTTL.MEDIUM,
    )
  }

  async update(id: string, dto: UpdateAuctionDto, userId: string) {
    const auction = await this.prisma.auction.findUnique({ where: { id } })
    if (!auction) throw new NotFoundException('Auction not found')
    if (auction.sellerId !== userId) throw new ForbiddenException('Not your auction')
    if (auction.status !== 'DRAFT') throw new ConflictException('Can only edit draft auctions')

    const updated = await this.prisma.auction.update({
      where: { id },
      data: dto,
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        seller: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    })

    await this.cache.invalidateAuction(id)

    return updated
  }

  async publish(id: string, userId: string) {
    const auction = await this.prisma.auction.findUnique({ where: { id } })
    if (!auction) throw new NotFoundException('Auction not found')
    if (auction.sellerId !== userId) throw new ForbiddenException('Not your auction')
    if (auction.status !== 'DRAFT') throw new ConflictException('Can only publish draft auctions')

    const updated = await this.prisma.auction.update({
      where: { id },
      data: { status: 'ACTIVE', startedAt: new Date(), isLive: true },
    })

    await this.cache.invalidateAuction(id)

    // Notify seller that auction is now live
    this.notificationService
      .create(
        userId,
        'SYSTEM',
        'Açık artırma yayında',
        `"${auction.title}" açık artırmınız yayınlandı.`,
        { auctionId: id },
      )
      .catch((err) => this.logger.error(`Failed to send publish notification: ${err.message}`))

    return updated
  }

  async remove(id: string, userId: string) {
    const auction = await this.prisma.auction.findUnique({ where: { id } })
    if (!auction) throw new NotFoundException('Auction not found')
    if (auction.sellerId !== userId) throw new ForbiddenException('Not your auction')
    if (auction.status !== 'DRAFT') throw new ConflictException('Can only delete draft auctions')

    await this.prisma.auction.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'CANCELLED' },
    })

    await this.cache.invalidateAuction(id)

    return { message: 'Auction deleted' }
  }

  async getCategories() {
    return this.cache.getOrSet(
      CacheKey.CATEGORY_ALL,
      async () => {
        return this.prisma.category.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: { _count: { select: { auctions: { where: { status: 'ACTIVE', deletedAt: null } } } } },
        })
      },
      CacheTTL.LONG,
    )
  }

  async getFeatured() {
    return this.cache.getOrSet(
      CacheKey.AUCTION_FEATURED,
      async () => {
        const data = await this.prisma.auction.findMany({
          where: { isFeatured: true, status: 'ACTIVE', deletedAt: null },
          take: 8,
          orderBy: { endsAt: 'asc' },
          include: {
            category: true,
            images: { where: { isPrimary: true }, take: 1 },
            seller: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
            _count: { select: { bids: true, watchers: true } },
          },
        })
        return data.map((a) => ({ ...a, bids: a._count.bids, watchers: a._count.watchers }))
      },
      CacheTTL.SHORT,
    )
  }

  async getEndingSoon() {
    return this.cache.getOrSet(
      CacheKey.AUCTION_ENDING_SOON,
      async () => {
        const data = await this.prisma.auction.findMany({
          where: {
            status: 'ACTIVE',
            deletedAt: null,
            endsAt: { gte: new Date(), lte: new Date(Date.now() + 3 * 60 * 60 * 1000) },
          },
          take: 20,
          orderBy: { endsAt: 'asc' },
          include: {
            category: true,
            images: { where: { isPrimary: true }, take: 1 },
            seller: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
            _count: { select: { bids: true, watchers: true } },
          },
        })
        return data.map((a) => ({ ...a, bids: a._count.bids, watchers: a._count.watchers }))
      },
      CacheTTL.SHORT,
    )
  }

  async toggleWatch(auctionId: string, userId: string) {
    const auction = await this.prisma.auction.findUnique({ where: { id: auctionId } })
    if (!auction) throw new NotFoundException('Auction not found')

    const existing = await this.prisma.watchlist.findUnique({
      where: { userId_auctionId: { userId, auctionId } },
    })

    if (existing) {
      await this.prisma.watchlist.delete({ where: { id: existing.id } })
      await this.prisma.auction.update({ where: { id: auctionId }, data: { watcherCount: { decrement: 1 } } })
      await this.cache.invalidateAuction(auctionId)
      return { watching: false }
    } else {
      await this.prisma.watchlist.create({ data: { userId, auctionId } })
      await this.prisma.auction.update({ where: { id: auctionId }, data: { watcherCount: { increment: 1 } } })
      await this.cache.invalidateAuction(auctionId)
      return { watching: true }
    }
  }

  async getWatchlist(userId: string, page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.watchlist.findMany({
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
              _count: { select: { bids: true, watchers: true } },
            },
          },
        },
      }),
      this.prisma.watchlist.count({ where: { userId } }),
    ])

    return {
      data: data.map((w) => ({
        ...w.auction,
        bids: w.auction._count.bids,
        watchers: w.auction._count.watchers,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }
}
