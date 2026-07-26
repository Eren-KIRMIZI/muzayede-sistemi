import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { randomBytes } from 'crypto'

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name)

  constructor(private prisma: PrismaService) {}

  generateKey(): string {
    return `idem_${Date.now()}_${randomBytes(8).toString('hex')}`
  }

  async getExisting(key: string): Promise<{ response: any; statusCode: number } | null> {
    const record = await this.prisma.idempotencyKey.findUnique({
      where: { key },
    })

    if (!record) return null

    if (record.expiresAt < new Date()) {
      await this.prisma.idempotencyKey.delete({ where: { key } })
      return null
    }

    if (record.response) {
      return { response: record.response, statusCode: record.statusCode || 200 }
    }

    return null
  }

  async setPending(key: string, userId: string, request: any, ttlMs = 300000): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlMs)
    await this.prisma.idempotencyKey.create({
      data: {
        key,
        userId,
        request,
        expiresAt,
      },
    })
  }

  async complete(key: string, response: any, statusCode: number): Promise<void> {
    try {
      await this.prisma.idempotencyKey.update({
        where: { key },
        data: { response, statusCode },
      })
    } catch (err: any) {
      this.logger.warn(`Failed to complete idempotency key ${key}: ${err.message}`)
    }
  }

  async cleanup(): Promise<void> {
    const result = await this.prisma.idempotencyKey.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    })
    if (result.count > 0) {
      this.logger.log(`Cleaned up ${result.count} expired idempotency keys`)
    }
  }
}
