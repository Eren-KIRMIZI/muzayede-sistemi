export interface PaymentCompletedEvent {
  eventName: 'payment.completed'
  paymentId: string
  auctionId: string
  buyerId: string
  sellerId: string
  amount: number
  fee: number
  net: number
  timestamp: Date
}

export interface EscrowReleasedEvent {
  eventName: 'escrow.released'
  paymentId: string
  auctionId: string
  sellerId: string
  amount: number
  timestamp: Date
}

export interface PaymentRefundedEvent {
  eventName: 'payment.refunded'
  paymentId: string
  auctionId: string
  buyerId: string
  amount: number
  timestamp: Date
}
