/**
 * Lightweight in-process circuit breaker.
 * 
 * States:
 *  CLOSED → normal operation (failures counted)
 *  OPEN   → fast-fail (no calls made)
 *  HALF_OPEN → one probe call allowed; success → CLOSED, failure → OPEN
 * 
 * Usage:
 *   const cb = new CircuitBreaker({ name: 'stripe', failureThreshold: 5, timeout: 30000 })
 *   const result = await cb.execute(() => stripeClient.charge(...))
 */

export interface CircuitBreakerOptions {
  name: string
  /** Number of consecutive failures before opening the circuit */
  failureThreshold?: number
  /** Time in ms to wait before transitioning from OPEN to HALF_OPEN */
  timeout?: number
  /** Number of successes in HALF_OPEN before closing */
  successThreshold?: number
  /** Optional callback when state changes */
  onStateChange?: (name: string, from: CircuitState, to: CircuitState) => void
}

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

export class CircuitBreakerOpenError extends Error {
  constructor(name: string) {
    super(`Circuit '${name}' is OPEN — fast failing`)
    this.name = 'CircuitBreakerOpenError'
  }
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED'
  private failures = 0
  private successes = 0
  private nextAttemptAt = 0
  private readonly name: string
  private readonly failureThreshold: number
  private readonly timeout: number
  private readonly successThreshold: number
  private readonly onStateChange?: CircuitBreakerOptions['onStateChange']

  constructor(opts: CircuitBreakerOptions) {
    this.name = opts.name
    this.failureThreshold = opts.failureThreshold ?? 5
    this.timeout = opts.timeout ?? 30_000
    this.successThreshold = opts.successThreshold ?? 2
    this.onStateChange = opts.onStateChange
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttemptAt) {
        throw new CircuitBreakerOpenError(this.name)
      }
      this.transition('HALF_OPEN')
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (err) {
      this.onFailure()
      throw err
    }
  }

  private onSuccess() {
    this.failures = 0
    if (this.state === 'HALF_OPEN') {
      this.successes++
      if (this.successes >= this.successThreshold) {
        this.successes = 0
        this.transition('CLOSED')
      }
    }
  }

  private onFailure() {
    this.failures++
    this.successes = 0
    if (this.state === 'HALF_OPEN' || this.failures >= this.failureThreshold) {
      this.nextAttemptAt = Date.now() + this.timeout
      this.transition('OPEN')
    }
  }

  private transition(to: CircuitState) {
    const from = this.state
    if (from === to) return
    this.state = to
    this.onStateChange?.(this.name, from, to)
  }

  getState(): CircuitState { return this.state }

  getStats() {
    return {
      name: this.name,
      state: this.state,
      failures: this.failures,
      nextAttemptAt: this.state === 'OPEN' ? new Date(this.nextAttemptAt).toISOString() : null,
    }
  }

  reset() {
    this.state = 'CLOSED'
    this.failures = 0
    this.successes = 0
    this.nextAttemptAt = 0
  }
}
