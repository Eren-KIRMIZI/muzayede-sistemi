import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { UpdateProfileDto } from './dto/update-profile.dto'

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        avatarUrl: true,
        bio: true,
        emailVerified: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    return user
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    await this.findById(id)

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        avatarUrl: true,
        bio: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { isDeleted: false },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where: { isDeleted: false } }),
    ])

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async softDelete(id: string) {
    await this.findById(id)

    return this.prisma.user.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date(), isActive: false },
    })
  }

  async updateRole(id: string, role: string) {
    await this.findById(id)

    return this.prisma.user.update({
      where: { id },
      data: { role: role as any },
      select: { id: true, email: true, role: true },
    })
  }

  async getMyStats(userId: string) {
    const [
      totalAuctions,
      activeAuctions,
      wonAuctions,
      activeBids,
      totalBids,
      highestBid,
      totalSpent,
      totalEarned,
      watchedCount,
    ] = await Promise.all([
      this.prisma.auction.count({ where: { sellerId: userId, deletedAt: null } }),
      this.prisma.auction.count({ where: { sellerId: userId, status: 'ACTIVE', deletedAt: null } }),
      this.prisma.auction.count({ where: { winnerId: userId, deletedAt: null, status: 'SOLD' } }),
      this.prisma.bid.count({ where: { userId, status: 'WINNING' } }),
      this.prisma.bid.count({ where: { userId } }),
      this.prisma.bid.findFirst({
        where: { userId },
        orderBy: { amount: 'desc' },
        select: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { buyerId: userId, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { sellerId: userId, status: 'COMPLETED' },
        _sum: { net: true },
      }),
      this.prisma.watchlist.count({ where: { userId } }),
    ])

    const recentBids = await this.prisma.bid.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { amount: true, createdAt: true, status: true },
    })

    const bidsPerMonth = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (6 - i))
      const start = new Date(date.getFullYear(), date.getMonth(), 1)
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
      return recentBids.filter(
        (b) => new Date(b.createdAt) >= start && new Date(b.createdAt) <= end,
      ).length
    })

    return {
      totalAuctions,
      activeAuctions,
      wonAuctions,
      activeBids,
      totalBids,
      highestBid: highestBid?.amount ? Number(highestBid.amount) : 0,
      totalSpent: Number(totalSpent._sum.amount ?? 0),
      totalEarned: Number(totalEarned._sum.net ?? 0),
      watchedCount,
      bidsPerMonth,
    }
  }

  async getMyWallet(userId: string) {
    const [payments, totalBalance] = await Promise.all([
      this.prisma.payment.findMany({
        where: { buyerId: userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          buyerId: true,
          amount: true,
          fee: true,
          net: true,
          status: true,
          method: true,
          escrowStatus: true,
          createdAt: true,
          auction: { select: { id: true, title: true } },
        },
      }),
      this.prisma.payment.aggregate({
        where: { sellerId: userId, status: 'COMPLETED', escrowStatus: 'RELEASED' },
        _sum: { net: true },
      }),
    ])

    const totalSpent = payments
      .filter((p) => p.status === 'COMPLETED' && p.buyerId === userId)
      .reduce((sum, p) => sum + Number(p.amount), 0)

    const heldInEscrow = payments
      .filter((p) => p.escrowStatus === 'HELD')
      .reduce((sum, p) => sum + Number(p.amount), 0)

    const availableBalance = Number(totalBalance._sum.net ?? 0)

    return {
      availableBalance,
      totalSpent,
      heldInEscrow,
      transactions: payments,
    }
  }
}
