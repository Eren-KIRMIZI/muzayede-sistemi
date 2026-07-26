import { PrismaClient, Role, AuctionStatus, BidStatus } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const adminPassword = await bcrypt.hash('Admin@123456', 12)
  const userPassword = await bcrypt.hash('User@123456', 12)
  const sellerPassword = await bcrypt.hash('Seller@123456', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@auctionhub.com' },
    update: {},
    create: {
      email: 'admin@auctionhub.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: Role.ADMIN,
      emailVerified: true,
    },
  })

  const user = await prisma.user.upsert({
    where: { email: 'user@auctionhub.com' },
    update: {},
    create: {
      email: 'user@auctionhub.com',
      passwordHash: userPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: Role.USER,
      emailVerified: true,
    },
  })

  const seller = await prisma.user.upsert({
    where: { email: 'seller@auctionhub.com' },
    update: {},
    create: {
      email: 'seller@auctionhub.com',
      passwordHash: sellerPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      role: Role.SELLER,
      emailVerified: true,
    },
  })

  console.log('Created users:', { admin: admin.id, user: user.id, seller: seller.id })

  const categories = await prisma.category.findMany()
  const catMap: Record<string, string> = {}
  for (const c of categories) catMap[c.slug] = c.id

  const now = new Date()
  const h = (hours: number) => new Date(now.getTime() + hours * 3600000)

  const auctionData = [
    { title: 'iPhone 16 Pro Max 256GB', desc: 'Brand new, sealed box. Natural Titanium color. 256GB storage.', cat: 'electronics', start: 999.99, increment: 25, reserve: 1299.99, hours: 72, featured: true },
    { title: 'Rolex Submariner Date 126610LN', desc: 'Professional dive watch. Oystersteel case and bracelet. Black ceramic bezel.', cat: 'watches', start: 12500, increment: 250, reserve: 15000, hours: 48, featured: true },
    { title: '2024 Tesla Model 3 Performance', desc: 'White exterior, black interior. Full Self-Driving. 12,000 miles.', cat: 'vehicles', start: 35000, increment: 500, reserve: 42000, hours: 96, featured: true },
    { title: 'MacBook Pro M4 Max 16"', desc: 'Space Black. 36GB RAM, 1TB SSD. AppleCare+ until 2028.', cat: 'electronics', start: 2800, increment: 50, reserve: 3200, hours: 36, featured: true },
    { title: 'Banksy "Girl with Balloon" Print', desc: 'Limited edition screen print. Signed and numbered. COA included.', cat: 'art', start: 45000, increment: 1000, reserve: 65000, hours: 120, featured: true },
    { title: 'Hermes Birkin 30 Togo Leather', desc: 'Gold hardware. Black Togo leather. Dust bag and box included.', cat: 'fashion', start: 18000, increment: 300, reserve: 22000, hours: 60, featured: true },
    { title: 'Vintage Fender Stratocaster 1965', desc: 'Sunburst finish. Original pickups. All-original hardware.', cat: 'music', start: 15000, increment: 200, reserve: 20000, hours: 84, featured: true },
    { title: 'Diamond Tennis Bracelet 5ct', desc: '18K white gold. VS1 clarity diamonds. 7 inches.', cat: 'jewelry', start: 8000, increment: 100, reserve: 12000, hours: 24, featured: true },
    { title: 'PlayStation 5 Pro Bundle', desc: 'PS5 Pro + 3 DualSense controllers + 5 games. Sealed.', cat: 'electronics', start: 599.99, increment: 20, hours: 18 },
    { title: 'Signed Michael Jordan Jersey', desc: 'Authentic Chicago Bulls #23 jersey. Beckett certified.', cat: 'sports', start: 5000, increment: 100, hours: 48 },
    { title: 'Antique Persian Tabriz Rug 9x12', desc: 'Hand-knotted wool. Medallion design. Circa 1920.', cat: 'home', start: 3500, increment: 75, hours: 72 },
    { title: 'PSA 10 Charizard Holographic', desc: 'Base Set 1st Edition. PSA 10 Gem Mint.', cat: 'collectibles', start: 25000, increment: 500, hours: 36 },
    { title: 'Sonos Arc Soundbar', desc: 'Dolby Atmos. White. Like new in original box.', cat: 'electronics', start: 599.99, increment: 25, hours: 12 },
    { title: 'Omega Seamaster 300M', desc: 'Blue dial and bezel. Steel bracelet. Full set.', cat: 'watches', start: 3800, increment: 75, hours: 48 },
    { title: 'Mid-Century Modern Walnut Dining Table', desc: 'Seats 8. Danish design. 1960s original.', cat: 'home', start: 1200, increment: 50, hours: 96 },
  ]

  for (const a of auctionData) {
    const catId = catMap[a.cat]
    if (!catId) continue

    const auction = await prisma.auction.create({
      data: {
        sellerId: seller.id,
        categoryId: catId,
        title: a.title,
        description: a.desc,
        status: AuctionStatus.ACTIVE,
        startingPrice: a.start,
        reservePrice: a.reserve || null,
        currentPrice: a.start,
        bidIncrement: a.increment,
        startedAt: new Date(now.getTime() - 3600000),
        endsAt: h(a.hours),
        isFeatured: a.featured || false,
        isLive: a.hours <= 24,
        isHot: a.featured || false,
        location: 'Istanbul, Turkey',
        images: {
          create: {
            url: `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800`,
            alt: a.title,
            isPrimary: true,
            sortOrder: 0,
          },
        },
      },
    })
    console.log(`  Auction: ${auction.title} (${auction.id})`)
  }

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
