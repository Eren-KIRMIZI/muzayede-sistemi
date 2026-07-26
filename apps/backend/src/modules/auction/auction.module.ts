import { Module } from '@nestjs/common'
import { AuctionController } from './auction.controller'
import { AuctionService } from './auction.service'
import { AuctionScheduler } from './auction.scheduler'
import { AuctionJobsService } from './auction-jobs.service'
import { NotificationModule } from '../notification/notification.module'
import { PaymentModule } from '../payment/payment.module'

@Module({
  imports: [NotificationModule, PaymentModule],
  controllers: [AuctionController],
  providers: [AuctionService, AuctionScheduler, AuctionJobsService],
  exports: [AuctionService],
})
export class AuctionModule {}
