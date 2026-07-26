import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../prisma/prisma.service'
import { NotificationService } from '../notification/notification.service'
import Stripe from 'stripe'

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name)
  private stripe: Stripe

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private config: ConfigService,
  ) {
    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY', '')
    if (secretKey) {
      this.stripe = new Stripe(secretKey)
    }
  }

  /**
   * Verify the Stripe webhook signature and return the parsed event.
   * Throws BadRequestException if the signature is invalid.
   */
  constructEvent(rawBody: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET', '')
    try {
      return this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
    } catch (err: any) {
      this.logger.warn(`Stripe webhook signature verification failed: ${err.message}`)
      throw new BadRequestException('Invalid Stripe webhook signature')
    }
  }

  /**
   * Route incoming Stripe events to the appropriate handler.
   */
  async handleEvent(event: Stripe.Event): Promise<void> {
    this.logger.log(`Stripe event: ${event.type} [${event.id}]`)

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.canceled':
        await this.handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent)
        break

      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object as Stripe.Charge)
        break

      case 'charge.dispute.created':
        await this.handleDisputeCreated(event.data.object as Stripe.Dispute)
        break

      default:
        this.logger.debug(`Unhandled Stripe event type: ${event.type}`)
    }
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  private async handlePaymentIntentSucceeded(intent: Stripe.PaymentIntent) {
    const auctionId = intent.metadata?.auctionId
    const buyerId = intent.metadata?.buyerId

    if (!auctionId || !buyerId) {
      this.logger.warn(`payment_intent.succeeded missing metadata: ${intent.id}`)
      return
    }

    // Update payment status to COMPLETED
    const updated = await this.prisma.payment.updateMany({
      where: { stripePaymentIntentId: intent.id },
      data: {
        status: 'COMPLETED',
        escrowStatus: 'HELD',
        paidAt: new Date(),
      },
    })

    if (updated.count === 0) {
      // Payment not pre-created — create it now
      const auction = await this.prisma.auction.findUnique({ where: { id: auctionId } })
      if (auction) {
        const amount = intent.amount / 100 // Stripe amounts are in cents
        const fee = Math.round(amount * 0.05 * 100) / 100
        await this.prisma.payment.create({
          data: {
            auctionId,
            buyerId,
            sellerId: auction.sellerId,
            amount,
            fee,
            net: amount - fee,
            status: 'COMPLETED',
            method: 'CARD',
            escrowStatus: 'HELD',
            paidAt: new Date(),
            stripePaymentIntentId: intent.id,
          },
        })

        // Update auction to SOLD
        await this.prisma.auction.update({
          where: { id: auctionId },
          data: { status: 'SOLD', isLive: false },
        })
      }
    }

    // Notify buyer
    await this.notificationService
      .create(buyerId, 'PAYMENT', '✅ Payment Successful', `Your payment has been confirmed.`, {
        auctionId,
        stripePaymentIntentId: intent.id,
      })
      .catch((e) => this.logger.error(`Notification failed: ${e.message}`))

    this.logger.log(`Payment succeeded for auction ${auctionId} by buyer ${buyerId}`)
  }

  private async handlePaymentIntentFailed(intent: Stripe.PaymentIntent) {
    const auctionId = intent.metadata?.auctionId
    const buyerId = intent.metadata?.buyerId

    await this.prisma.payment
      .updateMany({
        where: { stripePaymentIntentId: intent.id },
        data: { status: 'FAILED' },
      })
      .catch(() => {})

    if (buyerId) {
      const failureMessage =
        intent.last_payment_error?.message ?? 'Payment was declined. Please try again.'
      await this.notificationService
        .create(buyerId, 'PAYMENT', '❌ Payment Failed', failureMessage, { auctionId })
        .catch((e) => this.logger.error(`Notification failed: ${e.message}`))
    }

    this.logger.warn(`Payment failed for intent ${intent.id}: ${intent.last_payment_error?.message}`)
  }

  private async handlePaymentIntentCanceled(intent: Stripe.PaymentIntent) {
    await this.prisma.payment
      .updateMany({
        where: { stripePaymentIntentId: intent.id },
        data: { status: 'FAILED' },
      })
      .catch(() => {})

    this.logger.log(`Payment intent canceled: ${intent.id}`)
  }

  private async handleChargeRefunded(charge: Stripe.Charge) {
    const intentId = typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent?.id

    if (!intentId) return

    const payment = await this.prisma.payment.findFirst({
      where: { stripePaymentIntentId: intentId },
    })

    if (payment) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'REFUNDED',
          escrowStatus: 'REFUNDED',
          refundedAt: new Date(),
        },
      })

      // Notify both parties
      await Promise.all([
        this.notificationService
          .create(payment.buyerId, 'PAYMENT', '💰 Refund Processed', `Your refund has been processed.`, { paymentId: payment.id })
          .catch(() => {}),
        this.notificationService
          .create(payment.sellerId, 'PAYMENT', '↩️ Payment Refunded', `Payment for your auction has been refunded.`, { paymentId: payment.id })
          .catch(() => {}),
      ])

      this.logger.log(`Refund processed for payment ${payment.id}`)
    }
  }

  private async handleDisputeCreated(dispute: Stripe.Dispute) {
    const intentId = typeof dispute.payment_intent === 'string'
      ? dispute.payment_intent
      : dispute.payment_intent?.id

    if (!intentId) return

    const payment = await this.prisma.payment.findFirst({
      where: { stripePaymentIntentId: intentId },
    })

    if (payment) {
      // Create a fraud event for admin review
      await this.prisma.fraudEvent.create({
        data: {
          auctionId: payment.auctionId,
          userId: payment.buyerId,
          eventType: 'PAYMENT_DISPUTE' as any,
          severity: 'HIGH',
          metadata: { description: `Stripe dispute created for payment ${payment.id}. Reason: ${dispute.reason}`, disputeId: dispute.id, paymentId: payment.id, reason: dispute.reason },
        },
      }).catch((e) => this.logger.error(`Fraud event creation failed: ${e.message}`))

      this.logger.warn(`Payment dispute created: ${dispute.id} for payment ${payment.id}`)
    }
  }
}
