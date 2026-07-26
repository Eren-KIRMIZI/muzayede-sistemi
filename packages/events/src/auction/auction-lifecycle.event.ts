export interface AuctionStartedEvent {
  eventName: 'auction.started'
  auctionId: string
  sellerId: string
  title: string
  startingPrice: number
  endsAt: Date
  timestamp: Date
}

export interface AuctionEndedEvent {
  eventName: 'auction.ended'
  auctionId: string
  sellerId: string
  title: string
  winnerId: string | null
  winningBidId: string | null
  finalPrice: number | null
  timestamp: Date
}

export interface AuctionCancelledEvent {
  eventName: 'auction.cancelled'
  auctionId: string
  sellerId: string
  reason?: string
  timestamp: Date
}
