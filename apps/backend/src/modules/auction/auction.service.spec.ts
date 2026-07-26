import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common'
import { AuctionService } from './auction.service'
import { PrismaService } from '../../prisma/prisma.service'
import { NotificationService } from '../notification/notification.service'
import { CacheService } from '../../common/cache/cache.service'
import {
  createMockPrisma,
  createMockNotificationService,
  createMockCacheService,
  mockAuction,
  mockCategory,
} from '../../../test/helpers'

describe('AuctionService', () => {
  let service: AuctionService
  let prisma: ReturnType<typeof createMockPrisma>
  let notificationService: ReturnType<typeof createMockNotificationService>
  let cache: ReturnType<typeof createMockCacheService>

  beforeEach(async () => {
    prisma = createMockPrisma()
    notificationService = createMockNotificationService()
    cache = createMockCacheService()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuctionService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationService, useValue: notificationService },
        { provide: CacheService, useValue: cache },
      ],
    }).compile()

    service = module.get<AuctionService>(AuctionService)
  })

  describe('create', () => {
    it('should create auction successfully', async () => {
      prisma.category.findUnique.mockResolvedValue(mockCategory as any)
      prisma.auction.create.mockResolvedValue({
        ...mockAuction,
        category: mockCategory,
        images: [],
        seller: { id: 'user-1', firstName: 'Test', lastName: 'User', avatarUrl: null },
      } as any)

      const result = await service.create(
        {
          categoryId: 'cat-1',
          title: 'New Auction',
          description: 'Description',
          startingPrice: 100,
          bidIncrement: 10,
          endsAt: new Date(Date.now() + 86400000).toISOString(),
          location: 'Istanbul',
          shipping: 'Kargo',
        },
        'user-1',
      )

      expect(prisma.auction.create).toHaveBeenCalled()
      expect(result).toHaveProperty('id')
    })

    it('should throw BadRequestException for non-existent category', async () => {
      prisma.category.findUnique.mockResolvedValue(null)

      await expect(
        service.create(
          {
            categoryId: 'nonexistent',
            title: 'Test',
            description: 'Test',
            startingPrice: 100,
            bidIncrement: 10,
            endsAt: new Date(Date.now() + 86400000).toISOString(),
            location: 'Istanbul',
            shipping: 'Kargo',
          },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException for past end time', async () => {
      prisma.category.findUnique.mockResolvedValue(mockCategory as any)

      await expect(
        service.create(
          {
            categoryId: 'cat-1',
            title: 'Test',
            description: 'Test',
            startingPrice: 100,
            bidIncrement: 10,
            endsAt: new Date(Date.now() - 86400000).toISOString(),
            location: 'Istanbul',
            shipping: 'Kargo',
          },
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('findAll', () => {
    it('should return paginated auctions', async () => {
      prisma.auction.findMany.mockResolvedValue([
        { ...mockAuction, _count: { bids: 3, watchers: 2 } },
      ] as any)
      prisma.auction.count.mockResolvedValue(1)

      const result = await service.findAll({ page: 1, limit: 20 })

      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.totalPages).toBe(1)
    })

    it('should filter by search term', async () => {
      prisma.auction.findMany.mockResolvedValue([] as any)
      prisma.auction.count.mockResolvedValue(0)

      await service.findAll({ search: 'test', page: 1, limit: 20 })

      expect(prisma.auction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { title: { contains: 'test', mode: 'insensitive' } },
            ]),
          }),
        }),
      )
    })

    it('should sort by ending_soon', async () => {
      prisma.auction.findMany.mockResolvedValue([] as any)
      prisma.auction.count.mockResolvedValue(0)

      await service.findAll({ sort: 'ending_soon', page: 1, limit: 20 })

      expect(prisma.auction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { endsAt: 'asc' },
        }),
      )
    })
  })

  describe('findOne', () => {
    it('should return auction by id', async () => {
      prisma.auction.findUnique.mockResolvedValue({
        ...mockAuction,
        category: mockCategory,
        images: [],
        seller: { id: 'user-1', firstName: 'Test', lastName: 'User', avatarUrl: null, bio: null },
        bids: [],
        _count: { bids: 3, watchers: 2 },
      } as any)

      const result = await service.findOne('auction-1')
      expect(result).toHaveProperty('id', 'auction-1')
    })

    it('should throw NotFoundException for non-existent auction', async () => {
      prisma.auction.findUnique.mockResolvedValue(null)

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException)
    })

    it('should throw NotFoundException for deleted auction', async () => {
      prisma.auction.findUnique.mockResolvedValue({
        ...mockAuction,
        deletedAt: new Date(),
      } as any)

      await expect(service.findOne('auction-1')).rejects.toThrow(NotFoundException)
    })
  })

  describe('update', () => {
    it('should update own draft auction', async () => {
      prisma.auction.findUnique.mockResolvedValue({
        ...mockAuction,
        status: 'DRAFT',
      } as any)
      prisma.auction.update.mockResolvedValue(mockAuction as any)

      const result = await service.update('auction-1', { title: 'Updated' }, 'user-1')
      expect(prisma.auction.update).toHaveBeenCalled()
    })

    it('should throw ForbiddenException for non-owner', async () => {
      prisma.auction.findUnique.mockResolvedValue(mockAuction as any)

      await expect(
        service.update('auction-1', { title: 'Updated' }, 'other-user'),
      ).rejects.toThrow(ForbiddenException)
    })

    it('should throw ConflictException for non-draft auction', async () => {
      prisma.auction.findUnique.mockResolvedValue(mockAuction as any)

      await expect(
        service.update('auction-1', { title: 'Updated' }, 'user-1'),
      ).rejects.toThrow(ConflictException)
    })
  })

  describe('publish', () => {
    it('should publish draft auction', async () => {
      prisma.auction.findUnique.mockResolvedValue({
        ...mockAuction,
        status: 'DRAFT',
      } as any)
      prisma.auction.update.mockResolvedValue({} as any)

      await service.publish('auction-1', 'user-1')
      expect(prisma.auction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'ACTIVE', isLive: true }),
        }),
      )
    })

    it('should throw ConflictException for non-draft auction', async () => {
      prisma.auction.findUnique.mockResolvedValue(mockAuction as any)

      await expect(service.publish('auction-1', 'user-1')).rejects.toThrow(ConflictException)
    })
  })

  describe('remove', () => {
    it('should soft-delete draft auction', async () => {
      prisma.auction.findUnique.mockResolvedValue({
        ...mockAuction,
        status: 'DRAFT',
      } as any)
      prisma.auction.update.mockResolvedValue({} as any)

      const result = await service.remove('auction-1', 'user-1')
      expect(result).toHaveProperty('message', 'Auction deleted')
    })

    it('should throw ConflictException for non-draft auction', async () => {
      prisma.auction.findUnique.mockResolvedValue(mockAuction as any)

      await expect(service.remove('auction-1', 'user-1')).rejects.toThrow(ConflictException)
    })
  })

  describe('toggleWatch', () => {
    it('should add to watchlist', async () => {
      prisma.auction.findUnique.mockResolvedValue(mockAuction as any)
      prisma.watchlist.findUnique.mockResolvedValue(null)
      prisma.watchlist.create.mockResolvedValue({} as any)
      prisma.auction.update.mockResolvedValue({} as any)

      const result = await service.toggleWatch('auction-1', 'user-2')
      expect(result).toEqual({ watching: true })
    })

    it('should remove from watchlist', async () => {
      prisma.auction.findUnique.mockResolvedValue(mockAuction as any)
      prisma.watchlist.findUnique.mockResolvedValue({ id: 'watch-1' } as any)
      prisma.watchlist.delete.mockResolvedValue({} as any)
      prisma.auction.update.mockResolvedValue({} as any)

      const result = await service.toggleWatch('auction-1', 'user-2')
      expect(result).toEqual({ watching: false })
    })
  })
})
