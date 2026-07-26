import http from 'k6/http'
import { check, sleep } from 'k6'
import { Counter, Rate, Trend } from 'k6/metrics'

const bidSuccess = new Counter('bid_success')
const bidFail = new Counter('bid_fail')
const bidDuration = new Trend('bid_duration')

export const options = {
  scenarios: {
    bidders: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '2m', target: 20 },
        { duration: '30s', target: 50 },
        { duration: '2m', target: 50 },
        { duration: '1m', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    bid_success: ['count>10'],
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001/api/v1'

const users = []
let auctionId = ''

export function setup() {
  // Register multiple test users
  for (let i = 0; i < 5; i++) {
    const res = http.post(
      `${BASE_URL}/auth/register`,
      JSON.stringify({
        email: `bidtest${i}@example.com`,
        password: 'BidTest123!',
        firstName: `Bidder${i}`,
        lastName: 'Test',
      }),
      { headers: { 'Content-Type': 'application/json' } },
    )
    if (res.status === 201 || res.status === 409) {
      const loginRes = http.post(
        `${BASE_URL}/auth/login`,
        JSON.stringify({ email: `bidtest${i}@example.com`, password: 'BidTest123!' }),
        { headers: { 'Content-Type': 'application/json' } },
      )
      if (loginRes.status === 200) {
        try {
          const body = JSON.parse(loginRes.body)
          users.push(body.accessToken)
        } catch { /* skip */ }
      }
    }
  }

  // Find an active auction
  const auctionRes = http.get(`${BASE_URL}/auctions?page=1&limit=1&status=ACTIVE`)
  if (auctionRes.status === 200) {
    try {
      const data = JSON.parse(auctionRes.body).data
      if (data?.length > 0) auctionId = data[0].id
    } catch { /* skip */ }
  }

  return { users, auctionId }
}

export default function (data) {
  if (!data.auctionId || data.users.length === 0) return

  const userIdx = __VU % data.users.length
  const token = data.users[userIdx]
  if (!token) return

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }

  const auctionRes = http.get(`${BASE_URL}/auctions/${data.auctionId}`, { headers })
  check(auctionRes, { 'get auction 200': (r) => r.status === 200 })

  if (auctionRes.status === 200) {
    try {
      const auction = JSON.parse(auctionRes.body)
      const currentPrice = auction.currentPrice || auction.startingPrice
      const bidIncrement = auction.bidIncrement || 10
      const bidAmount = currentPrice + bidIncrement + Math.floor(Math.random() * 50)

      const start = Date.now()
      const bidRes = http.post(
        `${BASE_URL}/bids/${data.auctionId}`,
        JSON.stringify({ amount: bidAmount }),
        { headers },
      )
      bidDuration.add(Date.now() - start)

      if (bidRes.status === 201) {
        bidSuccess.add(1)
        check(bidRes, { 'bid placed successfully': (r) => r.status === 201 })
      } else {
        bidFail.add(1)
      }
    } catch { /* skip */ }
  }

  sleep(Math.random() * 2 + 1)
}
