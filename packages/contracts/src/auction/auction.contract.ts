export interface CreateAuctionDto {
  title: string
  description: string
  categoryId: string
  startingPrice: number
  reservePrice?: number
  bidIncrement?: number
  startedAt?: Date
  endsAt: Date
  location?: string
  shipping?: string
  imageUrls?: string[]
}

export interface AuctionSummaryDto {
  id: string
  title: string
  status: string
  currentPrice: number | null
  startingPrice: number
  bidCount: number
  watcherCount: number
  endsAt: Date | null
  sellerId: string
  winnerId: string | null
}
