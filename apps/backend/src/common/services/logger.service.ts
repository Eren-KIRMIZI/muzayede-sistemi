import { ConsoleLogger, Injectable, Scope } from '@nestjs/common'

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends ConsoleLogger {
  private sanitizeMessage(message: any): any {
    if (typeof message !== 'string') return message
    return message
      .replace(/password[=:]\s*\S+/gi, 'password=***')
      .replace(/token[=:]\s*\S+/gi, 'token=***')
      .replace(/secret[=:]\s*\S+/gi, 'secret=***')
      .replace(/authorization:\s*Bearer\s*\S+/gi, 'authorization: Bearer ***')
      .replace(/cookie[=:]\s*\S+/gi, 'cookie=***')
  }

  log(message: any, ...optionalParams: unknown[]) {
    super.log(this.sanitizeMessage(message), ...optionalParams)
  }

  error(message: any, ...optionalParams: unknown[]) {
    super.error(this.sanitizeMessage(message), ...optionalParams)
  }

  warn(message: any, ...optionalParams: unknown[]) {
    super.warn(this.sanitizeMessage(message), ...optionalParams)
  }

  debug(message: any, ...optionalParams: unknown[]) {
    super.debug(this.sanitizeMessage(message), ...optionalParams)
  }

  logRequest(method: string, url: string, statusCode: number, duration: number, requestId?: string, userId?: string) {
    const parts = [requestId ? `[${requestId}]` : '', method, url, statusCode, `${duration}ms`]
    if (userId) parts.push(`user=${userId}`)
    this.log(parts.join(' '))
  }

  logError(error: Error, context?: string) {
    this.error(`${context ? `[${context}] ` : ''}${error.message}`, error.stack)
  }

  logStartup(port: number, env: string) {
    this.log(`Server running on http://localhost:${port} [${env}]`)
  }
}
