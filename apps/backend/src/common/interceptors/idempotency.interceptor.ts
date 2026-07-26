import { CallHandler, ExecutionContext, Injectable, NestInterceptor, ConflictException } from '@nestjs/common'
import { Observable, of, throwError } from 'rxjs'
import { tap, catchError } from 'rxjs/operators'
import { IdempotencyService } from '../concurrency/idempotency.service'
import { Request, Response } from 'express'

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly idempotencyService: IdempotencyService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const ctx = context.switchToHttp()
    const request = ctx.getRequest<Request>()
    const response = ctx.getResponse<Response>()
    
    const idempotencyKey = request.headers['idempotency-key'] as string
    if (!idempotencyKey) {
      return next.handle()
    }

    const userId = (request.user as any)?.sub || 'anonymous'

    const existing = await this.idempotencyService.getExisting(idempotencyKey)
    if (existing) {
      if (!existing.response) {
        throw new ConflictException('Request is already being processed')
      }
      response.status(existing.statusCode)
      return of(existing.response)
    }

    await this.idempotencyService.setPending(
      idempotencyKey,
      userId,
      { path: request.path, method: request.method, body: request.body }
    )

    return next.handle().pipe(
      tap((data) => {
        const statusCode = response.statusCode
        this.idempotencyService.complete(idempotencyKey, data, statusCode).catch(() => {})
      }),
      catchError((error) => {
        const statusCode = error.status || 500
        this.idempotencyService.complete(idempotencyKey, { error: error.message }, statusCode).catch(() => {})
        return throwError(() => error)
      })
    )
  }
}
