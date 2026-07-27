import { Test, TestingModule } from '@nestjs/testing'
import { NotificationService } from './notification.service'
import { PrismaService } from '../../prisma/prisma.service'
import { createMockPrisma } from '../../../test/helpers'

describe('NotificationService', () => {
  let service: NotificationService
  let prisma: ReturnType<typeof createMockPrisma>

  const mockNotification = {
    id: 'notif-1',
    userId: 'user-1',
    type: 'SYSTEM',
    title: 'Test',
    message: 'Hello',
    data: {},
    isRead: false,
    createdAt: new Date(),
  }

  beforeEach(async () => {
    prisma = createMockPrisma()
    ;(prisma as any).userNotificationPreference = {
      findUnique: jest.fn().mockResolvedValue(null),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile()

    service = module.get<NotificationService>(NotificationService)
  })

  afterEach(() => jest.clearAllMocks())

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a notification', async () => {
      ;(prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification)

      const result = await service.create('user-1', 'SYSTEM', 'Test', 'Hello')

      expect(prisma.notification.create).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockNotification)
    })
  })

  // ── findAll ────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return paginated notifications for user', async () => {
      ;(prisma.notification.findMany as jest.Mock).mockResolvedValue([mockNotification])
      ;(prisma.notification.count as jest.Mock).mockResolvedValue(1)

      const result = await service.findAll('user-1', 1, 20)
      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
    })
  })

  // ── markAsRead ─────────────────────────────────────────────────────────────

  describe('markAsRead', () => {
    it('should mark specific notification as read', async () => {
      ;(prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 1 })

      const result = await service.markAsRead('notif-1', 'user-1')
      expect(prisma.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'notif-1', userId: 'user-1' },
          data: { isRead: true },
        }),
      )
      expect(result.count).toBe(1)
    })
  })

  // ── markAllAsRead ──────────────────────────────────────────────────────────

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for user', async () => {
      ;(prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 5 })

      const result = await service.markAllAsRead('user-1')
      expect(result.count).toBe(5)
    })
  })

  // ── getUnreadCount ─────────────────────────────────────────────────────────

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      ;(prisma.notification.count as jest.Mock).mockResolvedValue(3)

      const result = await service.getUnreadCount('user-1')
      expect(result.count).toBe(3)
    })
  })

  // ── remove ─────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('should delete a notification belonging to user', async () => {
      ;(prisma.notification.deleteMany as jest.Mock).mockResolvedValue({ count: 1 })

      const result = await service.remove('notif-1', 'user-1')
      expect(result.count).toBe(1)
    })
  })
})
