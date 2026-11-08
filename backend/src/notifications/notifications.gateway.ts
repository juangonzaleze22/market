import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserRole } from '../database/entities/user.entity.js';

const ADMIN_ROOM = 'admins';
const userRoom = (userId: string) => `user:${userId}`;

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: (origin, callback) => callback(null, true),
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection {
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractToken(client);
      if (!token) {
        client.disconnect(true);
        return;
      }
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      const user = { userId: payload.sub, role: payload.role };
      client.data.user = user;

      await client.join(userRoom(user.userId));
      if (user.role === UserRole.ADMIN) {
        await client.join(ADMIN_ROOM);
      }
    } catch {
      client.disconnect(true);
    }
  }

  emitToUser(userId: string, payload: unknown): void {
    this.server?.to(userRoom(userId)).emit('notification', payload);
  }

  emitToAdmins(payload: unknown): void {
    this.server?.to(ADMIN_ROOM).emit('notification', payload);
  }

  private extractToken(client: Socket): string | null {
    const fromAuth = client.handshake?.auth?.token;
    if (typeof fromAuth === 'string' && fromAuth) return fromAuth;

    const header = client.handshake?.headers?.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7);
    }
    return null;
  }
}
