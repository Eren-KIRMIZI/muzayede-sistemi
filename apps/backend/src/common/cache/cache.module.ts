import { Module, Global } from '@nestjs/common'
import { CacheModule } from '@nestjs/cache-manager'
import { ConfigModule, ConfigService } from '@nestjs/config'
import * as redisStore from 'cache-manager-redis-store'
import { CacheService } from './cache.service'

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get('REDIS_URL', 'redis://localhost:6379')
        const isDev = config.get('NODE_ENV', 'development') !== 'production'

        if (isDev && !config.get('REDIS_URL')) {
          return {
            store: 'memory',
            ttl: 30,
            max: 500,
          }
        }

        return {
          store: redisStore,
          url: redisUrl,
          ttl: 30,
          max: 1000,
        }
      },
    }),
  ],
  providers: [CacheService],
  exports: [CacheModule, CacheService],
})
export class AppCacheModule {}
