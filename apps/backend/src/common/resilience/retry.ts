import { Logger } from '@nestjs/common'

export interface RetryOptions {
  maxRetries?: number
  delay?: number
  backoff?: number
  retryOn?: (error: any) => boolean
}

export function Retry(options: RetryOptions = {}) {
  const { maxRetries = 3, delay = 1000, backoff = 2, retryOn } = options

  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const logger = new Logger(`${target.constructor?.name || 'Unknown'}`)

    descriptor.value = async function (...args: any[]) {
      let lastError: any
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          return await originalMethod.apply(this, args)
        } catch (error) {
          lastError = error

          if (attempt === maxRetries) break
          if (retryOn && !retryOn(error)) break

          const waitTime = delay * Math.pow(backoff, attempt)
          logger.warn(
            `Retry ${attempt + 1}/${maxRetries} for ${propertyKey} after ${waitTime}ms: ${(error as any)?.message || error}`,
          )
          await new Promise((resolve) => setTimeout(resolve, waitTime))
        }
      }
      throw lastError
    }

    return descriptor
  }
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { maxRetries = 3, delay = 1000, backoff = 2, retryOn } = options
  const logger = new Logger('RetryUtil')

  let lastError: any
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt === maxRetries) break
      if (retryOn && !retryOn(error)) break

      const waitTime = delay * Math.pow(backoff, attempt)
      logger.warn(`Retry ${attempt + 1}/${maxRetries} after ${waitTime}ms: ${(error as any)?.message || error}`)
      await new Promise((resolve) => setTimeout(resolve, waitTime))
    }
  }
  throw lastError
}
