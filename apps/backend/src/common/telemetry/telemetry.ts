/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * OpenTelemetry distributed tracing bootstrap.
 * Must be imported BEFORE any other module (top of main.ts).
 *
 * To activate, add to main.ts:
 *   import './common/telemetry/telemetry'
 *
 * Required env vars:
 *   OTEL_SERVICE_NAME      — e.g. "auction-backend"
 *   OTEL_EXPORTER_ENDPOINT — e.g. "http://localhost:4318"  (Jaeger OTLP HTTP)
 *   OTEL_ENABLED           — "true" to enable (disabled by default in dev)
 */

// Only activate if explicitly enabled to avoid dev startup overhead
if (process.env.OTEL_ENABLED === 'true') {
  // Dynamic imports so the module is tree-shakeable when disabled
  const { NodeSDK } = require('@opentelemetry/sdk-node')
  const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http')
  const { Resource } = require('@opentelemetry/resources')
  const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions')
  const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http')
  const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express')
  const { NestInstrumentation } = require('@opentelemetry/instrumentation-nestjs-core')

  const exporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_ENDPOINT ?? 'http://localhost:4318/v1/traces',
  })

  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]:
        process.env.OTEL_SERVICE_NAME ?? 'auction-backend',
      [SemanticResourceAttributes.SERVICE_VERSION]:
        process.env.npm_package_version ?? '0.1.0',
      ['deployment.environment']: process.env.NODE_ENV ?? 'development',
    }),
    traceExporter: exporter,
    instrumentations: [
      new HttpInstrumentation({
        ignoreIncomingRequestHook: (req: any) => req.url === '/health' || req.url === '/metrics',
      }),
      new ExpressInstrumentation(),
      new NestInstrumentation(),
    ],
  })

  sdk.start()
  console.log('[OTel] Distributed tracing enabled → Jaeger at', process.env.OTEL_EXPORTER_ENDPOINT)

  process.on('SIGTERM', () => {
    sdk.shutdown().finally(() => process.exit(0))
  })
}
