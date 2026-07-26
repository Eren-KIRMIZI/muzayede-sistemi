export interface CreatePaymentDto {
  auctionId: string
  method?: 'CARD' | 'BANK_TRANSFER' | 'WALLET'
  idempotencyKey?: string
}

export interface PaymentCompletedDto {
  paymentId: string
  auctionId: string
  buyerId: string
  sellerId: string
  amount: number
  fee: number
  net: number
  escrowStatus: string
  paidAt: Date
}

export interface ReleaseEscrowDto {
  paymentId: string
  adminId: string
  reason?: string
}
