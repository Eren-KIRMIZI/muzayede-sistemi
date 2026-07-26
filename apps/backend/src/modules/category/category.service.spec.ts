import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, ConflictException } from '@nestjs/common'
import { CategoryService } from './category.service'
import { PrismaService } from '../../prisma/prisma.service'
import { CacheService } from '../../common/cache/cache.service'
import { createMockPrisma, createMockCacheService, mockCategory } from '../../../test/helpers'

describe('CategoryService', () => {
  let service: CategoryService
  let prisma: ReturnType<typeof createMockPrisma>
  let cache: ReturnType<typeof createMockCacheService>

  beforeEach(async () => {
    prisma = createMockPrisma()
    cache = createMockCacheService()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        { provide: PrismaService, useValue: prisma },
        { provide: CacheService, useValue: cache },
      ],
    }).compile()

    service = module.get<CategoryService>(CategoryService)
  })

  describe('create', () => {
    it('should create category successfully', async () => {
      prisma.category.findFirst.mockResolvedValue(null)
      prisma.category.create.mockResolvedValue(mockCategory as any)

      const result = await service.create({ name: 'Electronics' })
      expect(result).toHaveProperty('name', 'Electronics')
      expect(result).toHaveProperty('slug', 'electronics')
    })

    it('should throw ConflictException for duplicate name', async () => {
      prisma.category.findFirst.mockResolvedValue(mockCategory as any)

      await expect(service.create({ name: 'Electronics' })).rejects.toThrow(ConflictException)
    })

    it('should auto-generate slug from name', async () => {
      prisma.category.findFirst.mockResolvedValue(null)
      prisma.category.create.mockResolvedValue(mockCategory as any)

      await service.create({ name: 'Home & Garden' })

      expect(prisma.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'home-garden' }),
        }),
      )
    })
  })

  describe('findAll', () => {
    it('should return active categories', async () => {
      prisma.category.findMany.mockResolvedValue([mockCategory] as any)

      const result = await service.findAll()
      expect(result).toHaveLength(1)
    })

    it('should include inactive when requested', async () => {
      prisma.category.findMany.mockResolvedValue([] as any)

      await service.findAll(true)

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      )
    })
  })

  describe('findOne', () => {
    it('should return category by id', async () => {
      prisma.category.findUnique.mockResolvedValue(mockCategory as any)

      const result = await service.findOne('cat-1')
      expect(result).toHaveProperty('id', 'cat-1')
    })

    it('should throw NotFoundException for non-existent category', async () => {
      prisma.category.findUnique.mockResolvedValue(null)

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException)
    })
  })

  describe('update', () => {
    it('should update category', async () => {
      prisma.category.findUnique.mockResolvedValue(mockCategory as any)
      prisma.category.findFirst.mockResolvedValue(null)
      prisma.category.update.mockResolvedValue({} as any)

      await service.update('cat-1', { name: 'New Name' })
      expect(prisma.category.update).toHaveBeenCalled()
    })

    it('should throw NotFoundException for non-existent category', async () => {
      prisma.category.findUnique.mockResolvedValue(null)

      await expect(service.update('nonexistent', { name: 'Test' })).rejects.toThrow(NotFoundException)
    })
  })

  describe('remove', () => {
    it('should delete category without auctions', async () => {
      prisma.category.findUnique.mockResolvedValue({
        ...mockCategory,
        _count: { auctions: 0 },
      } as any)
      prisma.category.delete.mockResolvedValue({} as any)

      const result = await service.remove('cat-1')
      expect(result).toHaveProperty('message', 'Category deleted')
    })

    it('should throw ConflictException for category with auctions', async () => {
      prisma.category.findUnique.mockResolvedValue({
        ...mockCategory,
        _count: { auctions: 5 },
      } as any)

      await expect(service.remove('cat-1')).rejects.toThrow(ConflictException)
    })
  })
})
