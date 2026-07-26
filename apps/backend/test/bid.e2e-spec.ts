import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { PrismaService } from '../src/prisma/prisma.service'
import { EventBusModule } from '../src/common/events/event-bus.module'

describe('Bid E2E', () => {
  let app: INestApplication
  let prisma: PrismaService
  let sellerToken: string
  let buyer1Token: string
  let buyer2Token: string
  let auctionId: string
  let categoryId: string

  const seller = { email: `e2e-seller-${Date.now()}@test.com`, password: 'P@ssword1!', firstName: 'S', lastName: 'S' }
  const buyer1 = { email: `e2e-b1-${Date.now()}@test.com`, password: 'P@ssword1!', firstName: 'B1', lastName: 'B1' }
  const buyer2 = { email: `e2e-b2-${Date.now()}@test.com`, password: 'P@ssword1!', firstName: 'B2', lastName: 'B2' }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, transformOptions: { enableImplicitConversion: true } }))
    app.setGlobalPrefix('api/v1')
    await app.init()

    prisma = app.get(PrismaService)

    // Register users
    const [sRes, b1Res, b2Res] = await Promise.all([
      request(app.getHttpServer()).post('/api/v1/auth/register').send(seller),
      request(app.getHttpServer()).post('/api/v1/auth/register').send(buyer1),
      request(app.getHttpServer()).post('/api/v1/auth/register').send(buyer2),
    ])
    sellerToken = sRes.body.accessToken
    buyer1Token = b1Res.body.accessToken
    buyer2Token = b2Res.body.accessToken

    // Setup Category & Auction
    const cat = await prisma.category.create({ data: { name: `Cat ${Date.now()}`, slug: `cat-${Date.now()}` } })
    categoryId = cat.id

    const auctionRes = await request(app.getHttpServer())
      .post('/api/v1/auctions')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        title: 'E2E Bid Test',
        description: 'Test',
        categoryId,
        startingPrice: 100,
        bidIncrement: 10,
        endsAt: new Date(Date.now() + 86400000).toISOString(),
      })
    
    auctionId = auctionRes.body.data.id
  })

  afterAll(async () => {
    await prisma.bid.deleteMany({ where: { auctionId } }).catch(() => {})
    await prisma.auction.delete({ where: { id: auctionId } }).catch(() => {})
    await prisma.category.delete({ where: { id: categoryId } }).catch(() => {})
    await prisma.user.deleteMany({ where: { email: { in: [seller.email, buyer1.email, buyer2.email] } } }).catch(() => {})
    await app.close()
  })

  // ── POST /bids ─────────────────────────────────────────────────────────────

  describe('POST /api/v1/bids', () => {
    it('should reject bid from unauthenticated user', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/bids')
        .send({ auctionId, amount: 150 })
        .expect(401)
    })

    it('should reject bid from seller', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/bids')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ auctionId, amount: 150 })
        .expect(400) // Or 403 based on implementation
    })

    it('should reject bid below starting price', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/bids')
        .set('Authorization', `Bearer ${buyer1Token}`)
        .send({ auctionId, amount: 50 })
        .expect(400)
    })

    it('should accept first valid bid', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/bids')
        .set('Authorization', `Bearer ${buyer1Token}`)
        .send({ auctionId, amount: 110 })
        .expect(201)

      expect(res.body.success).toBe(true)
      expect(res.body.data.amount).toBe(110)
      expect(res.body.data.status).toBe('WINNING')
    })

    it('should reject second bid if not meeting increment', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/bids')
        .set('Authorization', `Bearer ${buyer2Token}`)
        .send({ auctionId, amount: 115 }) // Need at least 110 + 10 = 120
        .expect(400)
    })

    it('should accept higher bid and outbid previous user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/bids')
        .set('Authorization', `Bearer ${buyer2Token}`)
        .send({ auctionId, amount: 130 })
        .expect(201)

      expect(res.body.success).toBe(true)
      expect(res.body.data.amount).toBe(130)

      // Check if previous bid is outbid
      const auctionRes = await request(app.getHttpServer())
        .get(`/api/v1/auctions/${auctionId}/bids`)
      
      const bids = auctionRes.body.data
      expect(bids[0].amount).toBe(130) // B2's bid
      expect(bids[0].status).toBe('WINNING')
      expect(bids[1].amount).toBe(110) // B1's bid
      expect(bids[1].status).toBe('OUTBID')
    })

    it('should accept auto-bid setup', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/bids')
        .set('Authorization', `Bearer ${buyer1Token}`)
        .send({ auctionId, amount: 140, maxAmount: 500 }) // Auto-bid up to 500
        .expect(201)
      
      expect(res.body.data.isAutoBid).toBe(true)
      expect(res.body.data.maxAmount).toBe(500)
    })
  })

  // ── GET /auctions/:id/bids ──────────────────────────────────────────────────

  describe('GET /api/v1/auctions/:id/bids', () => {
    it('should list bids for an auction', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/auctions/${auctionId}/bids`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data.length).toBeGreaterThanOrEqual(3) // B1(110), B2(130), B1(140 auto)
    })
  })
})
