import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable, tap } from 'rxjs'
import { AuditLogService } from './audit.service'
import { AuditAction } from '@prisma/client'

const RESOURCE_MAP: Record<string, { resource: string; action?: AuditAction }> = {
  '/auth/register': { resource: 'user', action: AuditAction.CREATE },
  '/auth/login': { resource: 'user', action: AuditAction.LOGIN },
  '/auth/logout': { resource: 'user', action: AuditAction.LOGOUT },
  '/auctions': { resource: 'auction' },
  '/bids': { resource: 'bid', action: AuditAction.BID },
  '/payments': { resource: 'payment' },
  '/categories': { resource: 'category' },
  '/notifications': { resource: 'notification' },
  '/users': { resource: 'user' },
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const { method, url, user, body, headers } = request

    const match = Object.entries(RESOURCE_MAP).find(([path]) => url.startsWith(path))
    if (!match) return next.handle()

    const [_, config] = match
    const action = config.action || this.methodToAction(method)

    return next.handle().pipe(
      tap(async () => {
        const requestId = request.requestId
        await this.auditService.log({
          userId: user?.id,
          action,
          resource: config.resource,
          newData: ['POST', 'PUT', 'PATCH'].includes(method) ? this.sanitize(body) : undefined,
          ipAddress: headers['x-forwarded-for'] || request.ip,
          userAgent: headers['user-agent'],
          requestId,
        })
      }),
    )
  }

  private methodToAction(method: string): AuditAction {
    switch (method) {
      case 'GET': return AuditAction.READ
      case 'POST': return AuditAction.CREATE
      case 'PUT':
      case 'PATCH': return AuditAction.UPDATE
      case 'DELETE': return AuditAction.DELETE
      default: return AuditAction.READ
    }
  }

  private sanitize(body: any): any {
    if (!body || typeof body !== 'object') return body
    const sanitized = { ...body }
    const sensitiveFields = ['password', 'passwordHash', 'token', 'secret', 'creditCard', 'cvv']
    for (const field of sensitiveFields) {
      if (sanitized[field]) sanitized[field] = '***'
    }
    return sanitized
  }
}
