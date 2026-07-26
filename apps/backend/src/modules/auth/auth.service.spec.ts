import { Test, TestingModule } from '@nestjs/testing'
import { ConflictException, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { AuthService } from './auth.service'
import { PrismaService } from '../../prisma/prisma.service'
import { EmailService } from '../../common/services/email.service'
import {
  createMockPrisma,
  createMockEmailService,
  createMockJwtService,
  createMockConfigService,
  mockUser,
} from '../../../test/helpers'
import * as bcrypt from 'bcryptjs'

describe('AuthService', () => {
  let service: AuthService
  let prisma: ReturnType<typeof createMockPrisma>
  let emailService: ReturnType<typeof createMockEmailService>
  let jwtService: ReturnType<typeof createMockJwtService>
  let configService: ReturnType<typeof createMockConfigService>

  beforeEach(async () => {
    prisma = createMockPrisma()
    emailService = createMockEmailService()
    jwtService = createMockJwtService()
    configService = createMockConfigService()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: EmailService, useValue: emailService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  describe('register', () => {
    it('should register a new user successfully', async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      prisma.user.create.mockResolvedValue(mockUser)
      prisma.refreshToken.count.mockResolvedValue(0)
      prisma.refreshToken.create.mockResolvedValue({} as any)

      const result = await service.register({
        email: 'new@test.com',
        password: 'Password123!',
        firstName: 'New',
        lastName: 'User',
      })

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'new@test.com' },
      })
      expect(prisma.user.create).toHaveBeenCalled()
      expect(emailService.sendWelcomeEmail).toHaveBeenCalled()
    })

    it('should throw ConflictException for existing email', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as any)

      await expect(
        service.register({
          email: 'test@test.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
        }),
      ).rejects.toThrow(ConflictException)
    })
  })

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 12)
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, passwordHash: hashedPassword } as any)
      prisma.user.update.mockResolvedValue({} as any)
      prisma.refreshToken.count.mockResolvedValue(0)
      prisma.refreshToken.create.mockResolvedValue({} as any)

      const result = await service.login({
        email: 'test@test.com',
        password: 'Password123!',
      })

      expect(prisma.user.findUnique).toHaveBeenCalled()
      expect(result).toHaveProperty('accessToken')
    })

    it('should throw UnauthorizedException for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(
        service.login({ email: 'wrong@test.com', password: 'Password123!' }),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException for deleted user', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, isDeleted: true } as any)

      await expect(
        service.login({ email: 'test@test.com', password: 'Password123!' }),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException for inactive user', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false } as any)

      await expect(
        service.login({ email: 'test@test.com', password: 'Password123!' }),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException for wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as any)
      prisma.user.update.mockResolvedValue({} as any)

      await expect(
        service.login({ email: 'test@test.com', password: 'WrongPassword!' }),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('should lock account after 5 failed attempts', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword!', 12)
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash: hashedPassword,
        failedAttempts: 4,
      } as any)
      prisma.user.update.mockResolvedValue({} as any)

      await expect(
        service.login({ email: 'test@test.com', password: 'WrongPassword!' }),
      ).rejects.toThrow(UnauthorizedException)

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            failedAttempts: 5,
            lockedUntil: expect.any(Date),
          }),
        }),
      )
    })

    it('should reject login when account is locked', async () => {
      const futureDate = new Date(Date.now() + 300000)
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        lockedUntil: futureDate,
      } as any)

      await expect(
        service.login({ email: 'test@test.com', password: 'Password123!' }),
      ).rejects.toThrow(UnauthorizedException)
    })
  })

  describe('forgotPassword', () => {
    it('should always return success (prevent email enumeration)', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      const result = await service.forgotPassword('nonexistent@test.com')
      expect(result.message).toContain('reset link has been sent')
    })

    it('should create reset token and send email for existing user', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser as any)
      prisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 })
      prisma.passwordResetToken.create.mockResolvedValue({} as any)

      const result = await service.forgotPassword('test@test.com')
      expect(result.message).toContain('reset link has been sent')
      expect(prisma.passwordResetToken.create).toHaveBeenCalled()
    })
  })

  describe('resetPassword', () => {
    it('should throw BadRequestException for mismatched passwords', async () => {
      await expect(
        service.resetPassword('token', 'Password1!', 'Password2!'),
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw BadRequestException for invalid token', async () => {
      prisma.passwordResetToken.findMany.mockResolvedValue([])

      await expect(
        service.resetPassword('invalid-token', 'Password1!', 'Password1!'),
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('me', () => {
    it('should return user profile', async () => {
      const { passwordHash, ...userWithoutPassword } = mockUser
      prisma.user.findUnique.mockResolvedValue(userWithoutPassword as any)

      const result = await service.me('user-1')
      expect(result).toHaveProperty('email')
      expect(result).not.toHaveProperty('passwordHash')
    })

    it('should throw NotFoundException for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(service.me('nonexistent')).rejects.toThrow(NotFoundException)
    })
  })
})
