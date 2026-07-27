import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets'
import { Logger } from '@nestjs/common'
import { Server, Socket } from 'socket.io'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../../prisma/prisma.service'

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
})
export class AuctionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private readonly logger = new Logger(AuctionGateway.name)
  private connectedUsers = new Map<string, Set<string>>()
  private socketUsers = new Map<string, string>()

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token
      if (!token || typeof token !== 'string') {
        client.disconnect()
        return
      }

      const payload = this.jwtService.verify(token)
      const userId = payload.sub

      client.data.userId = userId
      this.socketUsers.set(client.id, userId)

      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set())
      }
      this.connectedUsers.get(userId)!.add(client.id)

    client.join(`user:${userId}`)
    client.join('feed:global')
    this.logger.log(`User ${userId} connected (socket: ${client.id})`)
    } catch {
      client.disconnect()
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.socketUsers.get(client.id)
    if (userId) {
      this.connectedUsers.get(userId)?.delete(client.id)
      if (this.connectedUsers.get(userId)?.size === 0) {
        this.connectedUsers.delete(userId)
      }
      this.socketUsers.delete(client.id)
      this.logger.log(`User ${userId} disconnected (socket: ${client.id})`)
    }
  }

  @SubscribeMessage('join:auction')
  handleJoinAuction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { auctionId: string },
  ) {
    client.join(`auction:${data.auctionId}`)
    this.logger.debug(`Socket ${client.id} joined auction:${data.auctionId}`)
    return { event: 'joined', data: { auctionId: data.auctionId } }
  }

  @SubscribeMessage('leave:auction')
  handleLeaveAuction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { auctionId: string },
  ) {
    client.leave(`auction:${data.auctionId}`)
    return { event: 'left', data: { auctionId: data.auctionId } }
  }

  broadcastBid(auctionId: string, bid: any) {
    try {
      this.server.to(`auction:${auctionId}`).emit('bid:new', { auctionId, bid })

      const userName = typeof bid.user === 'string'
        ? bid.user
        : bid.user
          ? `${bid.user.firstName ?? ''} ${bid.user.lastName ?? ''}`.trim() || 'bidder'
          : 'bidder'

      this.server.to('feed:global').emit('feed:bid', {
        auctionId,
        user: userName,
        amount: bid.amount ?? bid.currentPrice ?? 0,
        auctionTitle: bid.auctionTitle || auctionId,
        createdAt: bid.createdAt || new Date().toISOString(),
      })
    } catch (err: any) {
      this.logger.error(`Failed to broadcast bid: ${err.message}`)
    }
  }

  broadcastAuctionEnd(auctionId: string, data: any) {
    try {
      this.server.to(`auction:${auctionId}`).emit('auction:ended', data)
    } catch (err: any) {
      this.logger.error(`Failed to broadcast auction end: ${err.message}`)
    }
  }

  sendNotification(userId: string, notification: any) {
    try {
      this.server.to(`user:${userId}`).emit('notification', notification)
    } catch (err: any) {
      this.logger.error(`Failed to send notification to ${userId}: ${err.message}`)
    }
  }

  getOnlineCount(): number {
    return this.connectedUsers.size
  }
}
