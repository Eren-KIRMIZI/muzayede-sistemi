import { Module } from '@nestjs/common'
import { ShillBiddingService } from './shill-bidding.service'
import { BotDetectionService } from './bot-detection.service'
import { PrismaModule } from '../../prisma/prisma.module'
import { AppCacheModule } from '../../common/cache/cache.module'

@Module({
  imports: [PrismaModule, AppCacheModule],
  providers: [ShillBiddingService, BotDetectionService],
  exports: [ShillBiddingService, BotDetectionService],
})
export class FraudModule {}
