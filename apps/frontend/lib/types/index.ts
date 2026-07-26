export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  name?: string
  avatar?: string
  avatarUrl?: string
  role: 'USER' | 'ADMIN' | 'MODERATOR' | 'user' | 'admin' | 'moderator'
  bio?: string
  phone?: string
  verified?: boolean
  emailVerified?: boolean
  createdAt: string
}

export interface AuctionCategory {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  accentColor?: string
  sortOrder?: number
  isActive?: boolean
  _count?: { auctions: number }
}

export interface AuctionImage {
  id: string
  url: string
  sortOrder: number
  isPrimary: boolean
}

export interface AuctionSeller {
  id: string
  firstName: string
  lastName: string
  avatarUrl?: string
  bio?: string
}

export interface Auction {
  id: string
  title: string
  description: string
  startingPrice: number
  currentPrice: number
  reservePrice?: number
  bidIncrement: number
  endsAt: string
  startedAt?: string
  status: 'DRAFT' | 'PENDING' | 'ACTIVE' | 'EXTENDED' | 'ENDED' | 'SOLD' | 'CANCELLED'
  isLive: boolean
  isFeatured: boolean
  location?: string
  shipping?: string
  bidCount?: number
  winnerId?: string
  createdAt: string
  updatedAt: string
  category: AuctionCategory
  images: AuctionImage[]
  seller: AuctionSeller
  bids: number
  watchers: number
}

export interface AuctionDetail {
  id: string
  title: string
  description: string
  startingPrice: number
  currentPrice: number
  reservePrice?: number
  bidIncrement: number
  endsAt: string
  startedAt?: string
  status: 'DRAFT' | 'PENDING' | 'ACTIVE' | 'EXTENDED' | 'ENDED' | 'SOLD' | 'CANCELLED'
  isLive: boolean
  isFeatured: boolean
  location?: string
  shipping?: string
  bidCount?: number
  winnerId?: string
  createdAt: string
  updatedAt: string
  category: AuctionCategory
  images: AuctionImage[]
  seller: AuctionSeller
  bids: Bid[]
  watchers: number
  _count: { bids: number; watchers: number }
}

export interface Bid {
  id: string
  auctionId: string
  userId: string
  user: Pick<AuctionSeller, 'id' | 'firstName' | 'lastName' | 'avatarUrl'>
  amount: number
  maxAmount?: number
  isAutoBid: boolean
  status: 'PLACED' | 'OUTBID' | 'WINNING' | 'WON' | 'CANCELLED'
  createdAt: string
}

export interface BidSummary {
  totalBids: number
  uniqueBidders: number
  currentPrice: number
  startingPrice: number
  bidIncrement: number
  latestBid: Bid | null
}

export interface Payment {
  id: string
  auctionId: string
  buyerId: string
  sellerId: string
  amount: number
  fee: number
  net: number
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
  method: 'card' | 'bank_transfer' | 'wallet'
  escrowStatus: 'held' | 'released' | 'refunded'
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  type: 'BID_PLACED' | 'OUTBID' | 'AUCTION_WON' | 'AUCTION_ENDED' | 'PAYMENT' | 'SYSTEM' | 'PROMOTION'
  title: string
  message: string
  data?: Record<string, unknown>
  isRead: boolean
  createdAt: string
}

export interface DashboardStats {
  activeAuctions: number
  totalBids: number
  totalValue: string
  avgLatency: string
  biddersOnline: number
  auctionsEndingSoon: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export type SortOption = 'ending_soon' | 'newly_listed' | 'price_high' | 'price_low' | 'most_bids' | 'most_watched'

export interface AuctionFilters {
  category?: string
  categoryId?: string
  status?: string
  minPrice?: number
  maxPrice?: number
  sort?: SortOption
  search?: string
  page?: number
  limit?: number
  featured?: boolean
  live?: boolean
  endingSoon?: boolean
  sellerId?: string
}
