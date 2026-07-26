import { Injectable } from '@nestjs/common'
import { InjectMetric } from '@willsoto/nestjs-prometheus'
import { Counter, Histogram, Gauge } from 'prom-client'

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('http_requests_total') private readonly httpRequestsTotal: Counter<string>,
    @InjectMetric('http_request_duration_seconds') private readonly httpDuration: Histogram<string>,
    @InjectMetric('auction_bids_total') private readonly auctionBidsTotal: Counter<string>,
    @InjectMetric('active_auctions') private readonly activeAuctions: Gauge<string>,
    @InjectMetric('websocket_connections') private readonly wsConnections: Gauge<string>,
    @InjectMetric('payment_total_amount') private readonly paymentTotalAmount: Counter<string>,
  ) {}

  incHttpRequest(method: string, route: string, statusCode: number) {
    this.httpRequestsTotal.inc({ method, route, status_code: String(statusCode) })
  }

  observeHttpDuration(method: string, route: string, durationMs: number) {
    this.httpDuration.observe({ method, route }, durationMs / 1000)
  }

  incBid(auctionId: string) {
    this.auctionBidsTotal.inc({ auction_id: auctionId })
  }

  setActiveAuctions(count: number) {
    this.activeAuctions.set(count)
  }

  setWsConnections(count: number) {
    this.wsConnections.set(count)
  }

  incPayment(amount: number, currency = 'USD') {
    this.paymentTotalAmount.inc({ currency }, amount)
  }
}
