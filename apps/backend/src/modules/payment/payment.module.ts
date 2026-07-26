import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PaymentService } from './payment.service'
import { PaymentController } from './payment.controller'
import { StripeWebhookService } from './stripe-webhook.service'
import { NotificationModule } from '../notification/notification.module'
import { PrismaModule } from '../../prisma/prisma.module'

@Module({
  imports: [PrismaModule, NotificationModule, ConfigModule],
  controllers: [PaymentController],
  providers: [PaymentService, StripeWebhookService],
  exports: [PaymentService, StripeWebhookService],
})
export class PaymentModule {}
