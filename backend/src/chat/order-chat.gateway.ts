import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserRole } from '../database/entities/user.entity.js';
import { ChatUser, OrderChatService } from './order-chat.service.js';
import { ChatAttachmentDto, SendMessageDto } from './dto/chat.dto.js';

const ADMIN_ROOM = 'admins';
const DELIVERIES_ROOM = 'deliveries';
const orderRoom = (orderId: string) => `order:${orderId}`;

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: (origin, callback) => callback(null, true),
    credentials: true,
  },
})
export class OrderChatGateway implements OnGatewayConnection {
  private readonly logger = new Logger(OrderChatGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: OrderChatService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractToken(client);
      if (!token) {
        client.disconnect(true);
        return;
      }
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      const user: ChatUser = {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
      };
      client.data.user = user;

      if (user.role === UserRole.ADMIN) {
        await client.join(ADMIN_ROOM);
      }
      if (user.role === UserRole.DELIVERY) {
        await client.join(DELIVERIES_ROOM);
      }
    } catch {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('joinOrder')
  async handleJoinOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { orderId?: string },
  ): Promise<void> {
    const user = client.data.user as ChatUser | undefined;
    if (!user) {
      client.disconnect(true);
      return;
    }

    const orderId = String(payload?.orderId ?? '');
    if (!orderId) return;

    try {
      const messages = await this.chatService.listForUser(user, orderId);
      await client.join(orderRoom(orderId));
      client.emit('history', { orderId, messages });
    } catch (error) {
      this.emitError(client, error);
    }
  }

  @SubscribeMessage('leaveOrder')
  async handleLeaveOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { orderId?: string },
  ): Promise<void> {
    const orderId = String(payload?.orderId ?? '');
    if (orderId) {
      await client.leave(orderRoom(orderId));
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: Partial<SendMessageDto>,
  ): Promise<void> {
    const user = client.data.user as ChatUser | undefined;
    if (!user) {
      client.disconnect(true);
      return;
    }

    try {
      const dto = this.normalizePayload(payload);
      const message = await this.chatService.sendMessage(user, dto);
      this.server.to(orderRoom(message.orderId)).emit('message', message);
    } catch (error) {
      this.emitError(client, error);
    }
  }

  emitToOrder(orderId: string, event: string, payload: unknown): void {
    this.server?.to(orderRoom(orderId)).emit(event, payload);
  }

  emitOrderStatus(orderId: string, payload: unknown): void {
    this.server
      ?.to(orderRoom(orderId))
      .to(ADMIN_ROOM)
      .emit('orderStatus', payload);
  }

  emitToAdmins(event: string, payload: unknown): void {
    this.server?.to(ADMIN_ROOM).emit(event, payload);
  }

  emitToDeliveries(event: string, payload: unknown): void {
    this.server?.to(DELIVERIES_ROOM).emit(event, payload);
  }

  private normalizePayload(payload: Partial<SendMessageDto>): SendMessageDto {
    const attachments: ChatAttachmentDto[] = Array.isArray(payload?.attachments)
      ? (payload.attachments as ChatAttachmentDto[]).slice(0, 5).map((a) => ({
          url: String(a?.url ?? ''),
          name: String(a?.name ?? ''),
          type: String(a?.type ?? ''),
          size: Number(a?.size ?? 0),
        }))
      : [];

    return {
      orderId: String(payload?.orderId ?? ''),
      body: typeof payload?.body === 'string' ? payload.body : '',
      attachments,
    };
  }

  private emitError(client: Socket, error: unknown): void {
    const raw = (error as { message?: unknown } | null)?.message;
    const message = Array.isArray(raw)
      ? raw.join(', ')
      : typeof raw === 'string'
        ? raw
        : 'No se pudo procesar el mensaje';
    client.emit('chatError', { message });
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
