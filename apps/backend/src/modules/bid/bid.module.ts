import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { BidService } from './bid.service'
import { BidController, UserBidController } from './bid.controller'
import { AuctionModule } from '../auction/auction.module'
import { NotificationModule } from '../notification/notification.module'
import { FraudModule } from '../fraud/fraud.module'

@Module({
  imports: [
    AuctionModule,
    NotificationModule,
    FraudModule,
    BullModule.registerQueue({ name: 'notification-queue' }),
  ],
  controllers: [BidController, UserBidController],
  providers: [BidService],
  exports: [BidService],
})
export class BidModule {}
