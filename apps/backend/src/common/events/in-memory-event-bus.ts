import { Injectable, Logger } from '@nestjs/common'

export interface DomainEvent {
  eventType: string
  [key: string]: any
}

type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => Promise<void> | void

/**
 * In-process event bus — synchronous fan-out to all registered handlers.
 * Replace with a message broker (Redis Streams / NATS) when splitting into microservices.
 */
@Injectable()
export class InMemoryEventBus {
  private readonly logger = new Logger(InMemoryEventBus.name)
  private readonly handlers = new Map<string, Set<EventHandler>>()

  /**
   * Register a handler for an event type.
   * Returns an unsubscribe function.
   */
  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set())
    }
    this.handlers.get(eventType)!.add(handler as EventHandler)
    this.logger.debug(`Subscribed handler to ${eventType}`)

    return () => {
      this.handlers.get(eventType)?.delete(handler as EventHandler)
    }
  }

  /**
   * Publish an event — calls all registered handlers concurrently.
   * Handler errors are caught and logged; they don't block other handlers.
   */
  async publish<T extends DomainEvent>(event: T): Promise<void> {
    const handlers = this.handlers.get(event.eventType)
    if (!handlers || handlers.size === 0) {
      this.logger.debug(`No handlers registered for: ${event.eventType}`)
      return
    }

    this.logger.debug(`Publishing ${event.eventType} to ${handlers.size} handler(s)`)

    await Promise.allSettled(
      [...handlers].map(async (handler) => {
        try {
          await handler(event)
        } catch (err: any) {
          this.logger.error(
            `Handler failed for ${event.eventType}: ${err.message}`,
            err.stack,
          )
        }
      }),
    )
  }

  /**
   * Publish multiple events in sequence.
   */
  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event)
    }
  }

  /**
   * Clear all handlers — useful for testing.
   */
  clear(): void {
    this.handlers.clear()
  }

  /**
   * Returns registered event types (for debugging/health).
   */
  getRegisteredEvents(): string[] {
    return [...this.handlers.keys()]
  }
}
