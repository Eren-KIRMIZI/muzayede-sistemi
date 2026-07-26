import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CacheService } from '../../common/cache/cache.service'

interface IPMatchResult {
  isMatch: boolean
  confidence: number
  matchedIPs: string[]
  matchType: 'exact' | 'subnet' | 'asn'
}

@Injectable()
export class ShillBiddingService {
  private readonly logger = new Logger(ShillBiddingService.name)
  private readonly SUBNET_PREFIX_V4 = 24
  private readonly SUBNET_PREFIX_V6 = 48

  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async checkIPCorrelation(
    auctionId: string,
    sellerId: string,
    bidderId: string,
    bidderIP: string,
  ): Promise<IPMatchResult> {
    const cacheKey = `shill:ip:${sellerId}:${bidderIP}`
    const cached = await this.cache.get<IPMatchResult>(cacheKey)
    if (cached) return cached

    const sellerIPs = await this.prisma.userIpHistory.findMany({
      where: {
        userId: sellerId,
        createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      },
      select: { ipAddress: true },
    })

    const result: IPMatchResult = {
      isMatch: false, confidence: 0, matchedIPs: [], matchType: 'exact',
    }

    for (const { ipAddress: sellerIP } of sellerIPs) {
      if (sellerIP === bidderIP) {
        result.isMatch = true
        result.confidence = 1.0
        result.matchType = 'exact'
        result.matchedIPs.push(sellerIP)
        break
      }

      if (this.isIPv4(bidderIP) && this.isIPv4(sellerIP)) {
        const bidderSubnet = this.getIPv4Subnet(bidderIP, this.SUBNET_PREFIX_V4)
        const sellerSubnet = this.getIPv4Subnet(sellerIP, this.SUBNET_PREFIX_V4)
        if (bidderSubnet === sellerSubnet) {
          result.isMatch = true
          result.confidence = Math.max(result.confidence, 0.7)
          result.matchType = 'subnet'
          result.matchedIPs.push(sellerIP)
        }
      }

      if (this.isIPv6(bidderIP) && this.isIPv6(sellerIP)) {
        const bidderSubnet = this.getIPv6Subnet(bidderIP, this.SUBNET_PREFIX_V6)
        const sellerSubnet = this.getIPv6Subnet(sellerIP, this.SUBNET_PREFIX_V6)
        if (bidderSubnet === sellerSubnet) {
          result.isMatch = true
          result.confidence = Math.max(result.confidence, 0.6)
          result.matchType = 'subnet'
          result.matchedIPs.push(sellerIP)
        }
      }
    }

    await this.cache.set(cacheKey, result, 3600)
    return result
  }

  async checkDeviceFingerprintCorrelation(
    sellerId: string,
    fingerprint: string,
  ): Promise<{ match: boolean; confidence: number }> {
    const sellerFingerprints = await this.prisma.userDeviceFingerprint.findMany({
      where: { userId: sellerId },
      select: { deviceFingerprint: true },
    })

    for (const { deviceFingerprint: sf } of sellerFingerprints) {
      if (sf === fingerprint) return { match: true, confidence: 1.0 }
      const similarity = this.jaccardSimilarity(fingerprint, sf)
      if (similarity > 0.7) return { match: true, confidence: similarity }
    }

    return { match: false, confidence: 0 }
  }

  async detectRapidEscalation(
    auctionId: string,
    windowSeconds = 300,
  ): Promise<{ suspicious: boolean; escalationRate: number; pattern: string }> {
    const bids = await this.prisma.bid.findMany({
      where: {
        auctionId,
        createdAt: { gte: new Date(Date.now() - windowSeconds * 1000) },
      },
      orderBy: { createdAt: 'asc' },
      select: { amount: true, createdAt: true, userId: true },
    })

    if (bids.length < 4) {
      return { suspicious: false, escalationRate: 0, pattern: 'insufficient_data' }
    }

    let escalationCount = 0
    for (let i = 1; i < bids.length; i++) {
      if (Number(bids[i].amount) > Number(bids[i - 1].amount)) escalationCount++
    }

    const escalationRate = escalationCount / (bids.length - 1)
    const uniqueBidders = new Set(bids.map((b) => b.userId))

    let shortIntervalCount = 0
    for (let i = 1; i < bids.length; i++) {
      const timeDiff = (bids[i].createdAt.getTime() - bids[i - 1].createdAt.getTime()) / 1000
      if (timeDiff < 30) shortIntervalCount++
    }

    const shortIntervalRatio = shortIntervalCount / (bids.length - 1)
    let pattern = 'normal'

    if (uniqueBidders.size === 1 && escalationRate > 0.8) {
      pattern = 'single_seller_shill'
    } else if (shortIntervalRatio > 0.6 && escalationRate > 0.7) {
      pattern = 'rapid_escalation'
    }

    return { suspicious: pattern !== 'normal', escalationRate, pattern }
  }

  async analyzeBidderSellerGraph(auctionId: string): Promise<{
    hasCycle: boolean
    suspiciousPaths: string[][]
    riskScore: number
  }> {
    const bids = await this.prisma.bid.findMany({
      where: { auctionId },
      select: { userId: true },
      orderBy: { createdAt: 'asc' },
    })

    const adjacencyMap = new Map<string, Set<string>>()
    for (let i = 1; i < bids.length; i++) {
      const from = bids[i - 1].userId
      const to = bids[i].userId
      if (from === to) continue
      if (!adjacencyMap.has(from)) adjacencyMap.set(from, new Set())
      adjacencyMap.get(from)!.add(to)
    }

    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    const suspiciousPaths: string[][] = []
    let hasCycle = false

    const dfs = (node: string, path: string[]): void => {
      visited.add(node)
      recursionStack.add(node)
      path.push(node)

      const neighbors = adjacencyMap.get(node) || new Set()
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path])
        } else if (recursionStack.has(neighbor)) {
          hasCycle = true
          const cycleStart = path.indexOf(neighbor)
          if (cycleStart >= 0) suspiciousPaths.push(path.slice(cycleStart))
        }
      }
      recursionStack.delete(node)
    }

    for (const [node] of adjacencyMap) {
      if (!visited.has(node)) dfs(node, [])
    }

    const riskScore = hasCycle ? Math.min(0.5 + suspiciousPaths.length * 0.15, 1.0) : 0
    return { hasCycle, suspiciousPaths, riskScore }
  }

  async recordUserIP(userId: string, ip: string): Promise<void> {
    await this.prisma.userIpHistory.create({
      data: { userId, ipAddress: ip },
    })
  }

  async recordFingerprint(userId: string, fingerprint: string): Promise<void> {
    const existing = await this.prisma.userDeviceFingerprint.findFirst({
      where: { userId, deviceFingerprint: fingerprint },
    })
    if (!existing) {
      await this.prisma.userDeviceFingerprint.create({
        data: { userId, deviceFingerprint: fingerprint },
      })
    }
  }

  private isIPv4(ip: string): boolean {
    return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)
  }

  private isIPv6(ip: string): boolean {
    return ip.includes(':')
  }

  private getIPv4Subnet(ip: string, prefix: number): string {
    const octets = ip.split('.').map(Number)
    const mask = (~0 << (32 - prefix)) >>> 0
    const ipNum = ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0
    return (ipNum & mask).toString(16)
  }

  private getIPv6Subnet(ip: string, prefix: number): string {
    const expanded = this.expandIPv6(ip)
    return expanded.replace(/:/g, '').substring(0, prefix / 4)
  }

  private expandIPv6(ip: string): string {
    if (ip.includes('::')) {
      const [left, right] = ip.split('::')
      const leftParts = left ? left.split(':') : []
      const rightParts = right ? right.split(':') : []
      const missing = 8 - leftParts.length - rightParts.length
      return [...leftParts, ...Array(missing).fill('0000'), ...rightParts].join(':')
    }
    return ip
  }

  private jaccardSimilarity(a: string, b: string): number {
    const setA = new Set(a.split(''))
    const setB = new Set(b.split(''))
    const intersection = new Set([...setA].filter((x) => setB.has(x)))
    const union = new Set([...setA, ...setB])
    return union.size === 0 ? 0 : intersection.size / union.size
  }
}
