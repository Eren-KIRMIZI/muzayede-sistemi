import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  Logger,
} from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import * as crypto from 'crypto'

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CsrfMiddleware.name)
  private readonly csrfSecret = process.env.CSRF_SECRET || 'csrf-fallback-secret-change-in-production'
  private readonly tokenExpiry = 3600000 // 1 hour

  use(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF for GET, HEAD, OPTIONS (safe methods)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next()
    }

    // Skip for WebSocket upgrades
    if (req.headers.upgrade?.toLowerCase() === 'websocket') {
      return next()
    }

    const token = req.headers['x-csrf-token'] as string
    const sessionToken = req.cookies?.['csrf-token']

    if (!token || !sessionToken) {
      throw new UnauthorizedException('CSRF token missing')
    }

    if (!this.timingSafeEqual(token, sessionToken)) {
      throw new UnauthorizedException('CSRF token mismatch')
    }

    next()
  }

  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false
    const bufA = Buffer.from(a)
    const bufB = Buffer.from(b)
    return crypto.timingSafeEqual(bufA, bufB)
  }

  generateToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }
}
