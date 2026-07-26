// Auction events
export * from './auction/bid-placed.event'
export * from './auction/auction-lifecycle.event'

// Payment events
export * from './payment/payment.event'

// User events
export * from './user/user.event'

// Notification events
export * from './notification/notification.event'

// Order events
export * from './order/order.event'

// Event bus interface — implement with Kafka / RabbitMQ / in-process EventEmitter
export interface IEventBus {
  publish<T extends { eventName: string }>(event: T): Promise<void>
  subscribe<T extends { eventName: string }>(
    eventName: string,
    handler: (event: T) => Promise<void>,
  ): void
}

export const EVENT_BUS = Symbol('EVENT_BUS')
