import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common'
import { BidService } from './bid.service'
import { PrismaService } from '../../prisma/prisma.service'
import { NotificationService } from '../notification/notification.service'
import { AuctionGateway } from '../notification/notification.gateway'
import { CacheService } from '../../common/cache/cache.service'
import {
  createMockPrisma,
  createMockNotificationService,
  createMockGateway,
  createMockCacheService,
  mockAuction,
  mockBid,
  mockUser,
} from '../../../test/helpers'

describe('BidService', () => {
  let service: BidService
  let prisma: ReturnType<typeof createMockPrisma>
  let notificationService: ReturnType<typeof createMockNotificationService>
  let gateway: ReturnType<typeof createMockGateway>
  let cache: ReturnType<typeof createMockCacheService>

  beforeEach(async () => {
    prisma = createMockPrisma()
    notificationService = createMockNotificationService()
    gateway = createMockGateway()
    cache = createMockCacheService()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BidService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationService, useValue: notificationService },
        { provide: AuctionGateway, useValue: gateway },
        { provide: CacheService, useValue: cache },
      ],
    }).compile()

    service = module.get<BidService>(BidService)
  })

  describe('placeBid', () => {
    it('should place a valid bid', async () => {
      prisma.auction.findUnique
        .mockResolvedValueOnce({
          ...mockAuction,
          seller: mockUser,
        } as any)
        .mockResolvedValueOnce({
          ...mockAuction,
          seller: mockUser,
        } as any)
      prisma.bid.create.mockResolvedValue({
        ...mockBid,
        user: { id: 'user-2', firstName: 'Bidder', lastName: 'User', avatarUrl: null },
      } as any)
      prisma.bid.update.mockResolvedValue({} as any)
      prisma.bid.findMany.mockResolvedValue([] as any)
      prisma.auction.update.mockResolvedValue({} as any)

      const result = await service.placeBid('auction-1', 'user-2', { amount: 160 })

      expect(result).toHaveProperty('id')
      expect(prisma.bid.create).toHaveBeenCalled()
      expect(gateway.broadcastBid).toHaveBeenCalled()
    })

    it('should throw NotFoundException for non-existent auction', async () => {
      prisma.auction.findUnique.mockResolvedValue(null)

      await expect(
        service.placeBid('nonexistent', 'user-2', { amount: 160 }),
      ).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException for inactive auction', async () => {
      prisma.auction.findUnique.mockResolvedValue({
        ...mockAuction,
        status: 'ENDED',
        seller: mockUser,
      } as any)

      await expect(
        service.placeBid('auction-1', 'user-2', { amount: 160 }),
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw ConflictException when bidding on own auction', async () => {
      prisma.auction.findUnique.mockResolvedValue({
        ...mockAuction,
        sellerId: 'user-1',
        seller: { id: 'user-1' },
      } as any)

      await expect(
        service.placeBid('auction-1', 'user-1', { amount: 160 }),
      ).rejects.toThrow(ConflictException)
    })

    it('should throw BadRequestException for bid below minimum', async () => {
      prisma.auction.findUnique.mockResolvedValue({
        ...mockAuction,
        currentPrice: 150,
        bidIncrement: 10,
        seller: mockUser,
      } as any)

      await expect(
        service.placeBid('auction-1', 'user-2', { amount: 155 }),
      ).rejects.toThrow(BadRequestException)
    })

    it('should notify previous winner when outbid', async () => {
      prisma.auction.findUnique
        .mockResolvedValueOnce({
          ...mockAuction,
          winnerId: 'user-3',
          winningBidId: 'old-bid',
          seller: mockUser,
        } as any)
        .mockResolvedValueOnce({
          ...mockAuction,
          winnerId: 'user-3',
          winningBidId: 'old-bid',
          seller: mockUser,
        } as any)
      prisma.bid.update.mockResolvedValue({} as any)
      prisma.bid.findMany.mockResolvedValue([] as any)
      prisma.bid.create.mockResolvedValue({
        ...mockBid,
        user: { id: 'user-2', firstName: 'Bidder', lastName: 'User', avatarUrl: null },
      } as any)
      prisma.auction.update.mockResolvedValue({} as any)

      await service.placeBid('auction-1', 'user-2', { amount: 160 })

      expect(notificationService.create).toHaveBeenCalledWith(
        'user-3',
        'OUTBID',
        expect.any(String),
        expect.any(String),
        expect.any(Object),
      )
      expect(gateway.sendNotification).toHaveBeenCalled()
    })
  })

  describe('getBidHistory', () => {
    it('should return paginated bid history', async () => {
      prisma.auction.findUnique.mockResolvedValue(mockAuction as any)
      prisma.bid.findMany.mockResolvedValue([mockBid] as any)
      prisma.bid.count.mockResolvedValue(1)

      const result = await service.getBidHistory('auction-1', 1, 20)
      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it('should throw NotFoundException for non-existent auction', async () => {
      prisma.auction.findUnique.mockResolvedValue(null)

      await expect(service.getBidHistory('nonexistent')).rejects.toThrow(NotFoundException)
    })
  })

  describe('getBidSummary', () => {
    it('should return bid summary', async () => {
      prisma.auction.findUnique.mockResolvedValue({
        ...mockAuction,
        winnerId: 'user-2',
      } as any)
      prisma.bid.count.mockResolvedValue(5)
      prisma.bid.findMany.mockResolvedValue([{ userId: 'user-1' }, { userId: 'user-2' }] as any)
      prisma.bid.findFirst.mockResolvedValue(mockBid as any)
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-2',
        firstName: 'Winner',
        lastName: 'User',
        avatarUrl: null,
      } as any)

      const result = await service.getBidSummary('auction-1')
      expect(result).toHaveProperty('totalBids', 5)
      expect(result).toHaveProperty('uniqueBidders', 2)
    })

    it('should throw NotFoundException for non-existent auction', async () => {
      prisma.auction.findUnique.mockResolvedValue(null)

      await expect(service.getBidSummary('nonexistent')).rejects.toThrow(NotFoundException)
    })
  })
})
