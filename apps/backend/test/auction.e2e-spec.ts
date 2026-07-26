import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { PrismaService } from '../src/prisma/prisma.service'

describe('Auction E2E', () => {
  let app: INestApplication
  let prisma: PrismaService
  let sellerToken: string
  let buyerToken: string
  let auctionId: string
  let categoryId: string

  const seller = { email: `e2e-seller-${Date.now()}@test.com`, password: 'SellerP@ss1!', firstName: 'Seller', lastName: 'User' }
  const buyer = { email: `e2e-buyer-${Date.now()}@test.com`, password: 'BuyerP@ss1!', firstName: 'Buyer', lastName: 'User' }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, transformOptions: { enableImplicitConversion: true } }))
    app.setGlobalPrefix('api/v1')
    await app.init()

    prisma = app.get(PrismaService)

    // Register seller & buyer
    const [sellerRes, buyerRes] = await Promise.all([
      request(app.getHttpServer()).post('/api/v1/auth/register').send(seller),
      request(app.getHttpServer()).post('/api/v1/auth/register').send(buyer),
    ])
    sellerToken = sellerRes.body.accessToken
    buyerToken = buyerRes.body.accessToken

    // Create a category
    const cat = await prisma.category.create({
      data: { name: `E2E Category ${Date.now()}`, slug: `e2e-cat-${Date.now()}`, sortOrder: 99 },
    })
    categoryId = cat.id
  })

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [seller.email, buyer.email] } } }).catch(() => {})
    await prisma.category.delete({ where: { id: categoryId } }).catch(() => {})
    await app.close()
  })

  // ── POST /auctions ─────────────────────────────────────────────────────────

  describe('POST /api/v1/auctions', () => {
    it('should create an auction for authenticated seller', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auctions')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          title: 'E2E Test Auction',
          description: 'An auction created during E2E testing',
          categoryId,
          startingPrice: 100,
          bidIncrement: 10,
          endsAt: new Date(Date.now() + 86400000).toISOString(),
        })
        .expect(201)

      expect(res.body.success).toBe(true)
      expect(res.body.data.title).toBe('E2E Test Auction')
      auctionId = res.body.data.id
    })

    it('should return 401 when unauthenticated', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auctions')
        .send({ title: 'Unauthorized', categoryId, startingPrice: 100, bidIncrement: 10, endsAt: new Date().toISOString() })
        .expect(401)
    })
  })

  // ── GET /auctions ──────────────────────────────────────────────────────────

  describe('GET /api/v1/auctions', () => {
    it('should list auctions without authentication', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auctions')
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    it('should filter auctions by category', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/auctions?categoryId=${categoryId}`)
        .expect(200)

      expect(res.body.success).toBe(true)
    })
  })

  // ── GET /auctions/:id ──────────────────────────────────────────────────────

  describe('GET /api/v1/auctions/:id', () => {
    it('should get auction details by id', async () => {
      if (!auctionId) return

      const res = await request(app.getHttpServer())
        .get(`/api/v1/auctions/${auctionId}`)
        .expect(200)

      expect(res.body.data.id).toBe(auctionId)
    })

    it('should return 404 for non-existent auction', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auctions/00000000-0000-0000-0000-000000000000')
        .expect(404)
    })
  })

  // ── POST /auctions/:id/watch ───────────────────────────────────────────────

  describe('POST /api/v1/auctions/:id/watch', () => {
    it('should toggle watch on auction for authenticated user', async () => {
      if (!auctionId) return

      await request(app.getHttpServer())
        .post(`/api/v1/auctions/${auctionId}/watch`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200)
    })
  })
})
