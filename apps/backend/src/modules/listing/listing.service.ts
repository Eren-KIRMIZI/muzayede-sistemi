import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateListingDto } from './dto/create-listing.dto'
import { UpdateListingDto } from './dto/update-listing.dto'
import { FilterListingDto } from './dto/filter-listing.dto'

@Injectable()
export class ListingService {
  private readonly logger = new Logger(ListingService.name)

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new listing in DRAFT status.
   * Sellers prepare their listing before publishing.
   */
  async create(dto: CreateListingDto, sellerId: string) {
    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } })
    if (!category) throw new NotFoundException('Category not found')

    const auction = await this.prisma.auction.create({
      data: {
        sellerId,
        categoryId: dto.categoryId,
        title: dto.title,
        description: dto.description,
        startingPrice: dto.startingPrice,
        reservePrice: dto.reservePrice ?? null,
        bidIncrement: dto.bidIncrement ?? 1,
        endsAt: new Date(dto.endsAt),
        location: dto.location ?? null,
        shipping: dto.shipping ?? null,
        status: 'DRAFT',
        images: dto.imageUrls?.length
          ? {
              create: dto.imageUrls.map((url, i) => ({
                url,
                alt: dto.title,
                sortOrder: i,
                isPrimary: i === 0,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
    })

    this.logger.log(`Listing created: ${auction.id} by seller ${sellerId}`)
    return auction
  }

  /**
   * Get all listings for a seller (all statuses).
   */
  async findMy(sellerId: string, query: FilterListingDto) {
    const { page = 1, limit = 20, status, categoryId, sortBy = 'createdAt', sortOrder = 'desc' } = query
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { sellerId, deletedAt: null }
    if (status) where.status = status
    if (categoryId) where.categoryId = categoryId

    const [data, total] = await Promise.all([
      this.prisma.auction.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { where: { isPrimary: true }, take: 1 },
          _count: { select: { bids: true } },
        },
      }),
      this.prisma.auction.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  /**
   * Get a single listing — seller can see their own draft.
   */
  async findOne(id: string, sellerId: string) {
    const auction = await this.prisma.auction.findFirst({
      where: { id, sellerId, deletedAt: null },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { bids: true } },
      },
    })
    if (!auction) throw new NotFoundException('Listing not found')
    return auction
  }

  /**
   * Update a listing — only allowed in DRAFT status.
   */
  async update(id: string, dto: UpdateListingDto, sellerId: string) {
    const auction = await this.prisma.auction.findFirst({ where: { id, sellerId } })
    if (!auction) throw new NotFoundException('Listing not found')
    if (auction.status !== 'DRAFT')
      throw new ForbiddenException('Only DRAFT listings can be edited')

    const updated = await this.prisma.auction.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description && { description: dto.description }),
        ...(dto.categoryId && { categoryId: dto.categoryId }),
        ...(dto.startingPrice !== undefined && { startingPrice: dto.startingPrice }),
        ...(dto.reservePrice !== undefined && { reservePrice: dto.reservePrice }),
        ...(dto.bidIncrement !== undefined && { bidIncrement: dto.bidIncrement }),
        ...(dto.endsAt && { endsAt: new Date(dto.endsAt) }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.shipping !== undefined && { shipping: dto.shipping }),
      },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
    })

    this.logger.log(`Listing updated: ${id}`)
    return updated
  }

  /**
   * Publish a draft listing → sets status to PENDING (or ACTIVE if startedAt is now).
   */
  async publish(id: string, sellerId: string) {
    const auction = await this.prisma.auction.findFirst({ where: { id, sellerId } })
    if (!auction) throw new NotFoundException('Listing not found')
    if (auction.status !== 'DRAFT') throw new BadRequestException('Only DRAFT listings can be published')
    if (!auction.endsAt) throw new BadRequestException('Listing must have an end date')
    if (new Date(auction.endsAt) <= new Date()) throw new BadRequestException('End date must be in the future')

    const published = await this.prisma.auction.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        startedAt: new Date(),
        currentPrice: auction.startingPrice,
        isLive: true,
      },
      include: { category: true, images: { orderBy: { sortOrder: 'asc' } } },
    })

    this.logger.log(`Listing published: ${id}`)
    return published
  }

  /**
   * Soft-delete a draft listing.
   */
  async remove(id: string, sellerId: string) {
    const auction = await this.prisma.auction.findFirst({ where: { id, sellerId } })
    if (!auction) throw new NotFoundException('Listing not found')
    if (!['DRAFT', 'PENDING'].includes(auction.status))
      throw new ForbiddenException('Only DRAFT/PENDING listings can be deleted')

    await this.prisma.auction.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'CANCELLED' as const },
    })

    this.logger.log(`Listing deleted: ${id}`)
    return { message: 'Listing deleted successfully' }
  }

  /**
   * Add images to an existing listing.
   */
  async addImages(id: string, sellerId: string, imageUrls: string[]) {
    const auction = await this.prisma.auction.findFirst({ where: { id, sellerId } })
    if (!auction) throw new NotFoundException('Listing not found')
    if (!['DRAFT', 'PENDING'].includes(auction.status))
      throw new ForbiddenException('Cannot add images to an active/ended listing')

    const existing = await this.prisma.auctionImage.count({ where: { auctionId: id } })
    if (existing + imageUrls.length > 10) throw new BadRequestException('Maximum 10 images allowed per listing')

    const images = await this.prisma.auctionImage.createMany({
      data: imageUrls.map((url, i) => ({
        auctionId: id,
        url,
        alt: auction.title,
        sortOrder: existing + i,
        isPrimary: existing === 0 && i === 0,
      })),
    })

    return { count: images.count }
  }

  /**
   * Remove a specific image from a listing.
   */
  async removeImage(id: string, imageId: string, sellerId: string) {
    const auction = await this.prisma.auction.findFirst({ where: { id, sellerId } })
    if (!auction) throw new NotFoundException('Listing not found')

    const image = await this.prisma.auctionImage.findFirst({ where: { id: imageId, auctionId: id } })
    if (!image) throw new NotFoundException('Image not found')

    await this.prisma.auctionImage.delete({ where: { id: imageId } })

    // If deleted image was primary, set next image as primary
    if (image.isPrimary) {
      const next = await this.prisma.auctionImage.findFirst({ where: { auctionId: id }, orderBy: { sortOrder: 'asc' } })
      if (next) await this.prisma.auctionImage.update({ where: { id: next.id }, data: { isPrimary: true } })
    }

    return { message: 'Image removed' }
  }
}
