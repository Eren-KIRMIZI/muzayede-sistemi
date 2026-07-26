export interface OrderCreatedEvent {
  eventName: 'order.created'
  orderId: string
  auctionId: string
  buyerId: string
  sellerId: string
  paymentId: string
  timestamp: Date
}

export interface OrderShippedEvent {
  eventName: 'order.shipped'
  orderId: string
  buyerId: string
  trackingNumber: string
  carrier: string
  timestamp: Date
}

export interface OrderDeliveredEvent {
  eventName: 'order.delivered'
  orderId: string
  buyerId: string
  sellerId: string
  timestamp: Date
}
