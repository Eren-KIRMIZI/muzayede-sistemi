import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { LoggerService } from '../services/logger.service'
import { randomBytes } from 'crypto'

@Injectable()
export class RequestLoggerInterceptor implements NestInterceptor {
  constructor(private logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const response = context.switchToHttp().getResponse()

    const requestId = request.headers['x-request-id'] || randomBytes(8).toString('hex')
    request.requestId = requestId
    response.setHeader('X-Request-Id', requestId)

    const { method, url } = request
    const start = Date.now()

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start
        const statusCode = response.statusCode
        const userId = request.user?.id || '-'

        this.logger.log(
          `[${requestId}] ${method} ${url} ${statusCode} ${duration}ms user=${userId}`,
        )
      }),
    )
  }
}
