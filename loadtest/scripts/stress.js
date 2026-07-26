import http from 'k6/http'
import { check, sleep } from 'k6'
import { Counter, Rate } from 'k6/metrics'

const errors = new Counter('stress_errors')
const successRate = new Rate('stress_success')

export const options = {
  stages: [
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 500 },
    { duration: '5m', target: 500 },
    { duration: '3m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000', 'p(99)<5000'],
    http_req_failed: ['rate<0.10'],
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001/api/v1'

export default function () {
  const headers = { 'Content-Type': 'application/json' }

  const endpoints = [
    { path: '/health/live', name: 'health' },
    { path: '/categories', name: 'categories' },
    { path: '/auctions?page=1&limit=10', name: 'auctions-list' },
    { path: '/auctions?sort=ending_soon', name: 'ending-soon' },
    { path: '/auctions?sort=price_high', name: 'price-high' },
  ]

  const ep = endpoints[Math.floor(Math.random() * endpoints.length)]
  const res = http.get(`${BASE_URL}${ep.path}`, { headers })

  const ok = res.status === 200
  successRate.add(ok)
  if (!ok) errors.add(1)

  check(res, {
    [`${ep.name} status 200`]: (r) => r.status === 200,
    [`${ep.name} response < 2s`]: (r) => r.timings.duration < 2000,
  })

  sleep(Math.random() * 2 + 0.5)
}
