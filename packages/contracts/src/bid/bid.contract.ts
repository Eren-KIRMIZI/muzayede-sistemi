export interface CreateBidDto {
  auctionId: string
  amount: number
  maxAmount?: number
  isAutoBid?: boolean
  idempotencyKey?: string
}

export interface BidResponseDto {
  id: string
  auctionId: string
  userId: string
  amount: number
  maxAmount?: number
  isAutoBid: boolean
  status: string
  createdAt: Date
}
