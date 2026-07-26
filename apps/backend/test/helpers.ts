import { PrismaService } from '../src/prisma/prisma.service'
import { NotificationService } from '../src/modules/notification/notification.service'
import { AuctionGateway } from '../src/modules/notification/notification.gateway'
import { EmailService } from '../src/common/services/email.service'
import { CacheService } from '../src/common/cache/cache.service'

export function createMockPrisma() {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
    auction: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      count: jest.fn(),
      delete: jest.fn(),
    },
    bid: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    notification: {
      findMany: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    payment: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    refreshToken: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
    passwordResetToken: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    watchlist: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    userSession: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    fraudEvent: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    auditLog: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    auctionImage: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((fns: any[]) => {
      if (Array.isArray(fns)) {
        return Promise.all(fns)
      }
      return fns
    }),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  }

  return prisma as unknown as typeof prisma & PrismaService
}

export function createMockNotificationService(): NotificationService {
  return {
    create: jest.fn().mockResolvedValue({ id: 'notification-1' }),
    findAll: jest.fn().mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 }),
    getUnreadCount: jest.fn().mockResolvedValue({ count: 0 }),
    markAsRead: jest.fn().mockResolvedValue({ count: 1 }),
    markAllAsRead: jest.fn().mockResolvedValue({ count: 0 }),
    remove: jest.fn().mockResolvedValue({ count: 1 }),
  } as unknown as NotificationService
}

export function createMockGateway(): AuctionGateway {
  return {
    broadcastBid: jest.fn(),
    broadcastAuctionEnd: jest.fn(),
    sendNotification: jest.fn(),
    getOnlineCount: jest.fn().mockReturnValue(0),
    server: { to: jest.fn().mockReturnThis(), emit: jest.fn() },
    connectedUsers: new Map(),
    socketUsers: new Map(),
  } as unknown as AuctionGateway
}

export function createMockEmailService(): EmailService {
  return {
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
    sendEmail: jest.fn().mockResolvedValue(true),
  } as unknown as EmailService
}

export function createMockCacheService(): CacheService {
  return {
    get: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    reset: jest.fn().mockResolvedValue(undefined),
    invalidatePattern: jest.fn().mockResolvedValue(undefined),
    getOrSet: jest.fn().mockImplementation((_key: string, factory: () => Promise<any>) => factory()),
    invalidateAuction: jest.fn().mockResolvedValue(undefined),
    invalidateCategory: jest.fn().mockResolvedValue(undefined),
  } as unknown as CacheService
}

export function createMockJwtService() {
  return {
    signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
    verify: jest.fn().mockReturnValue({ sub: 'user-1', email: 'test@test.com', role: 'USER' }),
  }
}

export function createMockConfigService() {
  return {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, string> = {
        JWT_PRIVATE_KEY_PATH: './certs/jwt-private.pem',
        JWT_PUBLIC_KEY_PATH: './certs/jwt-public.pem',
        JWT_ACCESS_TOKEN_EXPIRY: '15m',
        JWT_REFRESH_TOKEN_EXPIRY: '30d',
        JWT_SECRET: 'test-secret',
        FRONTEND_URL: 'http://localhost:3000',
        CORS_ORIGIN: 'http://localhost:3000',
        PORT: '3001',
      }
      return config[key] ?? defaultValue
    }),
  }
}

export const mockUser = {
  id: 'user-1',
  email: 'test@test.com',
  passwordHash: '$2a$12$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ12',
  firstName: 'Test',
  lastName: 'User',
  phone: '+905551234567',
  role: 'USER' as const,
  isActive: true,
  isDeleted: false,
  avatarUrl: null,
  bio: null,
  emailVerified: false,
  failedAttempts: 0,
  lockedUntil: null,
  lastLoginAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockAuction = {
  id: 'auction-1',
  sellerId: 'user-1',
  categoryId: 'cat-1',
  title: 'Test Auction',
  description: 'Test description',
  startingPrice: 100,
  reservePrice: null,
  currentPrice: 150,
  bidIncrement: 10,
  status: 'ACTIVE' as const,
  isLive: true,
  isFeatured: false,
  bidCount: 3,
  watcherCount: 2,
  winnerId: null,
  winningBidId: null,
  startsAt: new Date('2024-01-01'),
  endsAt: new Date(Date.now() + 86400000),
  location: 'Istanbul',
  shipping: 'Kargo ile gönderim',
  startedAt: new Date('2024-01-01'),
  deletedAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockBid = {
  id: 'bid-1',
  auctionId: 'auction-1',
  userId: 'user-2',
  amount: 150,
  maxAmount: null,
  isAutoBid: false,
  status: 'WINNING' as const,
  createdAt: new Date(),
}

export const mockPayment = {
  id: 'payment-1',
  auctionId: 'auction-1',
  buyerId: 'user-2',
  sellerId: 'user-1',
  amount: 150,
  fee: 7.5,
  net: 142.5,
  status: 'COMPLETED' as const,
  method: 'CARD' as const,
  escrowStatus: 'HELD' as const,
  paidAt: new Date(),
  releasedAt: null,
  refundedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const mockCategory = {
  id: 'cat-1',
  name: 'Electronics',
  slug: 'electronics',
  description: 'Electronic devices',
  icon: 'Monitor',
  accentColor: '#3B82F6',
  sortOrder: 1,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}
