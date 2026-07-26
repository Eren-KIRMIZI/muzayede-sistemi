import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { NotificationService } from '../notification/notification.service'

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name)

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async createPayment(auctionId: string, buyerId: string) {
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
      include: { winner: true },
    })

    if (!auction) throw new NotFoundException('Auction not found')
    if (auction.status !== 'SOLD') throw new BadRequestException('Auction is not sold')
    if (!auction.winnerId) throw new BadRequestException('No winner for this auction')
    if (auction.winnerId !== buyerId) throw new ForbiddenException('You are not the winner')
    if (auction.winnerId === auction.sellerId) throw new BadRequestException('Cannot pay for your own auction')

    const existing = await this.prisma.payment.findFirst({
      where: { auctionId, buyerId, status: { not: 'REFUNDED' } },
    })
    if (existing) throw new BadRequestException('Payment already exists for this auction')

    const amount = Number(auction.currentPrice)
    const fee = Math.round(amount * 0.05 * 100) / 100
    const net = Math.round((amount - fee) * 100) / 100

    const payment = await this.prisma.payment.create({
      data: {
        auctionId,
        buyerId,
        sellerId: auction.sellerId,
        amount,
        fee,
        net,
        status: 'COMPLETED',
        method: 'CARD',
        escrowStatus: 'HELD',
        paidAt: new Date(),
      },
    })

    this.notificationService
      .create(
        buyerId,
        'PAYMENT',
        'Payment processed',
        `Your payment of $${amount.toLocaleString()} for "${auction.title}" was successful.`,
        { auctionId, paymentId: payment.id },
      )
      .catch((err) => this.logger.error(`Failed to send payment notification to buyer: ${err.message}`))

    this.notificationService
      .create(
        auction.sellerId,
        'PAYMENT',
        'Payment received',
        `Payment of $${amount.toLocaleString()} received for "${auction.title}". Funds held in escrow.`,
        { auctionId, paymentId: payment.id },
      )
      .catch((err) => this.logger.error(`Failed to send payment notification to seller: ${err.message}`))

    return payment
  }

  async getPayment(id: string, userId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        auction: { select: { id: true, title: true } },
        buyer: { select: { id: true, firstName: true, lastName: true } },
        seller: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    if (!payment) throw new NotFoundException('Payment not found')
    if (payment.buyerId !== userId && payment.sellerId !== userId) {
      throw new ForbiddenException('Not your payment')
    }

    return payment
  }

  async releaseEscrow(id: string, userId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        auction: { select: { id: true, title: true } },
      },
    })

    if (!payment) throw new NotFoundException('Payment not found')
    // Sadece admin veya belirli yetkililer ya da alıcı (onay veren) çağırabilir
    // Basitlik adına buyerId veya admin yetkisi varsayıyoruz. 
    // Gerçekte RBAC guard kullanılmalıdır.
    if (payment.buyerId !== userId) {
      // For now, allow buyer to release escrow (confirming receipt)
      throw new ForbiddenException('Only the buyer can release escrow funds manually')
    }
    
    if (payment.escrowStatus !== 'HELD') {
      throw new BadRequestException(`Escrow is already ${payment.escrowStatus}`)
    }

    const updated = await this.prisma.payment.update({
      where: { id },
      data: {
        escrowStatus: 'RELEASED',
        releasedAt: new Date(),
      },
    })

    this.notificationService
      .create(
        payment.sellerId,
        'PAYMENT',
        'Funds Released',
        `The escrow funds of $${payment.net.toLocaleString()} for "${payment.auction.title}" have been released to your account.`,
        { auctionId: payment.auctionId, paymentId: payment.id },
      )
      .catch((err) => this.logger.error(`Failed to send escrow release notification to seller: ${err.message}`))

    return updated
  }

  async getMyPayments(userId: string, page = 1, limit = 20) {
    const where = {
      OR: [{ buyerId: userId }, { sellerId: userId }],
    }

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          auction: { select: { id: true, title: true, images: { where: { isPrimary: true }, take: 1 } } },
        },
      }),
      this.prisma.payment.count({ where }),
    ])

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }



  async refundPayment(paymentId: string, userId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } })
    if (!payment) throw new NotFoundException('Payment not found')
    if (payment.status === 'REFUNDED') throw new BadRequestException('Already refunded')
    if (payment.buyerId !== userId) throw new ForbiddenException('Not your payment')

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'REFUNDED', refundedAt: new Date(), escrowStatus: 'REFUNDED' },
    })

    this.notificationService
      .create(
        payment.sellerId,
        'PAYMENT',
        'Payment refunded',
        `Payment #${paymentId.slice(0, 8)} has been refunded to the buyer.`,
        { paymentId },
      )
      .catch((err) => this.logger.error(`Failed to send refund notification: ${err.message}`))

    return updated
  }

  async getPaymentByAuction(auctionId: string) {
    return this.prisma.payment.findFirst({
      where: { auctionId, status: { not: 'REFUNDED' } },
      include: {
        buyer: { select: { id: true, firstName: true, lastName: true } },
        seller: { select: { id: true, firstName: true, lastName: true } },
      },
    })
  }
}
