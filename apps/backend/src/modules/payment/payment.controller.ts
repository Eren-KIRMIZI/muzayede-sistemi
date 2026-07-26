import {
  Controller, Get, Post, Patch, Param, Query, UseGuards,
  HttpCode, HttpStatus, Body, Headers, Req, UseInterceptors,
} from '@nestjs/common'
import { IdempotencyInterceptor } from '../../common/interceptors/idempotency.interceptor'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/user.decorator'
import { PaymentService } from './payment.service'
import { StripeWebhookService } from './stripe-webhook.service'
import { Public } from '../../common/decorators/public.decorator'
import { Request } from 'express'

@ApiTags('Payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-Auth')
@Controller('payments')
export class PaymentController {
  constructor(
    private paymentService: PaymentService,
    private stripeWebhookService: StripeWebhookService,
  ) {}

  // ── Stripe Webhook (public — no JWT, raw body required) ────────────────────

  @Post('webhook/stripe')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async stripeWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody: Buffer = (req as any).rawBody
    const event = this.stripeWebhookService.constructEvent(rawBody, signature)
    await this.stripeWebhookService.handleEvent(event)
    return { received: true }
  }
  @Post('auction/:auctionId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create payment for won auction' })
  @UseInterceptors(IdempotencyInterceptor)
  async createPayment(
    @Param('auctionId') auctionId: string,
    @CurrentUser('sub') userId: string,
  ) {
    const payment = await this.paymentService.createPayment(auctionId, userId)
    return { success: true, data: payment }
  }



  @Get()
  @ApiOperation({ summary: 'Get my payments' })
  async getMyPayments(
    @CurrentUser('sub') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.paymentService.getMyPayments(userId, Number(page) || 1, Number(limit) || 20)
    return { success: true, ...result }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment details' })
  async getPayment(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    const payment = await this.paymentService.getPayment(id, userId)
    return { success: true, data: payment }
  }

  @Patch(':id/release')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Release escrow for a payment' })
  @UseInterceptors(IdempotencyInterceptor)
  async releaseEscrow(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    const payment = await this.paymentService.releaseEscrow(id, userId)
    return { success: true, data: payment }
  }

  @Patch(':id/refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refund a payment' })
  @UseInterceptors(IdempotencyInterceptor)
  async refundPayment(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    const payment = await this.paymentService.refundPayment(id, userId)
    return { success: true, data: payment }
  }
}
