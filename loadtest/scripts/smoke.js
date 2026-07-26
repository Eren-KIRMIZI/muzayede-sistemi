import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001/api/v1'

export default function () {
  const healthRes = http.get(`${BASE_URL}/health/live`)
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
  })

  const catsRes = http.get(`${BASE_URL}/categories`)
  check(catsRes, {
    'categories status is 200': (r) => r.status === 200,
  })

  const auctionsRes = http.get(`${BASE_URL}/auctions?page=1&limit=10`)
  check(auctionsRes, {
    'auctions status is 200': (r) => r.status === 200,
  })

  sleep(1)
}
