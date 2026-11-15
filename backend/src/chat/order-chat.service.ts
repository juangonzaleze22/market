import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import {
  MessageSenderRole,
  OrderMessage,
} from '../database/entities/order-message.entity.js';
import { Order, OrderStatus } from '../database/entities/order.entity.js';
import { User, UserRole } from '../database/entities/user.entity.js';
import { ChatAttachmentDto, SendMessageDto } from './dto/chat.dto.js';
import { NotificationsService } from '../notifications/notifications.service.js';

export interface ChatUser {
  userId: string;
  email?: string;
  role: string;
}

export interface ChatConversationCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ChatConversationMessage {
  body: string | null;
  senderRole: MessageSenderRole;
  createdAt: Date;
  hasAttachments: boolean;
}

export interface ChatConversation {
  orderId: string;
  orderNumber: string;
  orderStatus: OrderStatus;
  totalAmount: number;
  createdAt: Date;
  customer: ChatConversationCustomer | null;
  lastMessage: ChatConversationMessage | null;
  unreadCount: number;
}

const CHAT_ENABLED_STATUSES = new Set<OrderStatus>([
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.OUT_FOR_DELIVERY,
]);

const CONVERSATION_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
];

const MAX_CONVERSATIONS = 200;

@Injectable()
export class OrderChatService {
  constructor(
    @InjectRepository(OrderMessage)
    private readonly messageRepository: Repository<OrderMessage>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

  async listConversations(user: ChatUser): Promise<ChatConversation[]> {
    const where: FindOptionsWhere<Order> = {
      status: In(CONVERSATION_STATUSES),
    };
    if (user.role === UserRole.ADMIN) {
      // Los admins ven todas las conversaciones.
    } else if (user.role === UserRole.DELIVERY) {
      where.deliveryId = user.userId;
    } else {
      where.userId = user.userId;
    }

    const orders = await this.orderRepository.find({
      where,
      order: { updatedAt: 'DESC' },
      take: MAX_CONVERSATIONS,
    });
    if (orders.length === 0) return [];

    const orderIds = orders.map((order) => order.id);
    const messages = await this.messageRepository.find({
      where: { orderId: In(orderIds) },
      order: { createdAt: 'DESC' },
    });

    const ownRole = this.ownRoleFor(user);
    const summaries = new Map<
      string,
      { last: OrderMessage | null; unread: number }
    >();
    for (const message of messages) {
      let summary = summaries.get(message.orderId);
      if (!summary) {
        summary = { last: message, unread: 0 };
        summaries.set(message.orderId, summary);
      }
      const isUnread =
        !message.readAt &&
        message.senderRole !== ownRole &&
        message.senderRole !== MessageSenderRole.SYSTEM;
      if (isUnread) summary.unread += 1;
    }

    const customers = await this.loadCustomers(user, orders);

    return orders
      .map<ChatConversation>((order) => {
        const summary = summaries.get(order.id);
        const customer = customers.get(order.userId);
        return {
          orderId: order.id,
          orderNumber: order.orderNumber,
          orderStatus: order.status,
          totalAmount: Number(order.totalAmount),
          createdAt: order.createdAt,
          customer: customer
            ? {
                id: customer.id,
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email,
              }
            : null,
          lastMessage: summary?.last
            ? {
                body: summary.last.body,
                senderRole: summary.last.senderRole,
                createdAt: summary.last.createdAt,
                hasAttachments: (summary.last.attachments?.length ?? 0) > 0,
              }
            : null,
          unreadCount: summary?.unread ?? 0,
        };
      })
      .sort((a, b) => this.activityAt(b) - this.activityAt(a));
  }

  async markRead(
    user: ChatUser,
    orderId: string,
  ): Promise<{ read: number }> {
    const order = await this.getOrderOrFail(orderId);
    this.assertAccess(user, order);

    const ownRole = this.ownRoleFor(user);
    const result = await this.messageRepository
      .createQueryBuilder()
      .update(OrderMessage)
      .set({ readAt: () => 'CURRENT_TIMESTAMP' })
      .where('orderId = :orderId', { orderId })
      .andWhere('readAt IS NULL')
      .andWhere('senderRole != :ownRole', { ownRole })
      .andWhere('senderRole != :systemRole', {
        systemRole: MessageSenderRole.SYSTEM,
      })
      .execute();

    return { read: result.affected ?? 0 };
  }

  private ownRoleFor(user: ChatUser): MessageSenderRole {
    if (user.role === UserRole.ADMIN) return MessageSenderRole.ADMIN;
    if (user.role === UserRole.DELIVERY) return MessageSenderRole.DELIVERY;
    return MessageSenderRole.CUSTOMER;
  }

  private activityAt(conversation: ChatConversation): number {
    const date = conversation.lastMessage?.createdAt ?? conversation.createdAt;
    return new Date(date).getTime();
  }

  private async loadCustomers(
    user: ChatUser,
    orders: Order[],
  ): Promise<Map<string, User>> {
    if (user.role !== UserRole.ADMIN) return new Map();

    const userIds = [...new Set(orders.map((order) => order.userId))];
    if (userIds.length === 0) return new Map();

    const users = await this.userRepository.find({
      where: { id: In(userIds) },
      select: ['id', 'firstName', 'lastName', 'email'],
    });

    return new Map(users.map((customer) => [customer.id, customer]));
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
    await this.orderRepository.update(order.id, { updatedAt: new Date() });
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
