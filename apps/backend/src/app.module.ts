import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { BullModule } from '@nestjs/bullmq'
import { ThrottlerModule } from '@nestjs/throttler'
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { ThrottlerGuard } from '@nestjs/throttler'
import { PrismaModule } from './prisma/prisma.module'
import { EmailModule } from './common/services/email.module'
import { SecurityModule } from './common/services/security.module'
import { AppCacheModule } from './common/cache/cache.module'
import { HealthModule } from './common/health/health.module'
import { ConcurrencyModule } from './common/concurrency/concurrency.module'
import { AuditModule } from './common/audit/audit.module'
import { RequestLoggerInterceptor } from './common/interceptors/request-logger.interceptor'
import { LoggerService } from './common/services/logger.service'
import { AuditInterceptor } from './common/audit/audit.interceptor'
import { AuthModule } from './modules/auth/auth.module'
import { UserModule } from './modules/user/user.module'
import { AuctionModule } from './modules/auction/auction.module'
import { BidModule } from './modules/bid/bid.module'
import { NotificationModule } from './modules/notification/notification.module'
import { CategoryModule } from './modules/category/category.module'
import { PaymentModule } from './modules/payment/payment.module'
import { ListingModule } from './modules/listing/listing.module'
import { AdminModule } from './modules/admin/admin.module'
import { OrderModule } from './modules/order/order.module'
import { FraudModule } from './modules/fraud/fraud.module'
import { EventBusModule } from './common/events/event-bus.module'
import { MetricsModule } from './common/metrics/metrics.module'
import { ResilienceModule } from './common/resilience/resilience.module'
import { EnvValidator } from './common/services/env-validator'

const envValidator = new EnvValidator()
envValidator.validate()

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get('THROTTLE_TTL', 60) * 1000,
            limit: config.get('THROTTLE_LIMIT', 100),
          },
        ],
      }),
    }),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get('REDIS_PORT', 6379),
          password: config.get('REDIS_PASSWORD'),
        },
      }),
    }),
    PrismaModule,
    EmailModule,
    SecurityModule,
    AppCacheModule,
    HealthModule,
    ConcurrencyModule,
    AuditModule,
    AuthModule,
    UserModule,
    AuctionModule,
    BidModule,
    NotificationModule,
    CategoryModule,
    PaymentModule,
    ListingModule,
    AdminModule,
    OrderModule,
    FraudModule,
    EventBusModule,
    MetricsModule,
    ResilienceModule,
  ],
  providers: [
    LoggerService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useFactory: (logger: LoggerService) => new RequestLoggerInterceptor(logger),
      inject: [LoggerService],
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
