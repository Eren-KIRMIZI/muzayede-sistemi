import { Injectable, NotFoundException, ConflictException, OnModuleInit, Logger } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'
import { CacheService, CacheKey, CacheTTL } from '../../common/cache/cache.service'

@Injectable()
export class CategoryService implements OnModuleInit {
  private readonly logger = new Logger(CategoryService.name)
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async onModuleInit() {
    this.logger.log('Warming up category cache...')
    await this.findAll().catch(err => this.logger.warn(`Failed to warm up category cache: ${err.message}`))
  }

  async create(dto: CreateCategoryDto) {
    const slug = dto.slug || this.slugify(dto.name)

    const existing = await this.prisma.category.findFirst({
      where: { OR: [{ name: dto.name }, { slug }] },
    })

    if (existing) {
      throw new ConflictException('Category with this name or slug already exists')
    }

    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        icon: dto.icon,
        accentColor: dto.accentColor,
        sortOrder: dto.sortOrder ?? 0,
      },
    })

    await this.cache.invalidateCategory()

    return category
  }

  async findAll(includeInactive = false) {
    const cacheKey = includeInactive ? `${CacheKey.CATEGORY_ALL}:all` : CacheKey.CATEGORY_ALL

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        return this.prisma.category.findMany({
          where: includeInactive ? {} : { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: { select: { auctions: { where: { status: 'ACTIVE', deletedAt: null } } } },
          },
        })
      },
      CacheTTL.LONG,
    )
  }

  async findOne(id: string) {
    return this.cache.getOrSet(
      `${CacheKey.CATEGORY_BY_ID}${id}`,
      async () => {
        const category = await this.prisma.category.findUnique({
          where: { id },
          include: {
            _count: { select: { auctions: { where: { status: 'ACTIVE', deletedAt: null } } } },
          },
        })

        if (!category) throw new NotFoundException('Category not found')
        return category
      },
      CacheTTL.LONG,
    )
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({ where: { id } })
    if (!category) throw new NotFoundException('Category not found')

    if (dto.name || dto.slug) {
      const slug = dto.slug || (dto.name ? this.slugify(dto.name) : category.slug)
      const existing = await this.prisma.category.findFirst({
        where: {
          OR: [{ name: dto.name || '' }, { slug }],
          id: { not: id },
        },
      })
      if (existing) throw new ConflictException('Category with this name or slug already exists')
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug || (dto.name ? this.slugify(dto.name) : undefined),
        description: dto.description,
        icon: dto.icon,
        accentColor: dto.accentColor,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
    })

    await this.cache.invalidateCategory(id)

    return updated
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { auctions: true } } },
    })

    if (!category) throw new NotFoundException('Category not found')
    if (category._count.auctions > 0) {
      throw new ConflictException('Cannot delete category with existing auctions')
    }

    await this.prisma.category.delete({ where: { id } })

    await this.cache.invalidateCategory(id)

    return { message: 'Category deleted' }
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }
}
