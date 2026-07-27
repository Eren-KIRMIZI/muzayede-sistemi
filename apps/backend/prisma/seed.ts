import { PrismaClient, Role, AuctionStatus, BidStatus, NotificationType, PaymentStatus, PaymentMethod, EscrowStatus, OrderStatus, AuditAction } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const unsplash = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?w=${w}&auto=format&fit=crop&q=80`

const auctionImages: Record<string, { url: string; alt: string }[]> = {
  'iphone-16': [
    { url: unsplash('photo-1592750475338-74b7b21085ab'), alt: 'iPhone 16 Pro Max' },
    { url: unsplash('photo-1510557880182-3d4d3cba35a5'), alt: 'iPhone 16 Detail' },
  ],
  'rolex-sub': [
    { url: unsplash('photo-1587836374828-4dbafa94cf0e'), alt: 'Rolex Submariner' },
    { url: unsplash('photo-1548171915-e79a380a2a4b'), alt: 'Rolex Side View' },
    { url: unsplash('photo-1526045431048-f857369baa09'), alt: 'Rolex on Wrist' },
  ],
  'tesla-m3': [
    { url: unsplash('photo-1617788138017-80ad40651399'), alt: 'Tesla Model 3 Performance' },
    { url: unsplash('photo-1560958089-b8a1929cea89'), alt: 'Tesla Interior' },
  ],
  'macbook-m4': [
    { url: unsplash('photo-1517336714731-489689fd1ca8'), alt: 'MacBook Pro M4 Max' },
    { url: unsplash('photo-1611186871348-b1ce696e52c9'), alt: 'MacBook Keyboard' },
  ],
  'banksy': [
    { url: unsplash('photo-1579783902614-a3fb3927b6a5'), alt: 'Banksy Girl with Balloon Print' },
    { url: unsplash('photo-1578301978693-85fa9c0320b9'), alt: 'Art Gallery Wall' },
  ],
  'birkin': [
    { url: unsplash('photo-1584917865442-de89df76afd3'), alt: 'Hermes Birkin 30' },
    { url: unsplash('photo-1548036328-c9fa89d128fa'), alt: 'Birkin Leather Detail' },
  ],
  'fender': [
    { url: unsplash('photo-1510915361894-db8b60106cb1'), alt: 'Vintage Fender Stratocaster 1965' },
    { url: unsplash('photo-1516924962500-2b4b3b99ea02'), alt: 'Guitar Headstock' },
  ],
  'diamond': [
    { url: unsplash('photo-1515562141589-67f0d93e27a0'), alt: 'Diamond Tennis Bracelet' },
    { url: unsplash('photo-1603561591411-07134e71a2a9'), alt: 'Diamond Close Up' },
  ],
  'ps5-pro': [
    { url: unsplash('photo-1606144042614-b2417e99c4e3'), alt: 'PlayStation 5 Pro Bundle' },
    { url: unsplash('photo-1621259192911-93f85a1a2e53'), alt: 'PS5 Controllers' },
  ],
  'jordan': [
    { url: unsplash('photo-1574629810360-7efbbe195018'), alt: 'Signed Michael Jordan Jersey' },
    { url: unsplash('photo-1546519638-68e109498ffc'), alt: 'Basketball Court' },
  ],
  'rug': [
    { url: unsplash('photo-1600166898405-da9535204843'), alt: 'Antique Persian Tabriz Rug' },
    { url: unsplash('photo-1558618666-fcd25c85f82e'), alt: 'Rug Pattern Detail' },
  ],
  'charizard': [
    { url: unsplash('photo-1612178991541-b48cc8e92a4d'), alt: 'PSA 10 Charizard Holographic' },
    { url: unsplash('photo-1625961332771-3f036cbf4f85'), alt: 'Pokemon Cards Collection' },
  ],
  'sonos': [
    { url: unsplash('photo-1558089687-f282ffcbc126'), alt: 'Sonos Arc Soundbar' },
    { url: unsplash('photo-1593784991095-a205069470b6'), alt: 'Home Theater Setup' },
  ],
  'omega': [
    { url: unsplash('photo-1614164185128-e4ec99c436d7'), alt: 'Omega Seamaster 300M' },
    { url: unsplash('photo-1508685096489-7aacd43bd3b1'), alt: 'Omega Blue Dial' },
  ],
  'table': [
    { url: unsplash('photo-1617806118233-18e1de247200'), alt: 'Mid-Century Modern Walnut Dining Table' },
    { url: unsplash('photo-1555041469-a586c61ea9bc'), alt: 'Dining Room Interior' },
  ],
  'kitchen-aid': [
    { url: unsplash('photo-1594385208974-2f145757a444'), alt: 'KitchenAid Stand Mixer' },
    { url: unsplash('photo-1556909114-f6e7ad7d3136'), alt: 'Kitchen Counter' },
  ],
  'leica': [
    { url: unsplash('photo-1516035069371-29a1b244cc32'), alt: 'Leica M11 Camera' },
    { url: unsplash('photo-1502920917128-1aa500764cbd'), alt: 'Camera Lens Detail' },
  ],
}

async function main() {
  console.log('Cleaning previous seed data...')
  await prisma.auditLog.deleteMany()
  await prisma.order.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.watchlist.deleteMany()
  await prisma.bid.deleteMany()
  await prisma.auctionImage.deleteMany()
  await prisma.auction.deleteMany()
  await prisma.user.deleteMany()
  await prisma.category.deleteMany()
  console.log('Previous data cleaned')

  console.log('Seeding database...')

  const adminPassword = await bcrypt.hash('Admin@123456', 12)
  const userPassword = await bcrypt.hash('User@123456', 12)
  const sellerPassword = await bcrypt.hash('Seller@123456', 12)

  // ── Users ──────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@auctionhub.com' },
    update: { passwordHash: adminPassword, role: Role.ADMIN, emailVerified: true, isActive: true, isDeleted: false },
    create: {
      email: 'admin@auctionhub.com', passwordHash: adminPassword,
      firstName: 'Admin', lastName: 'Yönetici', role: Role.ADMIN, emailVerified: true,
      bio: 'AuctionHub platform yöneticisi. Tüm sistem operasyonlarını denetler.',
      avatarUrl: unsplash('photo-1472099645785-5658abf4ff4e', 200),
    },
  })

  const user = await prisma.user.upsert({
    where: { email: 'user@auctionhub.com' },
    update: { passwordHash: userPassword, role: Role.USER, emailVerified: true, isActive: true, isDeleted: false },
    create: {
      email: 'user@auctionhub.com', passwordHash: userPassword,
      firstName: 'Ahmet', lastName: 'Yılmaz', role: Role.USER, emailVerified: true,
      bio: 'Koleksiyon tutkunu. Saat ve sanat eserleri ilgimi çekiyor.',
      avatarUrl: unsplash('photo-1507003211169-0a1dd7228f2d', 200),
    },
  })

  const seller = await prisma.user.upsert({
    where: { email: 'seller@auctionhub.com' },
    update: { passwordHash: sellerPassword, role: Role.SELLER, emailVerified: true, isActive: true, isDeleted: false },
    create: {
      email: 'seller@auctionhub.com', passwordHash: sellerPassword,
      firstName: 'Ayşe', lastName: 'Demir', role: Role.SELLER, emailVerified: true,
      bio: 'Profesyonel satıcı. Lüks saat ve aksesuar uzmanı. 10+ yıl deneyim.',
      avatarUrl: unsplash('photo-1494790108377-be9c29b29330', 200),
    },
  })

  const extraUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'mehmet@example.com', passwordHash: userPassword,
        firstName: 'Mehmet', lastName: 'Kaya', role: Role.USER, emailVerified: true,
        bio: 'Antika meraklısı ve koleksiyoncu.',
        avatarUrl: unsplash('photo-1500648767791-00dcc994a43e', 200),
      },
    }),
    prisma.user.create({
      data: {
        email: 'zeynep@example.com', passwordHash: userPassword,
        firstName: 'Zeynep', lastName: 'Öztürk', role: Role.USER, emailVerified: true,
        bio: 'Sanat ve tasarım tutkunu.',
        avatarUrl: unsplash('photo-1438761681033-6461ffad8d80', 200),
      },
    }),
    prisma.user.create({
      data: {
        email: 'elif@example.com', passwordHash: sellerPassword,
        firstName: 'Elif', lastName: 'Çelik', role: Role.SELLER, emailVerified: true,
        bio: 'Vintage ve retro ürünlerde uzman.',
        avatarUrl: unsplash('photo-1544005313-94ddf0286df2', 200),
      },
    }),
    prisma.user.create({
      data: {
        email: 'can@example.com', passwordHash: userPassword,
        firstName: 'Can', lastName: 'Arslan', role: Role.USER, emailVerified: true,
        bio: 'Teknoloji ve elektronik ürün takipçisi.',
        avatarUrl: unsplash('photo-1506794778202-cad84cf45f1d', 200),
      },
    }),
  ])

  console.log('Created users')

  // ── Categories ─────────────────────────────────────────────
  const categoryData = [
    { name: 'Elektronik', slug: 'electronics', description: 'Bilgisayar, telefon,tablet ve elektronik aksesuarlar', icon: 'cpu', accentColor: '#6366f1', sortOrder: 1 },
    { name: 'Araçlar', slug: 'vehicles', description: 'Otomobil, motosiklet ve araç aksesuarları', icon: 'car', accentColor: '#10b981', sortOrder: 2 },
    { name: 'Saatler', slug: 'watches', description: 'Kol saatleri, cep saatleri ve saat aksesuarları', icon: 'watch', accentColor: '#f59e0b', sortOrder: 3 },
    { name: 'Sanat', slug: 'art', description: 'Tablolar, heykeller ve sanat eserleri', icon: 'palette', accentColor: '#3b82f6', sortOrder: 4 },
    { name: 'Moda', slug: 'fashion', description: 'Giyim, çanta ve aksesuarlar', icon: 'shirt', accentColor: '#ec4899', sortOrder: 5 },
    { name: 'Ev & Yaşam', slug: 'home', description: 'Mobilya, dekorasyon ve ev aksesuarları', icon: 'home', accentColor: '#10b981', sortOrder: 6 },
    { name: 'Spor', slug: 'sports', description: 'Spor malzemeleri, formalar ve spor koleksiyonları', icon: 'trophy', accentColor: '#f59e0b', sortOrder: 7 },
    { name: 'Mücevher', slug: 'jewelry', description: 'Takı, mücevher ve değerli taşlar', icon: 'gem', accentColor: '#3b82f6', sortOrder: 8 },
    { name: 'Koleksiyon', slug: 'collectibles', description: 'Kartlar, pullar ve koleksiyon ürünleri', icon: 'star', accentColor: '#6366f1', sortOrder: 9 },
    { name: 'Müzik', slug: 'music', description: 'Enstrümanlar, plaklar ve müzik aksesuarları', icon: 'music', accentColor: '#3b82f6', sortOrder: 10 },
  ]

  const catMap: Record<string, string> = {}
  for (const c of categoryData) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, icon: c.icon, accentColor: c.accentColor, sortOrder: c.sortOrder, isActive: true },
      create: c,
    })
    catMap[c.slug] = cat.id
  }
  console.log(`Created ${categoryData.length} categories`)

  const now = new Date()
  const h = (hours: number) => new Date(now.getTime() + hours * 3600000)
  const d = (days: number) => new Date(now.getTime() + days * 86400000)
  const ago = (hours: number) => new Date(now.getTime() - hours * 3600000)

  // ── Auctions ───────────────────────────────────────────────
  const auctionData = [
    { title: 'iPhone 16 Pro Max 256GB', desc: 'Marka yeni, mühürlü kutu. Natural Titanium rengi. 256GB depolama. Apple Care+ ile.', cat: 'electronics', start: 999.99, increment: 25, reserve: 1299.99, hours: 72, featured: true, img: 'iphone-16', bidderCount: 12, watchCount: 48 },
    { title: 'Rolex Submariner Date 126610LN', desc: 'Profesyonel dalış saati. Oystersteel kasa ve bilezik. Siyah seramik bezel. Tam set.', cat: 'watches', start: 12500, increment: 250, reserve: 15000, hours: 48, featured: true, img: 'rolex-sub', bidderCount: 8, watchCount: 92 },
    { title: '2024 Tesla Model 3 Performance', desc: 'Beyaz dış, siyah iç. Full Self-Driving. 12.000 mil. Garanti kapsamında.', cat: 'vehicles', start: 35000, increment: 500, reserve: 42000, hours: 96, featured: true, img: 'tesla-m3', bidderCount: 5, watchCount: 67 },
    { title: 'MacBook Pro M4 Max 16"', desc: 'Space Black. 36GB RAM, 1TB SSD. AppleCare+ 2028\'e kadar.', cat: 'electronics', start: 2800, increment: 50, reserve: 3200, hours: 36, featured: true, img: 'macbook-m4', bidderCount: 15, watchCount: 55 },
    { title: 'Banksy "Girl with Balloon" Baskı', desc: 'Limited edition serigrafi baskısı. İmzalı ve numaralı. COA dahil.', cat: 'art', start: 45000, increment: 1000, reserve: 65000, hours: 120, featured: true, img: 'banksy', bidderCount: 3, watchCount: 120 },
    { title: 'Hermès Birkin 30 Togo Deri', desc: 'Altın aksesuarlar. Siyah Togo deri. Toz torbası ve kutu dahil.', cat: 'fashion', start: 18000, increment: 300, reserve: 22000, hours: 60, featured: true, img: 'birkin', bidderCount: 6, watchCount: 78 },
    { title: 'Vintage Fender Stratocaster 1965', desc: 'Sunburst cilalı. Orijinal pickup\'lar. Tüm parçalar orijinal.', cat: 'music', start: 15000, increment: 200, reserve: 20000, hours: 84, featured: true, img: 'fender', bidderCount: 4, watchCount: 35 },
    { title: '5 Karat Elmas Tenis Bilekliği', desc: '18K beyaz altın. VS1 berraklıkta elmaslar. 18 inç.', cat: 'jewelry', start: 8000, increment: 100, reserve: 12000, hours: 24, featured: true, img: 'diamond', bidderCount: 7, watchCount: 42 },
    { title: 'PlayStation 5 Pro Bundle', desc: 'PS5 Pro + 3 DualSense kumanda + 5 oyun. Mühürlü.', cat: 'electronics', start: 599.99, increment: 20, hours: 18, img: 'ps5-pro', bidderCount: 22, watchCount: 88 },
    { title: 'İmzalı Michael Jordan Forması', desc: 'Orijinal Chicago Bulls #23 forma. Beckett sertifikalı.', cat: 'sports', start: 5000, increment: 100, hours: 48, img: 'jordan', bidderCount: 9, watchCount: 56 },
    { title: 'Antik İran Tabriz Halısı 9x12', desc: 'El düğümlü yün. Madalyon deseni. Yaklaşık 1920.', cat: 'home', start: 3500, increment: 75, hours: 72, img: 'rug', bidderCount: 3, watchCount: 18 },
    { title: 'PSA 10 Charizard Holografik', desc: 'Base Set 1. Edisyon. PSA 10 Gem Mint.', cat: 'collectibles', start: 25000, increment: 500, hours: 36, img: 'charizard', bidderCount: 11, watchCount: 95 },
    { title: 'Sonos Arc Soundbar', desc: 'Dolby Atmos. Beyaz. Orijinal kutusunda, yeni gibi.', cat: 'electronics', start: 599.99, increment: 25, hours: 12, img: 'sonos', bidderCount: 6, watchCount: 24 },
    { title: 'Omega Seamaster 300M', desc: 'Mavi kadran ve bezel. Çelik bilezik. Tam set.', cat: 'watches', start: 3800, increment: 75, hours: 48, img: 'omega', bidderCount: 10, watchCount: 62 },
    { title: 'Mid-Century Modern Ceviz Yemek Masası', desc: '8 kişilik. Danimarka tasarımı. 1960 orijinal.', cat: 'home', start: 1200, increment: 50, hours: 96, img: 'table', bidderCount: 2, watchCount: 14 },
  ]

  const allBidders = [user, ...extraUsers]
  const auctions: any[] = []

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
        currentPrice: a.start + a.bidderCount * a.increment,
        bidIncrement: a.increment,
        bidCount: a.bidderCount,
        watcherCount: a.watchCount,
        startedAt: ago(6),
        endsAt: h(a.hours),
        isFeatured: a.featured || false,
        isLive: a.hours <= 24,
        isHot: a.featured || false,
        location: 'İstanbul, Türkiye',
        shipping: 'Sigortalı kargo ile dünya genelinde teslimat',
        images: {
          create: (auctionImages[a.img] || []).map((img, i) => ({
            url: img.url,
            alt: img.alt,
            isPrimary: i === 0,
            sortOrder: i,
          })),
        },
      },
    })
    auctions.push(auction)
    console.log(`  Auction: ${auction.title} (${auction.id})`)
  }

  // ── Bids ───────────────────────────────────────────────────
  console.log('Creating bids...')
  let bidCount = 0
  for (const auction of auctions) {
    const numBids = Math.min(auction.bidCount, allBidders.length)
    for (let i = 0; i < numBids; i++) {
      const bidder = allBidders[i % allBidders.length]
      const amount = Number(auction.startingPrice) + (i + 1) * Number(auction.bidIncrement)
      const isWinning = i === numBids - 1

      await prisma.bid.create({
        data: {
          auctionId: auction.id,
          userId: bidder.id,
          amount,
          isAutoBid: i % 3 === 0,
          status: isWinning ? BidStatus.WINNING : BidStatus.OUTBID,
          createdAt: ago(6 - i * 0.5),
        },
      })
      bidCount++
    }
  }
  console.log(`  Created ${bidCount} bids`)

  // ── Watchlists ─────────────────────────────────────────────
  console.log('Creating watchlists...')
  let watchCount = 0
  for (const bidder of allBidders) {
    const watchIds = auctions.slice(
      Math.floor(Math.random() * 3),
      Math.floor(Math.random() * 5) + 5,
    )
    for (const auction of watchIds) {
      try {
        await prisma.watchlist.create({
          data: { userId: bidder.id, auctionId: auction.id },
        })
        watchCount++
      } catch { /* unique constraint skip */ }
    }
  }
  console.log(`  Created ${watchCount} watchlist entries`)

  // ── Notifications ──────────────────────────────────────────
  console.log('Creating notifications...')
  const notifData = [
    { userId: user.id, type: NotificationType.BID_PLACED, title: 'Teklifiniz yerleştirildi', message: 'Rolex Submariner 126610LN üzerine $13,250 teklifiniz başarıyla yerleştirildi.', data: { auctionId: auctions[1]?.id }, isRead: false },
    { userId: user.id, type: NotificationType.OUTBID, title: 'Teklifiniz geçildi', message: 'MacBook Pro M4 Max üzerindeki teklifiniz $3,100 ile geçildi.', data: { auctionId: auctions[3]?.id }, isRead: false },
    { userId: user.id, type: NotificationType.AUCTION_WON, title: 'Müzayede kazanıldı!', message: 'Tebrikler! Sonos Arc Soundbar müzayedesini $724.99 ile kazandınız.', data: { auctionId: auctions[12]?.id }, isRead: true },
    { userId: user.id, type: NotificationType.PAYMENT, title: 'Ödeme alındı', message: 'Sonos Arc Soundbar için $724.99 ödemeniz başarıyla alındı.', isRead: true },
    { userId: user.id, type: NotificationType.SYSTEM, title: 'Hoş geldiniz!', message: 'AuctionHub\'a hoş geldiniz. Profilinizi tamamlayarak teklif vermeye başlayabilirsiniz.', isRead: true },
    { userId: user.id, type: NotificationType.PROMOTION, title: 'Özel kampanya', message: 'Bu hafta sonu tüm saat kategorilerinde komisyon indirimi! %20\'ye varan avantajlar.', isRead: false },
    { userId: seller.id, type: NotificationType.BID_PLACED, title: 'Yeni teklif', message: 'Rolex Submariner ilanınıza yeni bir teklif geldi: $13,250', data: { auctionId: auctions[1]?.id }, isRead: false },
    { userId: seller.id, type: NotificationType.BID_PLACED, title: 'Yeni teklif', message: 'Hermès Birkin 30 ilanınıza yeni bir teklif geldi: $19,800', data: { auctionId: auctions[5]?.id }, isRead: false },
    { userId: seller.id, type: NotificationType.SYSTEM, title: 'Satıcı hesabınız onaylandı', message: 'Tebrikler! Satıcı hesabınız başarıyla onaylandı. Artık ürün listeleyebilirsiniz.', isRead: true },
    { userId: admin.id, type: NotificationType.SYSTEM, title: 'Sistem güncellemesi', message: 'Platform v2.1 güncellemesi başarıyla yüklendi. Yeni özellikler aktif.', isRead: true },
  ]

  for (const n of notifData) {
    await prisma.notification.create({ data: n as any })
  }
  console.log(`  Created ${notifData.length} notifications`)

  // ── Payments & Orders ──────────────────────────────────────
  console.log('Creating payments and orders...')
  const paidAuctions = auctions.slice(12, 14)
  for (const auction of paidAuctions) {
    const amount = Number(auction.currentPrice)
    const fee = amount * 0.05
    const payment = await prisma.payment.create({
      data: {
        auctionId: auction.id,
        buyerId: user.id,
        sellerId: seller.id,
        amount,
        fee,
        net: amount - fee,
        status: PaymentStatus.COMPLETED,
        method: PaymentMethod.CARD,
        escrowStatus: EscrowStatus.HELD,
        paidAt: ago(2),
      },
    })

    await prisma.order.create({
      data: {
        paymentId: payment.id,
        auctionId: auction.id,
        buyerId: user.id,
        sellerId: seller.id,
        status: OrderStatus.SHIPPED,
        trackingNumber: `TRK${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        carrier: 'Yurtiçi Kargo',
        shippingAddress: {
          city: 'İstanbul',
          district: 'Kadıköy',
          address: 'Bağdat Caddesi No:123',
          zipCode: '34728',
        },
      },
    })
  }
  console.log(`  Created payments and orders`)

  // ── Audit Logs ─────────────────────────────────────────────
  console.log('Creating audit logs...')
  const auditData = [
    { userId: admin.id, action: AuditAction.LOGIN, resource: 'auth', ipAddress: '192.168.1.100' },
    { userId: user.id, action: AuditAction.LOGIN, resource: 'auth', ipAddress: '192.168.1.105' },
    { userId: seller.id, action: AuditAction.CREATE, resource: 'auction', resourceId: auctions[0]?.id, ipAddress: '192.168.1.110' },
    { userId: user.id, action: AuditAction.BID, resource: 'bid', resourceId: auctions[1]?.id, ipAddress: '192.168.1.105' },
    { userId: admin.id, action: AuditAction.READ, resource: 'users', ipAddress: '192.168.1.100' },
    { userId: seller.id, action: AuditAction.UPDATE, resource: 'auction', resourceId: auctions[2]?.id, ipAddress: '192.168.1.110' },
    { userId: user.id, action: AuditAction.PAYMENT, resource: 'payment', ipAddress: '192.168.1.105' },
    { userId: admin.id, action: AuditAction.DELETE, resource: 'auction', resourceId: auctions[3]?.id, ipAddress: '192.168.1.100' },
  ]

  for (const a of auditData) {
    await prisma.auditLog.create({ data: a as any })
  }
  console.log(`  Created ${auditData.length} audit logs`)

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
