# Gerçek Zamanlı Müzayede Platformu

Bu proje, yüksek eşzamanlılık (high concurrency) gereksinimlerini karşılayacak şekilde tasarlanmış, güvenli ve ölçeklenebilir bir açık artırma (müzayede) backend platformudur. Gerçek zamanlı teklif iletimi, güvenli ödeme havuzu (escrow), sahtekarlık tespiti ve kapsamlı admin araçlarını tek bir modüler yapı altında sunar.

Proje, **NestJS** ve **TypeScript** ile geliştirilmiş olup modüler monolit mimarisini benimsemektedir. Her domain (müzayede, teklif, ödeme vb.) kendi içinde izole edilerek ileride mikroservis mimarisine geçişe hazır biçimde yapılandırılmıştır.

---

## İçindekiler

- [Mimari](#mimari)
- [Teknoloji Yığını](#teknoloji-yığını)
- [Proje Yapısı](#proje-yapısı)
- [Temel Özellikler](#temel-özellikler)
- [Güvenlik Katmanları](#güvenlik-katmanları)
- [Veri Modeli](#veri-modeli)
- [Kurulum](#kurulum)
- [Çevresel Değişkenler](#çevresel-değişkenler)
- [Veritabanı Yönetimi](#veritabanı-yönetimi)
- [Test](#test)
- [API Dokümantasyonu](#api-dokümantasyonu)
- [Dağıtım](#dağıtım)
- [Mimari Kararlar](#mimari-kararlar)

---

## Mimari

Sistem, `pnpm workspaces` ile yönetilen bir monorepo yapısındadır. Ana uygulama `apps/backend` altında yer almakta; paylaşımlı tipler, olay tanımları ve yardımcı araçlar `packages/` dizininde tutulmaktadır.

```
İstemci (HTTP/WebSocket)
        |
        v
  NestJS API (apps/backend)
        |
   -----+------+----------+-----------+
   |           |          |           |
PostgreSQL   Redis      BullMQ    Socket.io
(Prisma)    (Cache)    (Kuyruk)   (Gerçek Zamanlı)
```

Uygulama, iş mantığını katmanlı bir şekilde düzenler:

- **Controller** katmanı: HTTP isteği alır, doğrulama yapar ve servise iletir.
- **Service** katmanı: İş kurallarını uygular, veritabanı işlemlerini yönetir.
- **Repository** katmanı: Prisma üzerinden veritabanı erişimini soyutlar.
- **Event** katmanı: Domain olaylarını BullMQ kuyruğu üzerinden asenkron işler.

---

## Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Çerçeve | NestJS 10, TypeScript 5 |
| Çalışma Ortamı | Node.js 20+ |
| Veritabanı | PostgreSQL 15 |
| ORM | Prisma 6 |
| Cache | Redis 7 (cache-manager ile) |
| İş Kuyruğu | BullMQ + Redis |
| Gerçek Zamanlı | Socket.io |
| Kimlik Doğrulama | JWT (RS256), Passport, Google OAuth2 |
| Ödeme | Stripe (Webhook entegrasyonu) |
| Güvenlik | Helmet, CSRF koruması, Rate Limiting |
| İzleme | Prometheus, Grafana, OpenTelemetry (Jaeger) |
| Dokümantasyon | Swagger / OpenAPI 3.0 |
| Test | Jest (Unit + E2E), k6 (Yük Testi) |
| Paket Yöneticisi | pnpm Workspaces |
| CI/CD | GitHub Actions |
| Konteyner | Docker, Docker Compose, Kubernetes |

---

## Proje Yapısı

```
micro/
├── apps/
│   └── backend/
│       ├── prisma/
│       │   ├── schema.prisma        # Veritabanı şeması
│       │   └── migrations/          # Prisma migration dosyaları
│       ├── src/
│       │   ├── app.module.ts        # Kök uygulama modülü
│       │   ├── main.ts              # Uygulama giriş noktası
│       │   ├── common/
│       │   │   ├── audit/           # Denetim günlüğü (AuditLog)
│       │   │   ├── cache/           # Redis cache servisi
│       │   │   ├── concurrency/     # Optimistic locking ve kilit yönetimi
│       │   │   ├── decorators/      # Özel decorator'lar
│       │   │   ├── events/          # Domain event bus (BullMQ tabanlı)
│       │   │   ├── filters/         # Global hata filtreleri
│       │   │   ├── guards/          # Kimlik doğrulama guard'ları
│       │   │   ├── health/          # Sağlık kontrolü (/health)
│       │   │   ├── interceptors/    # İstek loglama, dönüştürme
│       │   │   ├── metrics/         # Prometheus metrikleri
│       │   │   ├── middleware/       # CSRF, sanitize middleware
│       │   │   ├── resilience/      # Circuit breaker, retry, timeout
│       │   │   ├── services/        # Logger, e-posta, güvenlik servisleri
│       │   │   └── telemetry/       # OpenTelemetry izleme
│       │   └── modules/
│       │       ├── admin/           # Yönetici paneli işlemleri
│       │       ├── auction/         # Müzayede yaşam döngüsü
│       │       ├── auth/            # Kimlik doğrulama ve yetkilendirme
│       │       ├── bid/             # Teklif verme motoru
│       │       ├── category/        # Kategori yönetimi
│       │       ├── fraud/           # Sahtekarlık tespiti servisleri
│       │       ├── listing/         # Taslak ilan yönetimi
│       │       ├── notification/    # Bildirimler ve WebSocket Gateway
│       │       ├── order/           # Sipariş yönetimi
│       │       ├── payment/         # Stripe ödeme ve escrow
│       │       └── user/            # Kullanıcı profili
│       └── test/
│           ├── auth.e2e-spec.ts
│           ├── bid.e2e-spec.ts
│           ├── auction.e2e-spec.ts
│           └── helpers.ts
├── packages/
│   ├── common/                      # Paylaşımlı temel sınıflar
│   ├── contracts/                   # Servisler arası DTO tanımları
│   ├── events/                      # Domain event arayüzleri
│   ├── logger/                      # Winston tabanlı loglama
│   ├── shared-types/                # Ortak tip ve enum tanımları
│   └── utils/                       # Yardımcı fonksiyonlar
├── k8s/                             # Kubernetes manifest dosyaları
├── load-tests/                      # k6 yük testi senaryoları
├── scripts/                         # DevOps betikleri
├── observability/                   # Prometheus, Grafana yapılandırmaları
├── docker-compose.dev.yml           # Geliştirme ortamı servisleri
└── docker-compose.yml               # Üretim ortamı servisleri
```

---

## Temel Özellikler

### Gerçek Zamanlı Teklif Motoru

Teklif verme süreci, yüksek eşzamanlılık koşullarında veri tutarlılığını koruyacak şekilde tasarlanmıştır:

- **Optimistic Locking:** Her `Auction` kaydı bir `version` alanı taşır. Eş zamanlı güncellemelerde versiyon uyuşmazlığı algılanarak HTTP 409 (Conflict) döner; bu sayede "kayıp güncelleme" (lost update) problemi önlenir.
- **Veritabanı İşlemi (Transaction):** Teklif kaydı, müzayede fiyatı güncellemesi ve önceki teklifin devre dışı bırakılması atomik bir `$transaction` bloğunda gerçekleşir.
- **Otomatik Teklif (Auto-bid):** Kullanıcılar maksimum teklif tutarı tanımlayabilir; sistem cron job'lar aracılığıyla otomatik teklif yarışmasını yönetir.
- **WebSocket Yayını:** Her başarılı teklif, ilgili müzayede odasındaki tüm istemcilere `bid:new` olayı olarak anlık iletilir.

### Bildirim Kuyruğu (BullMQ)

Teklif bildirimleri ve sistem bildirimleri artık doğrudan servis içinde işlenmez; Redis üzerinde çalışan **BullMQ kuyruğu** aracılığıyla asenkron olarak iletilir:

- Teklif geçildiğinde (`OUTBID`) önceki kazanana bildirim kuyruğa eklenir.
- Satıcıya yeni teklif bildirimi kuyruğa eklenir.
- `NotificationProcessor` worker'ı kuyruğu dinler, veritabanına bildirim yazar ve WebSocket üzerinden anlık iletim gerçekleştirir.
- Hata durumunda 3 kez üstel geri çekme (exponential backoff) ile yeniden deneme yapılır.

### Ödeme ve Escrow Sistemi

- Stripe ile kredi kartı ödemesi entegrasyonu.
- Ödeme tutarı, teslimat onayına kadar escrow (havuz) hesabında bekletilir.
- Stripe webhook olayları (`payment_intent.succeeded`, `charge.refunded`, `charge.dispute.created` vb.) otomatik işlenir.
- Yedi gün sonra tamamlanan escrow ödemeleri cron job ile otomatik serbest bırakılır.

### Sahtekarlık Tespiti

- Shill bidding (fiyat şişirme) tespiti için anlaşma örüntüsü analizi.
- Hız anormalliği ve bot davranışı tespiti.
- Şüpheli hesaplar IP geçmişi ve cihaz parmak izi ile ilişkilendirilir.
- Moderatör inceleme kuyruğu (ReviewQueue) ve kullanıcı itiraz (Appeal) mekanizması.

### Admin Paneli

- Kullanıcı banlama ve müzayede iptal işlemleri.
- Sahtekarlık olaylarını inceleme ve ceza uygulama.
- Sistem geneli metrik izleme.

### Gözlemlenebilirlik (Observability)

- **Prometheus:** Aktif bağlantı sayısı, istek süresi, hata oranı gibi metrikleri toplar.
- **Grafana:** Metrikleri görselleştirir.
- **OpenTelemetry / Jaeger:** Dağıtık istek izleme (distributed tracing) sağlar.
- **Yapılandırılmış Loglama:** Her istek, benzersiz `requestId` ile izlenebilir log kaydı bırakır.

---

## Güvenlik Katmanları

Uygulama birden fazla güvenlik katmanıyla korunmaktadır:

| Koruma | Açıklama |
|---|---|
| JWT (RS256) | Asimetrik anahtar çiftiyle imzalanan erişim tokenleri |
| Refresh Token | Güvenli HttpOnly cookie üzerinde dönen uzun ömürlü token |
| Rate Limiting | Throttler Guard ile istek başına bant genişliği koruması |
| CSRF Koruması | Durum değiştiren isteklere CSRF token doğrulaması |
| Helmet | Content-Security-Policy, HSTS, X-Frame-Options başlıkları |
| Giriş Kilitleme | 5 başarısız denemeden sonra hesap geçici olarak kilitlenir |
| Whitelist Doğrulama | Tüm gelen DTO'lar sınırlı alan listesiyle doğrulanır |
| Denetim Günlüğü | Kimlik doğrulama, teklif, ödeme olayları AuditLog tablosuna yazılır |
| Devre Kesici | Dış servislerde (Stripe, e-posta) hata eşiği aşılınca otomatik devre dışı bırakma |

---

## Veri Modeli

Sistemdeki temel varlıklar:

| Model | Açıklama |
|---|---|
| `User` | Kullanıcı hesabı; USER, SELLER, MODERATOR, ADMIN rolleri |
| `Auction` | Müzayede ilanı; DRAFT, PENDING, ACTIVE, ENDED, SOLD, CANCELLED durumları |
| `Bid` | Teklif kaydı; PLACED, OUTBID, WINNING, WON, CANCELLED durumları |
| `Payment` | Stripe ödeme kaydı; escrow durumu dahil |
| `Order` | Ödeme sonrası sipariş ve kargo takibi |
| `Notification` | Kullanıcı bildirimleri |
| `FraudEvent` | Sahtekarlık tespiti olayları |
| `AuditLog` | Sistem denetim günlüğü |
| `IdempotencyKey` | Çift ödeme önleme için idempotency anahtar kayıtları |

---

## Kurulum

### Gereksinimler

- Node.js 20 veya üzeri
- pnpm 8 veya üzeri
- Docker ve Docker Compose

### Adım Adım Kurulum

**1. Depoyu klonlayın ve bağımlılıkları yükleyin:**

```bash
git clone <repo-url>
cd micro
pnpm install
```

**2. Çevresel değişkenleri ayarlayın:**

```bash
cp .env.example apps/backend/.env
```

`.env` dosyasını açarak kendi değerlerinizi doldurun. (Bkz. [Çevresel Değişkenler](#çevresel-değişkenler))

**3. JWT sertifikalarını oluşturun:**

```bash
mkdir -p apps/backend/certs
openssl genrsa -out apps/backend/certs/jwt-private.pem 2048
openssl rsa -in apps/backend/certs/jwt-private.pem -pubout -out apps/backend/certs/jwt-public.pem
```

**4. Altyapı servislerini başlatın (PostgreSQL, Redis, Prometheus, Grafana):**

```bash
docker-compose -f docker-compose.dev.yml up -d
```

**5. Veritabanı şemasını oluşturun:**

```bash
cd apps/backend
pnpm run prisma:generate
pnpm run prisma:migrate
```

**6. Uygulamayı başlatın:**

```bash
pnpm run dev
```

Uygulama `http://localhost:3001` adresinde çalışmaya başlar.

---

## Çevresel Değişkenler

`apps/backend/.env` dosyasında aşağıdaki değişkenler tanımlanmalıdır:

```env
# Veritabanı
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/auction_platform?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"
REDIS_HOST=localhost
REDIS_PORT=6379

# Uygulama
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# JWT (RS256 sertifika yolları)
JWT_PRIVATE_KEY_PATH=./certs/jwt-private.pem
JWT_PUBLIC_KEY_PATH=./certs/jwt-public.pem
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=30d

# E-posta (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="AuctionHub <noreply@auctionhub.com>"

# Stripe (opsiyonel, ödeme testi için)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

---

## Veritabanı Yönetimi

```bash
# Prisma Client üret (şema değişikliklerinden sonra)
pnpm run prisma:generate

# Migration oluştur ve uygula
pnpm run prisma:migrate

# Veritabanını Prisma Studio ile görüntüle
pnpm run prisma:studio

# Örnek veri yükle
pnpm run prisma:seed
```

---

## Test

### Birim Testleri

Servis ve guard bileşenlerini veritabanı bağlantısı gerektirmeksizin test eder:

```bash
cd apps/backend
pnpm test
```

Kapsam raporu ile birlikte:

```bash
pnpm test:coverage
```

### Uçtan Uca (E2E) Testler

Gerçek bir veritabanı bağlantısı gerektirir. Çalıştırmadan önce test ortamı için PostgreSQL ve Redis servislerinin ayakta olduğundan emin olun:

```bash
cd apps/backend
pnpm test:e2e
```

Belirli bir test dosyasını çalıştırmak için:

```bash
pnpm test:e2e test/bid.e2e-spec.ts
pnpm test:e2e test/auth.e2e-spec.ts
```

### Yük Testleri (k6)

Sistemin yüksek trafikli senaryolardaki davranışını ölçer. `k6` aracının kurulu olması gerekmektedir:

```bash
# Müzayede listeleme yük testi
k6 run load-tests/auction-listing.js

# Eş zamanlı teklif seli testi
k6 run load-tests/bid-flood.js
```

---

## API Dokümantasyonu

Uygulama geliştirme modunda çalışırken Swagger arayüzüne erişebilirsiniz:

```
http://localhost:3001/api/docs
```

Swagger arayüzünde tüm endpoint'leri, istek / yanıt şemalarını ve kimlik doğrulama gereksinimlerini görebilirsiniz. Korunan endpoint'leri test etmek için önce `POST /api/v1/auth/login` ile token alın ve "Authorize" düğmesine tıklayarak Bearer token'ınızı girin.

### Temel Endpoint Grupları

| Grup | Açıklama |
|---|---|
| `POST /api/v1/auth/register` | Yeni kullanıcı kaydı |
| `POST /api/v1/auth/login` | Giriş ve token alma |
| `GET /api/v1/auctions` | Aktif müzayedeleri listele |
| `POST /api/v1/auctions` | Yeni müzayede oluştur (SELLER) |
| `POST /api/v1/bids` | Teklif ver |
| `GET /api/v1/auctions/:id/bids` | Müzayede teklif geçmişi |
| `POST /api/v1/payments` | Ödeme başlat |
| `GET /api/v1/notifications` | Bildirim listesi |
| `GET /api/v1/health` | Servis sağlık kontrolü |

---

## Dağıtım

### Docker ile Dağıtım

```bash
# Üretim imajı oluştur
docker build -t auctionhub-backend ./apps/backend

# Üretim servisleri başlat
docker-compose up -d
```

### Kubernetes ile Dağıtım

`k8s/` dizininde aşağıdaki manifest dosyaları bulunmaktadır:

- `deployment.yaml` — Backend uygulama dağıtımı
- `statefulset.yaml` — PostgreSQL ve Redis StatefulSet tanımları
- `ingress.yaml` — Nginx Ingress kuralları
- `hpa.yaml` — Yatay Pod Otomatik Ölçekleme (HPA) yapılandırması

```bash
kubectl apply -f k8s/
```

### CI/CD (GitHub Actions)

`.github/workflows/` dizinindeki pipeline dosyaları aşağıdakileri otomatik olarak gerçekleştirir:

1. Kod kalitesi kontrolü (ESLint, TypeScript derlemesi)
2. Birim testleri
3. Docker imajı oluşturma ve kayıt defterine gönderme
4. Kubernetes cluster'ına dağıtım (üretim ortamında)

---

## Mimari Kararlar

### Neden Modüler Monolit?

Mikroservis mimarisinin getirdiği ağ gecikmeleri, dağıtık işlem (distributed transaction) karmaşıklığı ve operasyonel yük göz önünde bulundurularak erken aşamada modüler monolit tercih edilmiştir. Her modül kendi içinde izole olduğundan, trafik gerektirdiğinde bağımsız mikroservislere bölmek mümkündür.

### Neden BullMQ?

Bildirim ve arka plan işlemlerinde bellek içi (in-memory) event bus yerine Redis tabanlı BullMQ tercih edilmiştir. BullMQ, uygulama yeniden başlatıldığında işlerin kaybolmamasını (persistence), başarısız işlerin otomatik yeniden denenmesini (retry) ve birden fazla worker ile yatay ölçeklenebilirliği sağlar.

### Neden Optimistic Locking?

Eş zamanlı teklif senaryolarında kötümser kilit (pessimistic locking / SELECT FOR UPDATE) uzun süre kilit tutabileceğinden teklif motorunu yavaşlatır. Versiyon tabanlı iyimser kilit (optimistic locking), çakışma nadiren gerçekleştiği varsayımıyla lock olmadan güncelleme yapar; çakışma durumunda HTTP 409 dönerek istemcinin yeniden denemesine olanak tanır.

### Neden RS256 JWT?

Simetrik HMAC (HS256) yerine asimetrik RS256 algoritması seçilmiştir. Özel anahtar yalnızca backend tarafında bulunur; kamuya açık anahtar ile herhangi bir servis token doğrulaması yapabilir. Bu yaklaşım ilerideki mikroservis mimarisine hazırlık açısından önemlidir.

---

## Lisans

Bu proje özel bir proje olup tüm hakları saklıdır.
