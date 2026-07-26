import { Injectable, NestMiddleware, Logger } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'

const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /data:text\/html/gi,
  /vbscript:/gi,
  /expression\(/gi,
  /eval\(/gi,
  /document\.(cookie|domain|write)/gi,
  /window\.(location|open)/gi,
  /<iframe\b/gi,
  /<object\b/gi,
  /<embed\b/gi,
  /<applet\b/gi,
]

@Injectable()
export class SanitizeMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SanitizeMiddleware.name)

  use(req: Request, _res: Response, next: NextFunction) {
    if (req.body && typeof req.body === 'object') {
      this.sanitizeObject(req.body)
    }

    if (req.query && typeof req.query === 'object') {
      this.sanitizeObject(req.query as Record<string, unknown>)
    }

    if (req.params && typeof req.params === 'object') {
      this.sanitizeObject(req.params as Record<string, unknown>)
    }

    next()
  }

  private sanitizeObject(obj: Record<string, unknown>): void {
    for (const key of Object.keys(obj)) {
      const value = obj[key]
      if (typeof value === 'string') {
        if (this.containsDangerousContent(value)) {
          this.logger.warn(`Potentially dangerous input detected in field: ${key}`)
          obj[key] = this.stripDangerousContent(value)
        }
      } else if (typeof value === 'object' && value !== null) {
        this.sanitizeObject(value as Record<string, unknown>)
      }
    }
  }

  private containsDangerousContent(value: string): boolean {
    return DANGEROUS_PATTERNS.some((pattern) => pattern.test(value))
  }

  private stripDangerousContent(value: string): string {
    let cleaned = value
    for (const pattern of DANGEROUS_PATTERNS) {
      cleaned = cleaned.replace(pattern, '')
    }
    return cleaned
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
  }
}
