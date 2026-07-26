import { Logger } from '@nestjs/common'

export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Operation timed out after ${ms}ms`)
    this.name = 'TimeoutError'
  }
}

export async function withTimeout<T>(fn: () => Promise<T>, ms: number, label = 'operation'): Promise<T> {
  const logger = new Logger('Timeout')

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      logger.warn(`${label} timed out after ${ms}ms`)
      reject(new TimeoutError(ms))
    }, ms)

    fn()
      .then((result) => {
        clearTimeout(timer)
        resolve(result)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}
