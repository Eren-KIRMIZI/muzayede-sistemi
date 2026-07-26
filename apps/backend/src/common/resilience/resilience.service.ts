import { Injectable, Logger } from '@nestjs/common'
import { CircuitBreaker } from './circuit-breaker'

/**
 * ResilienceService — manages named circuit breakers for external service calls.
 * Inject this service anywhere you call Stripe, email provider, or external APIs.
 *
 * Usage example:
 *   constructor(private resilience: ResilienceService) {}
 *   await this.resilience.execute('stripe', () => this.stripe.charges.create(...))
 */
@Injectable()
export class ResilienceService {
  private readonly logger = new Logger(ResilienceService.name)
  private readonly breakers = new Map<string, CircuitBreaker>()

  /**
   * Get or create a circuit breaker by name.
   */
  getBreaker(name: string, opts?: Partial<ConstructorParameters<typeof CircuitBreaker>[0]>): CircuitBreaker {
    if (!this.breakers.has(name)) {
      const breaker = new CircuitBreaker({
        name,
        failureThreshold: 5,
        timeout: 30_000,
        successThreshold: 2,
        onStateChange: (n, from, to) => {
          this.logger.warn(`Circuit '${n}': ${from} → ${to}`)
        },
        ...opts,
      })
      this.breakers.set(name, breaker)
    }
    return this.breakers.get(name)!
  }

  /**
   * Execute fn via the named circuit breaker.
   */
  async execute<T>(name: string, fn: () => Promise<T>): Promise<T> {
    return this.getBreaker(name).execute(fn)
  }

  /**
   * Returns stats for all registered circuit breakers.
   */
  getAllStats() {
    return [...this.breakers.values()].map((b) => b.getStats())
  }

  /**
   * Reset a specific circuit breaker (useful after manual investigation).
   */
  resetBreaker(name: string) {
    this.breakers.get(name)?.reset()
    this.logger.log(`Circuit '${name}' manually reset`)
  }
}
