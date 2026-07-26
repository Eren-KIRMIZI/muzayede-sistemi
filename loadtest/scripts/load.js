import http from 'k6/http'
import { check, sleep } from 'k6'
import { Counter, Rate, Trend } from 'k6/metrics'

const apiErrors = new Counter('api_errors')
const successRate = new Rate('success_rate')
const auctionDuration = new Trend('auction_fetch_duration')

export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '3m', target: 100 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.05'],
    success_rate: ['rate>0.95'],
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001/api/v1'
let authToken = ''

function getAuthToken() {
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: 'loadtest@example.com', password: 'LoadTest123!' }),
    { headers: { 'Content-Type': 'application/json' } },
  )
  if (loginRes.status === 200) {
    const body = JSON.parse(loginRes.body)
    return body.accessToken || ''
  }
  return ''
}

export function setup() {
  authToken = getAuthToken()
  return { token: authToken }
}

export default function (data) {
  const headers = { 'Content-Type': 'application/json' }
  if (data.token) {
    headers['Authorization'] = `Bearer ${data.token}`
  }

  // Browse auctions (high frequency, read-heavy)
  const auctionsRes = http.get(`${BASE_URL}/auctions?page=1&limit=20`, { headers })
  check(auctionsRes, {
    'auctions list status 200': (r) => r.status === 200,
    'auctions list has data': (r) => {
      try { return JSON.parse(r.body).data?.length > 0 } catch { return false }
    },
  })
  auctionDuration.add(auctionsRes.timings.duration)
  successRate.add(auctionsRes.status === 200)
  if (auctionsRes.status !== 200) apiErrors.add(1)

  sleep(0.5)

  // View single auction
  if (auctionsRes.status === 200) {
    try {
      const auctions = JSON.parse(auctionsRes.body).data
      if (auctions?.length > 0) {
        const auctionId = auctions[0].id
        const detailRes = http.get(`${BASE_URL}/auctions/${auctionId}`, { headers })
        check(detailRes, {
          'auction detail status 200': (r) => r.status === 200,
        })
        successRate.add(detailRes.status === 200)
        if (detailRes.status !== 200) apiErrors.add(1)

        sleep(0.3)

        // Check bid summary
        const bidSummaryRes = http.get(`${BASE_URL}/bids/auction/${auctionId}/summary`, { headers })
        successRate.add(bidSummaryRes.status === 200)
      }
    } catch { /* ignore parse errors */ }
  }

  sleep(0.5)

  // Browse categories
  const catsRes = http.get(`${BASE_URL}/categories`, { headers })
  check(catsRes, { 'categories status 200': (r) => r.status === 200 })
  successRate.add(catsRes.status === 200)

  sleep(0.3)

  // Featured auctions
  const featuredRes = http.get(`${BASE_URL}/auctions/featured`, { headers })
  successRate.add(featuredRes.status === 200)

  sleep(1)
}

export function teardown(data) {
  if (data.token) {
    http.post(
      `${BASE_URL}/auth/logout`,
      JSON.stringify({ refreshToken: 'cleanup' }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  }
}
