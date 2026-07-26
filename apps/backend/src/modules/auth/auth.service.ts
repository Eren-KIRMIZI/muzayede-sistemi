import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcryptjs'
import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import { PrismaService } from '../../prisma/prisma.service'
import { EmailService } from '../../common/services/email.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'

const MAX_SESSIONS = 5
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATIONS = [5, 15, 60, 240, 1440] // minutes

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)
  private privateKey: string | null = null

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private emailService: EmailService,
  ) {
    this.loadPrivateKey()
  }

  private loadPrivateKey() {
    const keyPath = this.config.get('JWT_PRIVATE_KEY_PATH', './certs/jwt-private.pem')
    try {
      this.privateKey = fs.readFileSync(path.resolve(keyPath), 'utf-8')
    } catch {
      this.logger.warn('JWT private key not found, using fallback secret')
    }
  }

  private get jwtSecret(): string {
    return this.privateKey || this.config.get('JWT_SECRET', 'dev-secret-key') || 'dev-secret-key'
  }

  private get accessExpiry() {
    return this.config.get('JWT_ACCESS_TOKEN_EXPIRY', '15m')
  }

  private get refreshExpiry() {
    return this.config.get('JWT_REFRESH_TOKEN_EXPIRY', '30d')
  }

  private getRefreshExpiryMs(): number {
    const val = this.refreshExpiry
    if (val.endsWith('d')) return parseInt(val) * 24 * 60 * 60 * 1000
    if (val.endsWith('h')) return parseInt(val) * 60 * 60 * 1000
    return 30 * 24 * 60 * 60 * 1000
  }

  async register(dto: RegisterDto, ip?: string, userAgent?: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    })

    if (existing) {
      throw new ConflictException('Email already registered')
    }

    const passwordHash = await bcrypt.hash(dto.password, 12)

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
      },
    })

    this.logger.log(`User registered: ${user.email} (${user.id})`)

    // Send welcome email (non-blocking)
    this.emailService.sendWelcomeEmail(user.email, user.firstName).catch((err) => {
      this.logger.error(`Failed to send welcome email: ${err.message}`)
    })

    return this.generateTokens(user, ip, userAgent)
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    })

    if (!user || user.isDeleted) {
      throw new UnauthorizedException('Invalid email or password')
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated')
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
      throw new UnauthorizedException(`Account locked. Try again in ${minutesLeft} minutes`)
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash)

    if (!isPasswordValid) {
      await this.handleFailedLogin(user)
      throw new UnauthorizedException('Invalid email or password')
    }

    // Reset failed attempts on successful login
    if (user.failedAttempts > 0) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedAttempts: 0, lockedUntil: null },
      })
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    this.logger.log(`User logged in: ${user.email} (${user.id})`)

    return this.generateTokens(user, ip, userAgent)
  }

  async refresh(refreshToken: string) {
    let payload: any
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.jwtSecret,
        algorithms: ['RS256'],
        issuer: 'auction-platform',
        audience: 'auction-api',
      })
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token')
    }

    const tokenHash = await bcrypt.hash(refreshToken, 10)

    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        userId: payload.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    })

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token not found or revoked')
    }

    const isMatch = await bcrypt.compare(refreshToken, storedToken.tokenHash)
    if (!isMatch) {
      // Possible token theft - revoke all tokens
      await this.prisma.refreshToken.updateMany({
        where: { userId: payload.sub },
        data: { revokedAt: new Date() },
      })
      this.logger.warn(`Possible token theft for user ${payload.sub} - all sessions revoked`)
      throw new UnauthorizedException('Token mismatch - all sessions revoked')
    }

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    })

    return this.generateTokens(storedToken.user)
  }

  async logout(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.jwtSecret,
        algorithms: ['RS256'],
      })

      await this.prisma.refreshToken.updateMany({
        where: {
          userId: payload.sub,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      })
    } catch {
      // Even if token is invalid, we consider logout successful
    }

    return { message: 'Logged out successfully' }
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If an account exists, a reset link has been sent' }
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = await bcrypt.hash(resetToken, 10)

    // Delete old reset tokens
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    })

    // Create new reset token (15 minutes expiry)
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    })

    this.logger.log(`Password reset requested for ${email}. Token: ${resetToken}`)

    // Send reset email
    const baseUrl = this.config.get('FRONTEND_URL', 'http://localhost:3000')
    await this.emailService.sendPasswordResetEmail(user.email, resetToken, baseUrl)

    return { message: 'If an account exists, a reset link has been sent' }
  }

  async resetPassword(token: string, password: string, confirmPassword: string) {
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match')
    }

    const resetTokens = await this.prisma.passwordResetToken.findMany({
      where: {
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    })

    let validToken: any = null
    for (const rt of resetTokens) {
      const isMatch = await bcrypt.compare(token, rt.tokenHash)
      if (isMatch) {
        validToken = rt
        break
      }
    }

    if (!validToken) {
      throw new BadRequestException('Invalid or expired reset token')
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: validToken.userId },
        data: { passwordHash, failedAttempts: 0, lockedUntil: null },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: validToken.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: validToken.userId },
        data: { revokedAt: new Date() },
      }),
    ])

    this.logger.log(`Password reset completed for user ${validToken.userId}`)

    return { message: 'Password reset successful' }
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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
      },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    return user
  }

  private async generateTokens(user: any, ip?: string, userAgent?: string) {
    const sessionId = crypto.randomUUID()

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId,
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { ...payload, tokenType: 'access' },
        {
          expiresIn: this.accessExpiry,
          jwtid: crypto.randomUUID(),
        },
      ),
      this.jwtService.signAsync(
        { ...payload, tokenType: 'refresh' },
        {
          expiresIn: this.refreshExpiry,
          jwtid: crypto.randomUUID(),
        },
      ),
    ])

    // Store refresh token hash
    const refreshHash = await bcrypt.hash(refreshToken, 10)
    const expiresAt = new Date(Date.now() + this.getRefreshExpiryMs())

    // Enforce max sessions
    const sessionCount = await this.prisma.refreshToken.count({
      where: { userId: user.id, revokedAt: null },
    })

    if (sessionCount >= MAX_SESSIONS) {
      const oldestTokens = await this.prisma.refreshToken.findMany({
        where: { userId: user.id, revokedAt: null },
        orderBy: { createdAt: 'asc' },
        take: sessionCount - MAX_SESSIONS + 1,
      })

      await this.prisma.refreshToken.updateMany({
        where: { id: { in: oldestTokens.map((t) => t.id) } },
        data: { revokedAt: new Date() },
      })
    }

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshHash,
        expiresAt,
        device: userAgent?.substring(0, 150),
        ipAddress: ip?.substring(0, 45),
        userAgent: userAgent?.substring(0, 500),
      },
    })

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessExpiry,
      tokenType: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    }
  }

  private async handleFailedLogin(user: any) {
    const newAttempts = user.failedAttempts + 1

    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      const lockIndex = Math.min(
        Math.floor((newAttempts - MAX_FAILED_ATTEMPTS) / MAX_FAILED_ATTEMPTS),
        LOCKOUT_DURATIONS.length - 1,
      )
      const lockMinutes = LOCKOUT_DURATIONS[lockIndex]

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedAttempts: newAttempts,
          lockedUntil: new Date(Date.now() + lockMinutes * 60 * 1000),
        },
      })

      this.logger.warn(`Account locked: ${user.email} for ${lockMinutes} minutes`)
    } else {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedAttempts: newAttempts },
      })
    }
  }

  async googleLogin(googleUser: {
    googleId: string
    email: string
    firstName: string
    lastName: string
    avatarUrl?: string
  }, ip?: string, userAgent?: string) {
    let user = await this.prisma.user.findUnique({ where: { email: googleUser.email.toLowerCase() } })

    if (!user) {
      // Auto-register via Google
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email.toLowerCase(),
          passwordHash: '',       // No password for social login
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
          avatarUrl: googleUser.avatarUrl ?? null,
          emailVerified: true,   // Google already verified the email
          isActive: true,
        },
      })
      this.logger.log(`Google OAuth: new user registered ${user.email}`)
    } else if (!user.isActive || user.isDeleted) {
      throw new UnauthorizedException('Account is deactivated')
    }

    return this.generateTokens(user, ip, userAgent)
  }
}
