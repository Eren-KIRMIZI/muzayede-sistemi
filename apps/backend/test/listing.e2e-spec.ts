import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { PrismaService } from '../src/prisma/prisma.service'

describe('Listing E2E', () => {
  let app: INestApplication
  let prisma: PrismaService
  let sellerToken: string
  let sellerId: string
  let categoryId: string
  let listingId: string

  const seller = { email: `listing-e2e-${Date.now()}@test.com`, password: 'SellerP@ss1!', firstName: 'Seller', lastName: 'User' }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, transformOptions: { enableImplicitConversion: true } }))
    app.setGlobalPrefix('api/v1')
    await app.init()

    prisma = app.get(PrismaService)

    // Register seller
    const sellerRes = await request(app.getHttpServer()).post('/api/v1/auth/register').send(seller)
    sellerToken = sellerRes.body.accessToken
    
    // Get user id from db
    const sellerUser = await prisma.user.findUnique({ where: { email: seller.email } })
    if (sellerUser) {
      sellerId = sellerUser.id
    }

    // Create a category
    const cat = await prisma.category.create({
      data: { name: `Listing E2E Cat ${Date.now()}`, slug: `listing-cat-${Date.now()}`, sortOrder: 1 },
    })
    categoryId = cat.id
  })

  afterAll(async () => {
    if (listingId) {
      await prisma.listing.delete({ where: { id: listingId } }).catch(() => {})
    }
    if (sellerId) {
      await prisma.user.delete({ where: { id: sellerId } }).catch(() => {})
    }
    if (categoryId) {
      await prisma.category.delete({ where: { id: categoryId } }).catch(() => {})
    }
    await app.close()
  })

  it('should create a new listing in DRAFT status', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/listings')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        title: 'E2E Test Listing',
        description: 'Test description for e2e',
        categoryId,
        startingPrice: 100.50,
      })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.id).toBeDefined()
    expect(res.body.data.status).toBe('DRAFT')
    expect(res.body.data.title).toBe('E2E Test Listing')
    
    listingId = res.body.data.id
  })

  it('should fetch my listings', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/listings/my')
      .set('Authorization', `Bearer ${sellerToken}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.length).toBeGreaterThanOrEqual(1)
    expect(res.body.data.some((l: any) => l.id === listingId)).toBe(true)
  })

  it('should fetch a single listing', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/listings/${listingId}`)
      .set('Authorization', `Bearer ${sellerToken}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.id).toBe(listingId)
  })
})
