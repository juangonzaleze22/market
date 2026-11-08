import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MessageSenderRole,
  OrderMessage,
} from '../database/entities/order-message.entity.js';
import { Order, OrderStatus } from '../database/entities/order.entity.js';
import { UserRole } from '../database/entities/user.entity.js';
import { ChatAttachmentDto, SendMessageDto } from './dto/chat.dto.js';
import { NotificationsService } from '../notifications/notifications.service.js';

export interface ChatUser {
  userId: string;
  email?: string;
  role: string;
}

const CHAT_ENABLED_STATUSES = new Set<OrderStatus>([
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.OUT_FOR_DELIVERY,
]);

@Injectable()
export class OrderChatService {
  constructor(
    @InjectRepository(OrderMessage)
    private readonly messageRepository: Repository<OrderMessage>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly notifications: NotificationsService,
  ) {}

  async getOrderOrFail(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }
    return order;
  }

  isChatEnabled(order: Order): boolean {
    return CHAT_ENABLED_STATUSES.has(order.status);
  }

  assertAccess(user: ChatUser, order: Order): void {
    if (user.role === UserRole.ADMIN) return;
    if (user.role === UserRole.DELIVERY) {
      if (order.deliveryId && order.deliveryId === user.userId) return;
      throw new ForbiddenException('No sos el repartidor asignado a este pedido');
    }
    if (order.userId !== user.userId) {
      throw new ForbiddenException('No tenés acceso a este pedido');
    }
  }

  private assertChatEnabled(order: Order): void {
    if (order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException(
        'El chat está cerrado porque el pedido fue entregado',
      );
    }
    if (!this.isChatEnabled(order)) {
      throw new BadRequestException(
        'El chat estará disponible cuando el pedido sea aceptado',
      );
    }
  }

  async listForUser(user: ChatUser, orderId: string): Promise<OrderMessage[]> {
    const order = await this.getOrderOrFail(orderId);
    this.assertAccess(user, order);
    return this.list(orderId);
  }

  async list(orderId: string): Promise<OrderMessage[]> {
    return this.messageRepository.find({
      where: { orderId },
      order: { createdAt: 'ASC' },
    });
  }

  async sendMessage(user: ChatUser, dto: SendMessageDto): Promise<OrderMessage> {
    const body = (dto.body ?? '').trim();
    const attachments: ChatAttachmentDto[] = dto.attachments ?? [];

    if (!body && attachments.length === 0) {
      throw new BadRequestException('El mensaje no puede estar vacío');
    }

    const order = await this.getOrderOrFail(dto.orderId);
    this.assertAccess(user, order);
    this.assertChatEnabled(order);

    const senderRole =
      user.role === UserRole.ADMIN
        ? MessageSenderRole.ADMIN
        : user.role === UserRole.DELIVERY
          ? MessageSenderRole.DELIVERY
          : MessageSenderRole.CUSTOMER;

    const message = this.messageRepository.create({
      orderId: order.id,
      senderId: user.userId,
      senderRole,
      body: body || null,
      attachments: attachments.map((a) => ({
        url: a.url,
        name: a.name,
        type: a.type,
        size: a.size,
      })),
    });

    const saved = await this.messageRepository.save(message);
    await this.notifications.notifyOrderChat(
      {
        id: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
        deliveryId: order.deliveryId,
      },
      saved,
    );
    return saved;
  }

  async createSystemMessage(
    orderId: string,
    body: string,
  ): Promise<OrderMessage> {
    const message = this.messageRepository.create({
      orderId,
      senderId: null,
      senderRole: MessageSenderRole.SYSTEM,
      body,
      attachments: [],
    });
    return this.messageRepository.save(message);
  }
}
