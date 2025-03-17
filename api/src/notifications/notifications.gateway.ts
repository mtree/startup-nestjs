import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'notifications',
})
export class NotificationsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(NotificationsGateway.name);
  private userSocketMap = new Map<string, string[]>();

  constructor(private jwtService: JwtService) {}

  afterInit() {
    this.logger.log('Notifications WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token?.replace('Bearer ', '') || 
                   client.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.handleDisconnect(client);
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      if (!userId) {
        this.handleDisconnect(client);
        return;
      }

      // Store socket connection mapped to user ID
      if (!this.userSocketMap.has(userId)) {
        this.userSocketMap.set(userId, []);
      }
      this.userSocketMap.get(userId).push(client.id);

      // Join user to their private room
      client.join(`user:${userId}`);
      
      this.logger.log(`Client connected: ${client.id} for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Socket authentication error: ${error.message}`);
      this.handleDisconnect(client);
    }
  }

  handleDisconnect(client: Socket) {
    // Remove socket mapping
    for (const [userId, socketIds] of this.userSocketMap.entries()) {
      const index = socketIds.indexOf(client.id);
      if (index !== -1) {
        socketIds.splice(index, 1);
        this.logger.log(`Client disconnected: ${client.id} for user: ${userId}`);
        
        // If no more sockets for this user, remove the user entry
        if (socketIds.length === 0) {
          this.userSocketMap.delete(userId);
        }
        break;
      }
    }
    
    client.disconnect();
  }

  // Send notification to a specific user
  sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', notification);
    this.logger.log(`Notification sent to user: ${userId}`);
  }
} 