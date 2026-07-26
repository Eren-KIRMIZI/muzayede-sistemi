export interface BidPlacedEvent {
  eventName: 'bid.placed'
  bidId: string
  auctionId: string
  userId: string
  amount: number
  isAutoBid: boolean
  timestamp: Date
}
