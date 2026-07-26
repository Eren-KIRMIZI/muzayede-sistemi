export interface CreateOrderDto {
  auctionId: string
  paymentId: string
  shippingAddress?: {
    street: string
    city: string
    state?: string
    country: string
    postalCode: string
  }
}

export interface OrderDto {
  id: string
  auctionId: string
  buyerId: string
  sellerId: string
  paymentId: string
  status: string
  trackingNumber?: string
  carrier?: string
  createdAt: Date
  updatedAt: Date
}
