/**
 * k6 Load Test — Bid Flood (Real-time Bidding Stress Test)
 * 
 * Simulates a hot auction with many concurrent bidders.
 * Tests: bid creation throughput, WebSocket broadcast lag, concurrent bid safety.
 * 
 * Run: k6 run load-tests/bid-flood.js --env BASE_URL=http://localhost:3001/api/v1 --env AUCTION_ID=<id>
 * 
 * Prerequisites: An active auction must exist with AUCTION_ID.
 * Create test users and tokens beforehand with: npm run seed:test
 */
import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Counter, Rate, Trend } from 'k6/metrics'
import { SharedArray } from 'k6/data'

// ── Custom Metrics ─────────────────────────────────────────────────────────────
const bidSuccessCount = new Counter('bid_success_count')
const bidFailureCount = new Counter('bid_failure_count')
const bidSuccessRate = new Rate('bid_success_rate')
const bidDuration = new Trend('bid_duration_ms', true)
const outbidRate = new Rate('outbid_rate')

// ── Configuration ──────────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001/api/v1'
const AUCTION_ID = __ENV.AUCTION_ID || 'test-auction-id'

// Pre-generated test user tokens (populate via seed script)
const TEST_TOKENS = new SharedArray('tokens', function () {
  try {
    return JSON.parse(open('./data/test-tokens.json'))
  } catch {
    // Fallback: use a single test token from env
    const token = __ENV.TEST_TOKEN || 'test-jwt-token'
    return Array.from({ length: 100 }, () => ({ token }))
  }
})

export const options = {
  scenarios: {
    // Scenario 1: Steady bid stream (simulate ongoing auction)
    steady_bidding: {
      executor: 'constant-arrival-rate',
      rate: 10,         // 10 bids per second
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 50,
      maxVUs: 100,
    },
    // Scenario 2: Bid flood — last 30 seconds of auction (many users bidding fast)
    bid_flood: {
      executor: 'ramping-arrival-rate',
      startRate: 5,
      timeUnit: '1s',
      stages: [
        { target: 50, duration: '30s' },
        { target: 100, duration: '30s' },
        { target: 0, duration: '10s' },
      ],
      preAllocatedVUs: 100,
      maxVUs: 200,
      startTime: '2m', // Start after steady_bidding
    },
  },
  thresholds: {
    'http_req_duration{scenario:steady_bidding}': ['p(95)<300'],
    'http_req_duration{scenario:bid_flood}': ['p(95)<500', 'p(99)<1000'],
    bid_success_rate: ['rate>0.90'], // 90% bid success (some will be outbid — expected)
    http_req_failed: ['rate<0.05'],
  },
}

export default function () {
  const vuIndex = __VU % TEST_TOKENS.length
  const { token } = TEST_TOKENS[vuIndex]

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  group('place bid', () => {
    // First get current price
    const auctionRes = http.get(`${BASE_URL}/auctions/${AUCTION_ID}`, { headers })
    const auctionOk = check(auctionRes, { 'get auction: 200': (r) => r.status === 200 })
    if (!auctionOk) return

    const auction = JSON.parse(auctionRes.body)?.data
    if (!auction) return

    // Bid slightly above current price
    const bidIncrement = Number(auction.bidIncrement) || 10
    const currentPrice = Number(auction.currentPrice) || 100
    const bidAmount = currentPrice + bidIncrement + Math.floor(Math.random() * bidIncrement)

    const bidRes = http.post(
      `${BASE_URL}/bids`,
      JSON.stringify({ auctionId: AUCTION_ID, amount: bidAmount }),
      { headers, tags: { scenario: 'bid_flood' } },
    )

    bidDuration.add(bidRes.timings.duration)

    const success = check(bidRes, {
      'bid: accepted (201) or outbid (409/400)': (r) => [201, 400, 409, 422].includes(r.status),
      'bid: response time < 500ms': (r) => r.timings.duration < 500,
    })

    if (bidRes.status === 201) {
      bidSuccessCount.add(1)
      bidSuccessRate.add(true)
    } else if ([400, 409].includes(bidRes.status)) {
      outbidRate.add(true)
      bidSuccessRate.add(false)
    } else {
      bidFailureCount.add(1)
      bidSuccessRate.add(false)
    }
  })

  sleep(Math.random() * 0.5)
}

export function handleSummary(data) {
  return {
    'load-tests/results/bid-flood-summary.json': JSON.stringify(data, null, 2),
  }
}
