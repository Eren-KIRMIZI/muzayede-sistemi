import { Module } from '@nestjs/common'
import {
  PrometheusModule,
  makeCounterProvider,
  makeHistogramProvider,
  makeGaugeProvider,
} from '@willsoto/nestjs-prometheus'
import { MetricsService } from './metrics.service'

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: { enabled: true },
      path: '/metrics',
    }),
  ],
  providers: [
    MetricsService,

    // HTTP metrics
    makeCounterProvider({
      name: 'http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    }),
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    }),

    // Auction metrics
    makeCounterProvider({
      name: 'auction_bids_total',
      help: 'Total bids placed',
      labelNames: ['auction_id'],
    }),
    makeGaugeProvider({
      name: 'active_auctions',
      help: 'Number of currently active auctions',
    }),

    // WebSocket metrics
    makeGaugeProvider({
      name: 'websocket_connections',
      help: 'Number of active WebSocket connections',
    }),

    // Payment metrics
    makeCounterProvider({
      name: 'payment_total_amount',
      help: 'Total payment amount processed',
      labelNames: ['currency'],
    }),
  ],
  exports: [MetricsService],
})
export class MetricsModule {}
