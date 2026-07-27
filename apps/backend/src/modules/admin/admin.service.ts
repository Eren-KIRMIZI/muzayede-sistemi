import { Injectable, NotFoundException, Logger, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { Prisma } from '@prisma/client'

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name)

  constructor(private prisma: PrismaService) {}

  // ── Dashboard Stats ─────────────────────────────────────────────────────────

  async getDashboardStats() {
    const [
      totalUsers,
      totalAuctions,
      activeAuctions,
      totalPayments,
      totalRevenue,
      pendingFraud,
      todayNewUsers,
      todayNewAuctions,
    ] = await Promise.all([
      this.prisma.user.count({ where: { isDeleted: false } }),
      this.prisma.auction.count({ where: { deletedAt: null } }),
      this.prisma.auction.count({ where: { status: 'ACTIVE' } }),
      this.prisma.payment.count({ where: { status: 'COMPLETED' } }),
      this.prisma.payment.aggregate({ where: { status: 'COMPLETED' }, _sum: { fee: true } }),
      this.prisma.fraudEvent.count({ where: { status: 'PENDING' } }),
      this.prisma.user.count({
        where: {
          isDeleted: false,
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      this.prisma.auction.count({
        where: {
          deletedAt: null,
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ])

    return {
      users: { total: totalUsers, todayNew: todayNewUsers },
      auctions: { total: totalAuctions, active: activeAuctions, todayNew: todayNewAuctions },
      payments: { total: totalPayments, platformRevenue: Number(totalRevenue._sum.fee ?? 0) },
      fraud: { pending: pendingFraud },
    }
  }

  // ── User Management ──────────────────────────────────────────────────────────

  async getUsers(page = 1, limit = 20, search?: string, role?: string) {
    const where: Prisma.UserWhereInput = { isDeleted: false }
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (role) where.role = role as any

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          emailVerified: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
          _count: { select: { auctions: true, bids: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getUserDetails(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        auctions: { orderBy: { createdAt: 'desc' }, take: 5 },
        bids: { orderBy: { createdAt: 'desc' }, take: 5 },
        fraudEvents: { orderBy: { createdAt: 'desc' }, take: 5 },
        _count: { select: { auctions: true, bids: true, notifications: true } },
      },
    })
    if (!user) throw new NotFoundException('User not found')
    return user
  }

  async banUser(userId: string, adminId: string, reason: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new NotFoundException('User not found')
    if (user.role === 'ADMIN') throw new ForbiddenException('Cannot ban another admin')

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    })

    this.logger.warn(`User ${userId} banned by admin ${adminId}. Reason: ${reason}`)
    return { message: 'User banned', user: { id: updated.id, isActive: updated.isActive } }
  }

  async unbanUser(userId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new NotFoundException('User not found')

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true, failedAttempts: 0, lockedUntil: null },
    })

    this.logger.log(`User ${userId} unbanned by admin ${adminId}`)
    return { message: 'User unbanned', user: { id: updated.id, isActive: updated.isActive } }
  }

  async changeUserRole(userId: string, role: string, adminId: string) {
    const validRoles = ['USER', 'SELLER', 'MODERATOR', 'ADMIN']
    if (!validRoles.includes(role)) throw new ForbiddenException('Invalid role')

    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new NotFoundException('User not found')

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
    })

    this.logger.log(`User ${userId} role changed to ${role} by admin ${adminId}`)
    return { message: 'Role updated', user: { id: updated.id, role: updated.role } }
  }

  // ── Auction Management ───────────────────────────────────────────────────────

  async getAuctions(page = 1, limit = 20, status?: string) {
    const where: Prisma.AuctionWhereInput = { deletedAt: null }
    if (status) where.status = status as any

    const [data, total] = await Promise.all([
      this.prisma.auction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          seller: { select: { id: true, firstName: true, lastName: true, email: true } },
          category: { select: { id: true, name: true } },
          images: { where: { isPrimary: true }, take: 1 },
          _count: { select: { bids: true } },
        },
      }),
      this.prisma.auction.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async cancelAuction(auctionId: string, adminId: string, reason: string) {
    const auction = await this.prisma.auction.findUnique({ where: { id: auctionId } })
    if (!auction) throw new NotFoundException('Auction not found')
    if (['ENDED', 'SOLD', 'CANCELLED'].includes(auction.status)) {
      throw new ForbiddenException('Cannot cancel an ended/sold auction')
    }

    const updated = await this.prisma.auction.update({
      where: { id: auctionId },
      data: { status: 'CANCELLED', isLive: false },
    })

    this.logger.warn(`Auction ${auctionId} cancelled by admin ${adminId}. Reason: ${reason}`)
    return { message: 'Auction cancelled', auction: { id: updated.id, status: updated.status } }
  }

  async featureAuction(auctionId: string, featured: boolean, hot: boolean, adminId: string) {
    const auction = await this.prisma.auction.findUnique({ where: { id: auctionId } })
    if (!auction) throw new NotFoundException('Auction not found')

    const updated = await this.prisma.auction.update({
      where: { id: auctionId },
      data: { isFeatured: featured, isHot: hot },
    })

    this.logger.log(`Auction ${auctionId} featured=${featured} hot=${hot} by admin ${adminId}`)
    return { message: 'Auction updated', auction: { id: updated.id, isFeatured: updated.isFeatured, isHot: updated.isHot } }
  }

  // ── Payment Management ───────────────────────────────────────────────────────

  async getPayments(page = 1, limit = 20, status?: string) {
    const where: Prisma.PaymentWhereInput = {}
    if (status) where.status = status as any

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          buyer: { select: { id: true, firstName: true, lastName: true, email: true } },
          seller: { select: { id: true, firstName: true, lastName: true } },
          auction: { select: { id: true, title: true } },
        },
      }),
      this.prisma.payment.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  // ── Fraud Review ────────────────────────────────────────────────────────────

  async getFraudEvents(page = 1, limit = 20, status?: string) {
    const where: Prisma.FraudEventWhereInput = {}
    if (status) where.status = status as any

    const [data, total] = await Promise.all([
      this.prisma.fraudEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.fraudEvent.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async resolveFraudEvent(eventId: string, status: string, note: string, adminId: string) {
    const event = await this.prisma.fraudEvent.findUnique({ where: { id: eventId } })
    if (!event) throw new NotFoundException('Fraud event not found')

    const valid = ['CONFIRMED', 'DISMISSED']
    if (!valid.includes(status)) throw new ForbiddenException('Status must be CONFIRMED or DISMISSED')

    const updated = await this.prisma.fraudEvent.update({
      where: { id: eventId },
      data: {
        status: status as any,
        reviewNote: note,
        reviewedBy: adminId,
        resolvedAt: new Date(),
      },
    })

    this.logger.log(`Fraud event ${eventId} resolved as ${status} by admin ${adminId}`)
    return updated
  }

  // ── Audit Logs ───────────────────────────────────────────────────────────────

  async getAuditLogs(page = 1, limit = 50, action?: string, userId?: string) {
    const where: Prisma.AuditLogWhereInput = {}
    if (action) where.action = action as any
    if (userId) where.userId = userId

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }
}
