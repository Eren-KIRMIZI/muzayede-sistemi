import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CacheService } from '../../common/cache/cache.service'

interface BidEvent {
  userId: string
  auctionId: string
  timestamp: number
  ip: string
  userAgent: string
  fingerprint: string
  responseTimeMs: number
}

interface BehaviorProfile {
  userId: string
  avgResponseTime: number
  stddevResponseTime: number
  avgThinkingTime: number
  bidRegularityScore: number
  nightBidRatio: number
  botScore: number
}

@Injectable()
export class BotDetectionService {
  private readonly logger = new Logger(BotDetectionService.name)

  private static readonly SUSPICIOUS_USER_AGENTS = [
    /python-requests/i, /python-urllib/i, /scrapy/i, /selenium/i,
    /puppeteer/i, /headless/i, /phantomjs/i, /curl\//i, /wget\//i,
    /go-http-client/i, /java\//i, /okhttp/i, /node-fetch/i, /axios\//i,
  ]

  private static readonly KNOWN_BOT_USER_AGENTS = [
    /googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i, /baiduspider/i,
  ]

  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  analyzeUserAgent(userAgent: string): {
    isBot: boolean; isSuspicious: boolean
    matchedPattern: string | null; riskContribution: number
  } {
    if (!userAgent || userAgent.length < 20) {
      return {
        isBot: false, isSuspicious: true,
        matchedPattern: 'missing_or_short_ua', riskContribution: 0.3,
      }
    }

    for (const pattern of BotDetectionService.KNOWN_BOT_USER_AGENTS) {
      if (pattern.test(userAgent)) {
        return { isBot: true, isSuspicious: false, matchedPattern: pattern.source, riskContribution: 1.0 }
      }
    }

    for (const pattern of BotDetectionService.SUSPICIOUS_USER_AGENTS) {
      if (pattern.test(userAgent)) {
        return { isBot: false, isSuspicious: true, matchedPattern: pattern.source, riskContribution: 0.7 }
      }
    }

    return { isBot: false, isSuspicious: false, matchedPattern: null, riskContribution: 0 }
  }

  async analyzeRegularity(userId: string): Promise<number> {
    const bids = await this.prisma.bid.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 50,
      select: { createdAt: true },
    })

    if (bids.length < 5) return 0

    const intervals: number[] = []
    for (let i = 1; i < bids.length; i++) {
      intervals.push(bids[i].createdAt.getTime() - bids[i - 1].createdAt.getTime())
    }

    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intervals.length
    const stddev = Math.sqrt(variance)
    const cv = mean === 0 ? 0 : stddev / mean

    if (cv < 0.1) return 0.9
    if (cv < 0.2) return 0.6
    if (cv < 0.3) return 0.3
    return 0
  }

  async analyzeThinkingTime(userId: string): Promise<{
    avgThinkingTime: number; isSuspicious: boolean; riskContribution: number
  }> {
    const bids = await this.prisma.bid.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 30,
      select: { createdAt: true },
    })

    if (bids.length < 5) {
      return { avgThinkingTime: 0, isSuspicious: false, riskContribution: 0 }
    }

    const times = bids.map((b) => b.createdAt.getTime())
    const thinkingTimes: number[] = []
    for (let i = 1; i < times.length; i++) {
      thinkingTimes.push(times[i] - times[i - 1])
    }

    const avg = thinkingTimes.reduce((a, b) => a + b, 0) / thinkingTimes.length
    const stddev = Math.sqrt(
      thinkingTimes.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / thinkingTimes.length,
    )

    let riskContribution = 0
    if (avg < 500 && stddev < 100) riskContribution = 0.8
    else if (avg < 1000 && stddev < 200) riskContribution = 0.5
    else if (avg < 2000 && stddev < 300) riskContribution = 0.2

    return { avgThinkingTime: avg, isSuspicious: riskContribution > 0.4, riskContribution }
  }

  async calculateBotScore(events: BidEvent[]): Promise<BehaviorProfile> {
    const userId = events[0]?.userId
    if (!userId) throw new Error('No events provided')

    const uaResults = events.map((e) => this.analyzeUserAgent(e.userAgent))
    const suspiciousUARatio =
      uaResults.filter((r) => r.isSuspicious || r.isBot).length / uaResults.length

    const responseTimes = events.map((e) => e.responseTimeMs)
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    const rtVariance =
      responseTimes.reduce((s, v) => s + Math.pow(v - avgResponseTime, 2), 0) / responseTimes.length
    const stddevResponseTime = Math.sqrt(rtVariance)

    const regularityScore = await this.analyzeRegularity(userId)
    const thinkingAnalysis = await this.analyzeThinkingTime(userId)

    const nightBids = events.filter((e) => {
      const hour = new Date(e.timestamp).getHours()
      return hour >= 1 && hour <= 5
    }).length
    const nightBidRatio = nightBids / events.length

    const weights = {
      uaRisk: 0.2, regularity: 0.25, thinkingTime: 0.25,
      nightBid: 0.1, responseTimeRegularity: 0.2,
    }

    const rtRegularityScore =
      avgResponseTime > 0
        ? Math.min(1, (1 / (stddevResponseTime / avgResponseTime + 0.01)) * 0.3)
        : 0

    const botScore = Math.min(
      weights.uaRisk * suspiciousUARatio +
      weights.regularity * regularityScore +
      weights.thinkingTime * thinkingAnalysis.riskContribution +
      weights.nightBid * nightBidRatio +
      weights.responseTimeRegularity * rtRegularityScore,
      1.0,
    )

    const profile: BehaviorProfile = {
      userId, avgResponseTime, stddevResponseTime,
      avgThinkingTime: thinkingAnalysis.avgThinkingTime,
      bidRegularityScore: regularityScore,
      nightBidRatio, botScore,
    }

    await this.cache.set(`bot:profile:${userId}`, profile, 7 * 24 * 3600)
    return profile
  }
}
