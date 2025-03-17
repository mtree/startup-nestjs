import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

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

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService
  ) {
    // Log JWT secret configuration on startup (redacted for security)
    const hasSecret = !!this.configService.get('JWT_SECRET');
    this.logger.log(`JWT secret configuration: ${hasSecret ? 'Configured ✓' : 'Using fallback key ⚠️'}`);
  }

  afterInit() {
    this.logger.log('Notifications WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token?.replace('Bearer ', '') || 
                   client.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn(`Client ${client.id} attempted connection without token`);
        client.emit('auth_error', { message: 'Authentication token is required' });
        client.disconnect();
        return;
      }

      // Get JWT secret with fallback (same as JwtStrategy)
      const jwtSecret = this.configService.get('JWT_SECRET') || 'your-secret-key';

      try {
        const payload = this.jwtService.verify(token, { secret: jwtSecret });
        const userId = payload.sub;

        if (!userId) {
          this.logger.warn(`Client ${client.id} token missing user ID`);
          client.emit('auth_error', { message: 'Invalid authentication token (missing user ID)' });
          client.disconnect();
          return;
        }

        // Store socket connection mapped to user ID
        if (!this.userSocketMap.has(userId)) {
          this.userSocketMap.set(userId, []);
        }
        this.userSocketMap.get(userId).push(client.id);

        // Join user to their private room
        client.join(`user:${userId}`);
        
        // Store user ID in socket data for reference in handleDisconnect
        client.data.userId = userId;
        
        // Confirm successful authentication to the client
        client.emit('auth_success', { userId });
        
        this.logger.log(`Client connected: ${client.id} for user: ${userId}`);
      } catch (jwtError) {
        this.logger.error(`JWT verification failed: ${jwtError.message}`);
        client.emit('auth_error', { message: 'Invalid authentication token' });
        client.disconnect();
      }
    } catch (error) {
      this.logger.error(`Socket authentication error: ${error.message}`);
      client.emit('error', { message: 'Server error during authentication' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    try {
      // Get userId from socket data if available
      const userId = client.data?.userId;
      
      if (userId && this.userSocketMap.has(userId)) {
        const socketIds = this.userSocketMap.get(userId);
        const index = socketIds.indexOf(client.id);
        
        if (index !== -1) {
          socketIds.splice(index, 1);
          this.logger.log(`Client disconnected: ${client.id} for user: ${userId}`);
          
          // If no more sockets for this user, remove the user entry
          if (socketIds.length === 0) {
            this.userSocketMap.delete(userId);
          }
          return;
        }
      }
      
      // If we got here, we don't have user mapping
      this.logger.log(`Client disconnected without user mapping: ${client.id}`);
      
      // Don't call client.disconnect() here as it can cause loops
      // The client is already disconnecting when this handler is called
    } catch (error) {
      this.logger.error(`Error in handleDisconnect: ${error.message}`);
    }
  }

  // Send notification to a specific user
  sendNotificationToUser(userId: string, notification: any) {
    try {
      this.server.to(`user:${userId}`).emit('notification', notification);
      this.logger.log(`Notification sent to user: ${userId}`);
    } catch (error) {
      this.logger.error(`Error sending notification to user ${userId}: ${error.message}`);
    }
  }
} 