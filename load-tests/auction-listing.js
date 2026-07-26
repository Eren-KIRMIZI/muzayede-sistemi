/**
 * k6 Load Test — Auction Listing API
 * 
 * Simulates 200 virtual users browsing auction listings concurrently.
 * Tests: pagination, category filtering, search query params.
 * 
 * Run: k6 run load-tests/auction-listing.js --env BASE_URL=http://localhost:3001/api/v1
 */
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Counter, Rate, Trend } from 'k6/metrics'

// ── Custom Metrics ─────────────────────────────────────────────────────────────
const auctionListErrors = new Counter('auction_list_errors')
const auctionListSuccessRate = new Rate('auction_list_success_rate')
const auctionListDuration = new Trend('auction_list_duration', true)

// ── Configuration ──────────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001/api/v1'

export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up to 20 VUs
    { duration: '1m', target: 100 },   // Scale to 100 VUs
    { duration: '2m', target: 200 },   // Peak: 200 VUs
    { duration: '1m', target: 100 },   // Scale down
    { duration: '30s', target: 0 },    // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],   // 95% under 500ms
    http_req_failed: ['rate<0.01'],                    // Less than 1% error rate
    auction_list_success_rate: ['rate>0.99'],
  },
}

const CATEGORY_IDS = [
  'electronics',
  'vehicles',
  'collectibles',
  'fashion',
  'art',
]

const SORT_OPTIONS = ['createdAt', 'currentPrice', 'endsAt', 'bidCount']
const SORT_ORDERS = ['asc', 'desc']

export default function () {
  const page = Math.floor(Math.random() * 5) + 1
  const limit = [10, 20, 50][Math.floor(Math.random() * 3)]
  const sortBy = SORT_OPTIONS[Math.floor(Math.random() * SORT_OPTIONS.length)]
  const sortOrder = SORT_ORDERS[Math.floor(Math.random() * SORT_ORDERS.length)]

  // Scenario 1: Basic listing (60% of requests)
  if (Math.random() < 0.6) {
    const url = `${BASE_URL}/auctions?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`
    const res = http.get(url, {
      tags: { scenario: 'basic_list' },
    })

    const ok = check(res, {
      'listing: status 200': (r) => r.status === 200,
      'listing: has data array': (r) => {
        const body = JSON.parse(r.body)
        return Array.isArray(body.data)
      },
      'listing: response time < 500ms': (r) => r.timings.duration < 500,
    })

    auctionListSuccessRate.add(ok)
    auctionListDuration.add(res.timings.duration)
    if (!ok) auctionListErrors.add(1)

  // Scenario 2: Category filtered listing (25% of requests)
  } else if (Math.random() < 0.85) {
    const category = CATEGORY_IDS[Math.floor(Math.random() * CATEGORY_IDS.length)]
    const url = `${BASE_URL}/auctions?categoryId=${category}&page=${page}&limit=${limit}`
    const res = http.get(url, {
      tags: { scenario: 'category_filter' },
    })

    const ok = check(res, {
      'category: status 200': (r) => r.status === 200,
      'category: response time < 600ms': (r) => r.timings.duration < 600,
    })
    auctionListSuccessRate.add(ok)
    auctionListDuration.add(res.timings.duration)

  // Scenario 3: Search query (15% of requests)
  } else {
    const queries = ['iPhone', 'watch', 'vintage', 'rare', 'limited', 'gold']
    const q = queries[Math.floor(Math.random() * queries.length)]
    const url = `${BASE_URL}/auctions?q=${encodeURIComponent(q)}&page=1&limit=20`
    const res = http.get(url, {
      tags: { scenario: 'search' },
    })

    const ok = check(res, {
      'search: status 200': (r) => r.status === 200,
      'search: response time < 800ms': (r) => r.timings.duration < 800,
    })
    auctionListSuccessRate.add(ok)
  }

  sleep(Math.random() * 2 + 0.5) // Think time: 0.5–2.5s
}

export function handleSummary(data) {
  return {
    'load-tests/results/auction-listing-summary.json': JSON.stringify(data, null, 2),
  }
}
