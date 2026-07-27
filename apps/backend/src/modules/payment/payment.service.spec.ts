import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { PaymentService } from './payment.service'
import { PrismaService } from '../../prisma/prisma.service'
import { NotificationService } from '../notification/notification.service'
import {
  createMockPrisma,
  createMockNotificationService,
  mockUser,
  mockAuction,
  mockPayment,
} from '../../../test/helpers'

describe('PaymentService', () => {
  let service: PaymentService
  let prisma: ReturnType<typeof createMockPrisma>
  let notificationService: ReturnType<typeof createMockNotificationService>

  beforeEach(async () => {
    prisma = createMockPrisma()
    notificationService = createMockNotificationService()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationService, useValue: notificationService },
      ],
    }).compile()

    service = module.get<PaymentService>(PaymentService)
  })

  afterEach(() => jest.clearAllMocks())

  // ── createPayment ──────────────────────────────────────────────────────────

  describe('createPayment', () => {
    const soldAuction = {
      ...mockAuction,
      status: 'SOLD',
      currentPrice: 150,
      winnerId: 'user-2',
      winner: { id: 'user-2', firstName: 'Jane', lastName: 'Doe' },
    }

    it('should create payment successfully for the winner', async () => {
      ;(prisma.auction.findUnique as jest.Mock).mockResolvedValue(soldAuction)
      ;(prisma.payment.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.payment.create as jest.Mock).mockResolvedValue(mockPayment)

      const result = await service.createPayment('auction-1', 'user-2')

      expect(prisma.payment.create).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockPayment)
    })

    it('should throw NotFoundException when auction not found', async () => {
      ;(prisma.auction.findUnique as jest.Mock).mockResolvedValue(null)
      await expect(service.createPayment('auction-x', 'user-2')).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException when auction is not SOLD', async () => {
      ;(prisma.auction.findUnique as jest.Mock).mockResolvedValue({ ...soldAuction, status: 'ACTIVE' })
      await expect(service.createPayment('auction-1', 'user-2')).rejects.toThrow(BadRequestException)
    })

    it('should throw ForbiddenException when non-winner tries to pay', async () => {
      ;(prisma.auction.findUnique as jest.Mock).mockResolvedValue(soldAuction)
      await expect(service.createPayment('auction-1', 'user-99')).rejects.toThrow(ForbiddenException)
    })

    it('should throw BadRequestException when payment already exists', async () => {
      ;(prisma.auction.findUnique as jest.Mock).mockResolvedValue(soldAuction)
      ;(prisma.payment.findFirst as jest.Mock).mockResolvedValue(mockPayment)
      await expect(service.createPayment('auction-1', 'user-2')).rejects.toThrow(BadRequestException)
    })

    it('should calculate fee as 5% of amount', async () => {
      ;(prisma.auction.findUnique as jest.Mock).mockResolvedValue({ ...soldAuction, currentPrice: 200 })
      ;(prisma.payment.findFirst as jest.Mock).mockResolvedValue(null)
      ;(prisma.payment.create as jest.Mock).mockImplementation(({ data }) => Promise.resolve(data))

      const result = await service.createPayment('auction-1', 'user-2') as any
      expect(result.fee).toBe(10) // 5% of 200
      expect(result.net).toBe(190)
    })
  })

  // ── releaseEscrow ──────────────────────────────────────────────────────────

  describe('releaseEscrow', () => {
    it('should release escrow successfully', async () => {
      ;(prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment)
      ;(prisma.payment.update as jest.Mock).mockResolvedValue({
        ...mockPayment,
        escrowStatus: 'RELEASED',
        releasedAt: new Date(),
      })

      const result = await service.releaseEscrow('payment-1', 'user-2')
      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'payment-1' },
          data: expect.objectContaining({ escrowStatus: 'RELEASED' }),
        }),
      )
      expect(result.escrowStatus).toBe('RELEASED')
    })

    it('should throw NotFoundException if payment not found', async () => {
      ;(prisma.payment.findUnique as jest.Mock).mockResolvedValue(null)
      await expect(service.releaseEscrow('bad-id', 'user-2')).rejects.toThrow(NotFoundException)
    })

    it('should throw ForbiddenException if not the buyer', async () => {
      await expect(service.releaseEscrow('payment-1', 'admin-1')).rejects.toThrow(ForbiddenException)
    })

    it('should throw BadRequestException if escrow is not HELD', async () => {
      ;(prisma.payment.findUnique as jest.Mock).mockResolvedValue({
        ...mockPayment,
        escrowStatus: 'RELEASED',
      })
      await expect(service.releaseEscrow('payment-1', 'user-2')).rejects.toThrow(BadRequestException)
    })
  })

  // ── refundPayment ──────────────────────────────────────────────────────────

  describe('refundPayment', () => {
    it('should refund payment successfully for buyer', async () => {
      ;(prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment)
      ;(prisma.payment.update as jest.Mock).mockResolvedValue({
        ...mockPayment,
        status: 'REFUNDED',
        refundedAt: new Date(),
      })

      const result = await service.refundPayment('payment-1', 'user-2')
      expect(result.status).toBe('REFUNDED')
    })

    it('should throw ForbiddenException if non-buyer tries to refund', async () => {
      ;(prisma.payment.findUnique as jest.Mock).mockResolvedValue(mockPayment)
      await expect(service.refundPayment('payment-1', 'user-99')).rejects.toThrow(ForbiddenException)
    })

    it('should throw BadRequestException if already refunded', async () => {
      ;(prisma.payment.findUnique as jest.Mock).mockResolvedValue({
        ...mockPayment,
        status: 'REFUNDED',
      })
      await expect(service.refundPayment('payment-1', 'user-2')).rejects.toThrow(BadRequestException)
    })
  })

  // ── getMyPayments ──────────────────────────────────────────────────────────

  describe('getMyPayments', () => {
    it('should return paginated payments for user', async () => {
      ;(prisma.payment.findMany as jest.Mock).mockResolvedValue([mockPayment])
      ;(prisma.payment.count as jest.Mock).mockResolvedValue(1)

      const result = await service.getMyPayments('user-2', 1, 20)
      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.totalPages).toBe(1)
    })
  })
})
