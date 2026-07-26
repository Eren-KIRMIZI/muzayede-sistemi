import { Controller, Get } from '@nestjs/common'
import { HealthCheckService, HealthCheck, MemoryHealthIndicator } from '@nestjs/terminus'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { PrismaHealthIndicator } from './prisma-health.indicator'

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Health status' })
  check() {
    return this.health.check([
      () => this.prismaHealth.isHealthy('database'),
      () => this.memory.checkRSS('memory_rss', 200 * 1024 * 1024),
    ])
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  alive() {
    return { status: 'ok', timestamp: new Date().toISOString() }
  }

  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  ready() {
    return this.health.check([
      () => this.prismaHealth.isHealthy('database'),
    ])
  }
}
