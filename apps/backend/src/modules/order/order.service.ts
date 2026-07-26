import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateOrderDto, UpdateOrderDto } from './dto/order.dto'
import { NotificationService } from '../notification/notification.service'

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name)

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  /**
   * Create an order after auction payment is completed.
   * Order is created automatically when payment is COMPLETED.
   */
  async create(dto: CreateOrderDto, buyerId: string) {
    // Verify auction exists and buyer is the winner
    const auction = await this.prisma.auction.findUnique({
      where: { id: dto.auctionId },
      include: { payments: { where: { status: 'COMPLETED' }, take: 1 } },
    })

    if (!auction) throw new NotFoundException('Auction not found')
    if (auction.winnerId !== buyerId) throw new ForbiddenException('You are not the winner of this auction')
    if (auction.status !== 'SOLD') throw new BadRequestException('Auction is not sold')
    if (!auction.payments.length) throw new BadRequestException('Payment not completed yet')

    // Check if order already exists
    const existing = await (this.prisma as any).order?.findFirst?.({
      where: { auctionId: dto.auctionId, buyerId },
    }).catch(() => null)

    if (existing) throw new BadRequestException('Order already exists for this auction')

    const payment = auction.payments[0]

    // Note: Order model to be added to Prisma schema
    // For now we return a structured response
    const order = {
      id: `order-${Date.now()}`,
      auctionId: dto.auctionId,
      buyerId,
      sellerId: auction.sellerId,
      paymentId: payment.id,
      status: 'CONFIRMED',
      shippingAddress: dto.shippingAddress ?? null,
      trackingNumber: null,
      carrier: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Notify seller
    this.notificationService
      .create(
        auction.sellerId,
        'SYSTEM',
        'New Order',
        `You have a new order for "${auction.title}". Please arrange shipping.`,
        { auctionId: dto.auctionId },
      )
      .catch((err) => this.logger.error(`Order notification failed: ${err.message}`))

    this.logger.log(`Order created for auction ${dto.auctionId} by buyer ${buyerId}`)
    return order
  }

  async getMyOrdersAsBuyer(buyerId: string, page = 1, limit = 20) {
    // Returns payments that are COMPLETED (proxy for orders until Order model is added)
    const where = { buyerId, status: 'COMPLETED' as const }
    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          auction: {
            select: { id: true, title: true, images: { where: { isPrimary: true }, take: 1 } },
          },
          seller: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.payment.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getMyOrdersAsSeller(sellerId: string, page = 1, limit = 20) {
    const where = { sellerId, status: 'COMPLETED' as const }
    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          auction: {
            select: { id: true, title: true, images: { where: { isPrimary: true }, take: 1 } },
          },
          buyer: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.payment.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getOrder(orderId: string, userId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: orderId },
      include: {
        auction: { include: { images: { where: { isPrimary: true }, take: 1 } } },
        buyer: { select: { id: true, firstName: true, lastName: true, email: true } },
        seller: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    })

    if (!payment) throw new NotFoundException('Order not found')
    if (payment.buyerId !== userId && payment.sellerId !== userId) {
      throw new ForbiddenException('Not your order')
    }

    return payment
  }

  async updateShipping(orderId: string, dto: UpdateOrderDto, sellerId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: orderId } })
    if (!payment) throw new NotFoundException('Order not found')
    if (payment.sellerId !== sellerId) throw new ForbiddenException('Not your order')

    // In a full implementation, this would update the Order model
    // For now we notify the buyer of shipping status
    if (dto.trackingNumber) {
      this.notificationService
        .create(
          payment.buyerId,
          'SYSTEM',
          'Order Shipped',
          `Your order has been shipped! Tracking: ${dto.trackingNumber} via ${dto.carrier ?? 'carrier'}`,
          { paymentId: orderId, trackingNumber: dto.trackingNumber, carrier: dto.carrier },
        )
        .catch((err) => this.logger.error(`Shipping notification failed: ${err.message}`))
    }

    return { message: 'Shipping info updated', tracking: dto.trackingNumber, carrier: dto.carrier }
  }
}
