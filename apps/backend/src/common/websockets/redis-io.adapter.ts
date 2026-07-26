import { IoAdapter } from '@nestjs/platform-socket.io'
import { ServerOptions } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { createClient } from 'redis'
import { Logger } from '@nestjs/common'
import { INestApplicationContext } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>
  private readonly logger = new Logger(RedisIoAdapter.name)

  constructor(app: INestApplicationContext) {
    super(app)
  }

  async connectToRedis(configService: ConfigService): Promise<void> {
    const host = configService.get<string>('REDIS_HOST', 'localhost')
    const port = configService.get<number>('REDIS_PORT', 6379)
    const password = configService.get<string>('REDIS_PASSWORD')

    const pubClient = createClient({
      socket: { host, port },
      password,
    })
    const subClient = pubClient.duplicate()

    pubClient.on('error', (err) => this.logger.error(`Redis PubClient Error: ${err.message}`))
    subClient.on('error', (err) => this.logger.error(`Redis SubClient Error: ${err.message}`))

    await Promise.all([pubClient.connect(), subClient.connect()])

    this.adapterConstructor = createAdapter(pubClient, subClient)
    this.logger.log(`Connected to Redis for Socket.IO at ${host}:${port}`)
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options)
    server.adapter(this.adapterConstructor)
    return server
  }
}
