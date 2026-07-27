import { Injectable, Inject, Logger } from '@nestjs/common'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'

export enum CacheTTL {
  SHORT = 10,
  MEDIUM = 30,
  LONG = 300,
  VERY_LONG = 3600,
}

export enum CacheKey {
  AUCTION_BY_ID = 'auction:id:',
  AUCTION_LIST = 'auction:list:',
  AUCTION_FEATURED = 'auction:featured',
  AUCTION_ENDING_SOON = 'auction:ending_soon',
  CATEGORY_ALL = 'category:all',
  CATEGORY_BY_ID = 'category:id:',
  BID_SUMMARY = 'bid:summary:',
  BID_LEADERBOARD = 'bid:leaderboard:',
  USER_SESSIONS = 'user:sessions:',
  USER_WATCHLIST = 'user:watchlist:',
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name)
  private readonly locks = new Map<string, Promise<any>>()

  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await this.cache.get<T>(key)
    } catch (err) {
      this.logger.warn(`Cache get failed for ${key}: ${err}`)
      return undefined
    }
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      await this.cache.set(key, value, ttl)
    } catch (err) {
      this.logger.warn(`Cache set failed for ${key}: ${err}`)
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cache.del(key)
    } catch (err) {
      this.logger.warn(`Cache del failed for ${key}: ${err}`)
    }
  }

  async reset(): Promise<void> {
    try {
      await this.cache.reset()
    } catch (err) {
      this.logger.warn(`Cache reset failed: ${err}`)
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await (this.cache as any).store?.keys?.(pattern)
      if (keys && Array.isArray(keys)) {
        await Promise.all(keys.map((key: string) => this.cache.del(key)))
      }
    } catch (err) {
      this.logger.warn(`Cache invalidatePattern failed for ${pattern}: ${err}`)
    }
  }

  getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    return this.getOrSetSafe(key, factory, ttl)
  }

  private async getOrSetSafe<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached != null) return cached

    if (this.locks.has(key)) {
      return this.locks.get(key)
    }

    const promise = (async () => {
      try {
        const value = await factory()
        await this.set(key, value, ttl)
        return value
      } finally {
        this.locks.delete(key)
      }
    })()

    this.locks.set(key, promise)
    return promise
  }

  async invalidateAuction(auctionId: string): Promise<void> {
    await Promise.all([
      this.del(`${CacheKey.AUCTION_BY_ID}${auctionId}`),
      this.invalidatePattern(`${CacheKey.AUCTION_LIST}*`),
      this.del(CacheKey.AUCTION_FEATURED),
      this.del(CacheKey.AUCTION_ENDING_SOON),
      this.del(`${CacheKey.BID_SUMMARY}${auctionId}`),
      this.del(`${CacheKey.BID_LEADERBOARD}${auctionId}`),
    ])
  }

  async invalidateCategory(categoryId?: string): Promise<void> {
    await Promise.all([
      this.del(CacheKey.CATEGORY_ALL),
      categoryId ? this.del(`${CacheKey.CATEGORY_BY_ID}${categoryId}`) : Promise.resolve(),
    ])
  }
}
