import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { AuditAction } from '@prisma/client'

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name)

  constructor(private prisma: PrismaService) {}

  async log(params: {
    userId?: string
    action: AuditAction
    resource: string
    resourceId?: string
    oldData?: any
    newData?: any
    ipAddress?: string
    userAgent?: string
    requestId?: string
  }): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          resource: params.resource,
          resourceId: params.resourceId,
          oldData: params.oldData,
          newData: params.newData,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          requestId: params.requestId,
        },
      })
    } catch (err: any) {
      this.logger.error(`Failed to write audit log: ${err.message}`)
    }
  }

  async findAll(params: {
    userId?: string
    resource?: string
    action?: AuditAction
    page?: number
    limit?: number
  }) {
    const { userId, resource, action, page = 1, limit = 50 } = params

    const where: any = {}
    if (userId) where.userId = userId
    if (resource) where.resource = resource
    if (action) where.action = action

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ])

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }
}
