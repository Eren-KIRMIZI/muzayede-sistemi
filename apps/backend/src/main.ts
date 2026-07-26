import './common/telemetry/telemetry'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { HttpAdapterHost } from '@nestjs/core'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { LoggerService } from './common/services/logger.service'
import { RedisIoAdapter } from './common/websockets/redis-io.adapter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new LoggerService(),
  })

  const config = app.get(ConfigService)
  const nodeEnv = config.get('NODE_ENV', 'development')

  // ── Security Headers (Helmet) ──────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'ws:', 'wss:'],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          formAction: ["'self'"],
          baseUri: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'same-site' },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      noSniff: true,
      frameguard: { action: 'deny' },
      permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    }),
  )

  // ── Cookie Parser ──────────────────────────────────────────
  app.use(cookieParser())

  // ── CORS ───────────────────────────────────────────────────
  const corsOrigins = config.get('CORS_ORIGIN', 'http://localhost:3000')
  const allowedOrigins = corsOrigins.split(',').map((o: string) => o.trim())

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else if (nodeEnv !== 'production') {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400,
  })

  // ── Global Prefix ──────────────────────────────────────────
  app.setGlobalPrefix('api/v1')

  // ── Validation ─────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      disableErrorMessages: nodeEnv === 'production',
    }),
  )

  // ── Error Filter ───────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter())

  // ── Swagger (dev only) ─────────────────────────────────────
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('AuctionHub API')
      .setDescription(
        `## Microservices Müzayede Platformu REST API

### Kimlik Doğrulama
Korunan endpoint'ler için **Bearer Token** gereklidir.  
\`POST /api/v1/auth/login\` ile token alın, ardından \`Authorization: Bearer <token>\` header'ı ekleyin.

### Gruplar
- **Auth** — Kayıt, giriş, token yenileme, şifre sıfırlama
- **Users** — Profil yönetimi
- **Auctions** — İlan oluşturma, listeleme, yönetme
- **Listings** — Taslak ilan akışı
- **Bids** — Teklif verme ve geçmişi
- **Payments** — Ödeme ve escrow işlemleri
- **Orders** — Sipariş yönetimi
- **Notifications** — Bildirim listesi
- **Categories** — Kategori CRUD
- **Admin** — Admin işlemleri
- **Health** — Servis sağlık durumu
      `,
      )
      .setVersion('1.0.0')
      .setContact('AuctionHub Team', 'https://auctionhub.io', 'api@auctionhub.io')
      .setLicense('MIT', 'https://opensource.org/licenses/MIT')
      .addServer(`http://localhost:${config.get('PORT', 3001)}`, 'Development')
      .addServer('https://api.auctionhub.io', 'Production')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
        'JWT-Auth',
      )
      .addTag('Auth', 'Authentication & authorization endpoints')
      .addTag('Users', 'User profile management')
      .addTag('Auctions', 'Auction lifecycle management')
      .addTag('Listings', 'Draft auction management (pre-publish)')
      .addTag('Bids', 'Bidding operations')
      .addTag('Payments', 'Payment processing & escrow')
      .addTag('Orders', 'Post-auction order management')
      .addTag('Notifications', 'User notification center')
      .addTag('Categories', 'Auction categories')
      .addTag('Admin', 'Admin-only operations (requires ADMIN role)')
      .addTag('Health', 'Service health & readiness checks')
      .build()

    const document = SwaggerModule.createDocument(app, swaggerConfig)
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: 'none',
        filter: true,
        showRequestHeaders: true,
        tryItOutEnabled: true,
      },
      customSiteTitle: 'AuctionHub API Docs',
    })
  }

  // ── Trust Proxy (for rate limiting behind reverse proxy) ───
  const { httpAdapter } = app.get(HttpAdapterHost)
  httpAdapter.getInstance().set('trust proxy', nodeEnv === 'production' ? 1 : false)

  // ── WebSocket Redis Adapter ────────────────────────────────
  const redisIoAdapter = new RedisIoAdapter(app)
  await redisIoAdapter.connectToRedis(config)
  app.useWebSocketAdapter(redisIoAdapter)

  const port = config.get('PORT', 3001)
  await app.listen(port)

  const logger = new LoggerService()
  logger.log(`Server running on http://localhost:${port} [${nodeEnv}]`)
  if (nodeEnv !== 'production') {
    logger.log(`Swagger docs: http://localhost:${port}/api/docs`)
  }

  // ── Graceful Shutdown ──────────────────────────────────────
  const shutdown = async (signal: string) => {
    logger.log(`${signal} received. Shutting down gracefully...`)
    await app.close()
    process.exit(0)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

bootstrap()
