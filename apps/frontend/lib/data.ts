import type { AuctionCategory } from './types'

export { formatCurrency } from './utils'

export const categories: (Pick<AuctionCategory, 'name' | 'slug'> & { count: number; accent: string })[] = [
  { name: 'Elektronik', slug: 'electronics', count: 0, accent: 'brand' },
  { name: 'Araçlar', slug: 'vehicles', count: 0, accent: 'emerald' },
  { name: 'Saatler', slug: 'watches', count: 0, accent: 'bid' },
  { name: 'Sanat', slug: 'art', count: 0, accent: 'blue' },
  { name: 'Moda', slug: 'fashion', count: 0, accent: 'pink' },
  { name: 'Ev & Yaşam', slug: 'home', count: 0, accent: 'emerald' },
  { name: 'Spor', slug: 'sports', count: 0, accent: 'bid' },
  { name: 'Mücevher', slug: 'jewelry', count: 0, accent: 'blue' },
  { name: 'Koleksiyon', slug: 'collectibles', count: 0, accent: 'brand' },
  { name: 'Müzik', slug: 'music', count: 0, accent: 'blue' },
]

export const stats = [
  { label: 'Gerçek zamanlı teklif güncellemeleri', value: 'Canlı', delta: 'WebSocket' },
  { label: 'Tipik teklif gecikmesi', value: '<40ms', delta: 'Küresel' },
  { label: 'Emanet koruması', value: '%100', delta: 'Her ödeme' },
  { label: 'Çalışma süresi SLA', value: '%99.99', delta: 'Kurumsal' },
]

export const testimonials = [
  {
    quote:
      'Gerçek zamanlı teklif akışı anlık. Tüm koleksiyon envanterimizi AuctionHub\'a listeledik ve ödeme süreleri dramatik şekilde düştü.',
    name: 'Sarah Chen',
    role: 'Galeri Sahibi',
  },
  {
    quote:
      'Otomatik teklif ve websocket katmanı kusuz hissettiriyor. Gecikme nedeniyle hiçbir lotu kaçırmadım — platform gerçekten güvenilir.',
    name: 'Marcus Rivera',
    role: 'Özel Koleksiyoncu',
  },
  {
    quote:
      'Mikroservis mimarisi trafik artışlarını zahmetsizce işliyor. Son satışımızda sistem ağır yük altında mükemmel şekilde yanıt verdi.',
    name: 'James Nakamura',
    role: 'Çevrimiçi Satıcı',
  },
]

export const faqs = [
  {
    q: 'Gerçek zamanlı teklif verme nasıl çalışır?',
    a: 'Her teklif, kalıcı bir websocket bağlantısı üzerinden özel bir Teklif Hizmeti aracılığıyla iletilir. Rakip teklifleri anında görürsünüz — tipik olarak 40 milisaniye içinde küresel olarak.',
  },
  {
    q: 'Otomatik teklif nedir?',
    a: 'Maksimum bir tutar belirleyin, AuctionHub sizi lider tutmak için gereken en küçük artışı otomatik olarak yerleştirir. Saati izlemeden kontrol altında kalırsınız.',
  },
  {
    q: 'Ödemeler nasıl hesaplanır?',
    a: 'Kazanan teklifler Ödeme Hizmeti\'ni tetikler ve öğenin gönderildiği onaylanana kadar fonları emanette tutar. Kart, banka havalesi ve cüzdan bakiyesi desteklenir.',
  },
  {
    q: 'AuctionHub mikroservisler üzerine mi kuruldu?',
    a: 'Evet. Kullanıcı, Müzayede, Teklif, Ödeme, Bildirim ve Envanter hizmetleri, API Ağ Geçidi arkasında Kafka ve RabbitMQ üzerinden iletişim kurar; Redis önbellekleme ve PostgreSQL kalıcılığı ile.',
  },
  {
    q: 'AuctionHub üzerinde özel bir müzayede evi çalıştırabilir miyim?',
    a: 'Kesinlikle. Kurumsal planımız size özel kiracı, özel marka ve SLA destekli çalışma süresi ile tam yönetici gözlemlenebilirliği sunar.',
  },
]

export const services = [
  { id: 'gateway', name: 'API Gateway', status: 'healthy', latency: 12, uptime: 99.99, rps: 48200, kind: 'edge' },
  { id: 'user', name: 'User Service', status: 'healthy', latency: 24, uptime: 99.98, rps: 9100, kind: 'core' },
  { id: 'auction', name: 'Auction Service', status: 'healthy', latency: 31, uptime: 99.97, rps: 15400, kind: 'core' },
  { id: 'bid', name: 'Bid Service', status: 'degraded', latency: 88, uptime: 99.82, rps: 61200, kind: 'core' },
  { id: 'payment', name: 'Payment Service', status: 'healthy', latency: 42, uptime: 99.99, rps: 3200, kind: 'core' },
  { id: 'notification', name: 'Notification Service', status: 'healthy', latency: 18, uptime: 99.95, rps: 22800, kind: 'core' },
  { id: 'inventory', name: 'Inventory Service', status: 'healthy', latency: 27, uptime: 99.96, rps: 5400, kind: 'core' },
  { id: 'redis', name: 'Redis Cache', status: 'healthy', latency: 3, uptime: 100, rps: 128000, kind: 'infra' },
  { id: 'rabbitmq', name: 'RabbitMQ', status: 'healthy', latency: 9, uptime: 99.99, rps: 41000, kind: 'infra' },
  { id: 'kafka', name: 'Kafka Event Queue', status: 'healthy', latency: 14, uptime: 99.98, rps: 96000, kind: 'infra' },
  { id: 'postgres', name: 'PostgreSQL', status: 'healthy', latency: 21, uptime: 99.99, rps: 34000, kind: 'infra' },
] as const
