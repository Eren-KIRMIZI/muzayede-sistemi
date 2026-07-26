import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import * as fs from 'fs'
import * as path from 'path'
import { NotificationService } from './notification.service'
import { NotificationController } from './notification.controller'
import { AuctionGateway } from './notification.gateway'

function loadPrivateKey(config: ConfigService): string | Buffer {
  const keyPath = config.get('JWT_PRIVATE_KEY_PATH', './certs/jwt-private.pem')
  try {
    return fs.readFileSync(path.resolve(keyPath), 'utf-8')
  } catch {
    return config.get('JWT_SECRET', 'dev-secret-key')
  }
}

import { BullModule } from '@nestjs/bullmq'
import { NotificationProcessor } from './notification.processor'

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        privateKey: loadPrivateKey(config),
        signOptions: { algorithm: 'RS256' },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'notification-queue',
    }),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, AuctionGateway, NotificationProcessor],
  exports: [NotificationService, AuctionGateway, BullModule],
})
export class NotificationModule {}
