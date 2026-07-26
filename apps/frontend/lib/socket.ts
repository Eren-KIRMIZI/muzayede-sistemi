import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;
  private namespace: string = '';

  /**
   * Connect to a specific namespace
   */
  connect(namespace: string = '', token?: string) {
    if (this.socket) {
      if (this.namespace === namespace) return this.socket;
      this.disconnect();
    }

    this.namespace = namespace;
    const url = namespace ? `${SOCKET_URL}${namespace}` : SOCKET_URL;
    
    this.socket = io(url, {
      auth: token ? { token } : undefined,
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log(`[Socket] Connected to ${namespace || '/'}`);
    });

    this.socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected from ${namespace || '/'}`);
    });

    this.socket.on('connect_error', (error) => {
      console.error(`[Socket] Connection error on ${namespace || '/'}:`, error);
    });

    return this.socket;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Common Auction Actions
  joinAuctionRoom(auctionId: string) {
    if (this.socket) {
      this.socket.emit('join:auction', { auctionId });
    }
  }

  leaveAuctionRoom(auctionId: string) {
    if (this.socket) {
      this.socket.emit('leave:auction', { auctionId });
    }
  }
}

export const socketService = new SocketService();
