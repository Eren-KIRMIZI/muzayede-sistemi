import type { AuctionCategory } from './types'

export { formatCurrency } from './utils'

export const categories: (Pick<AuctionCategory, 'name' | 'slug'> & { count: number; accent: string })[] = [
  { name: 'Watches', slug: 'watches', count: 1240, accent: 'brand' },
  { name: 'Sneakers', slug: 'sneakers', count: 3180, accent: 'bid' },
  { name: 'Fine Art', slug: 'fine-art', count: 890, accent: 'blue' },
  { name: 'Automobiles', slug: 'automobiles', count: 420, accent: 'emerald' },
  { name: 'Cameras', slug: 'cameras', count: 760, accent: 'blue' },
  { name: 'Instruments', slug: 'instruments', count: 540, accent: 'brand' },
]

export const stats = [
  { label: 'Live auctions running', value: '2,481', delta: '+12.4%' },
  { label: 'Bids placed today', value: '184K', delta: '+8.1%' },
  { label: 'Total value settled', value: '$92.7M', delta: '+21.5%' },
  { label: 'Avg. settlement latency', value: '38ms', delta: '-6.2%' },
]

export const testimonials = [
  {
    quote:
      'The real-time bid feed is instant. We migrated our entire collectibles house to AuctionHub and settlement times dropped by 60%.',
    name: 'Elena Marsh',
    role: 'Director, Meridian Gallery',
  },
  {
    quote:
      'Auto-bidding and the websocket layer feel like magic. I have never lost a lot to lag again — it is genuinely enterprise-grade.',
    name: 'David Okoye',
    role: 'Collector & Reseller',
  },
  {
    quote:
      'The microservices architecture means we scale to 40k concurrent bidders during drops without breaking a sweat.',
    name: 'Priya Nandakumar',
    role: 'CTO, GridSole',
  },
]

export const faqs = [
  {
    q: 'How does real-time bidding work?',
    a: 'Every bid is pushed through a dedicated Bid Service over a persistent websocket connection. You see competing bids the instant they land — typically within 40 milliseconds globally.',
  },
  {
    q: 'What is auto-bidding?',
    a: 'Set a maximum amount and AuctionHub will automatically place the smallest increment needed to keep you in the lead, up to your ceiling. You stay in control without watching the clock.',
  },
  {
    q: 'How are payments settled?',
    a: 'Winning bids trigger the Payment Service, which holds funds in escrow until the item is confirmed shipped. We support cards, bank transfer, and wallet balance.',
  },
  {
    q: 'Is AuctionHub built on microservices?',
    a: 'Yes. User, Auction, Bid, Payment, Notification, and Inventory services communicate through Kafka and RabbitMQ behind an API Gateway, with Redis caching and PostgreSQL persistence.',
  },
  {
    q: 'Can I run a private auction house on AuctionHub?',
    a: 'Absolutely. Our Enterprise plan gives you a dedicated tenant, custom branding, and SLA-backed uptime with full admin observability.',
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
