import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationType,
} from '../database/entities/notification.entity.js';
import { User, UserRole } from '../database/entities/user.entity.js';
import { OrderStatus } from '../database/entities/order.entity.js';
import {
  MessageSenderRole,
  OrderMessage,
} from '../database/entities/order-message.entity.js';
import { NotificationsGateway } from './notifications.gateway.js';

export interface OrderNotificationInput {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  totalAmount?: number;
  rejectionReason?: string | null;
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Pendiente',
  [OrderStatus.PAID]: 'Aceptado',
  [OrderStatus.PROCESSING]: 'En preparación',
  [OrderStatus.SHIPPED]: 'Listo para entrega',
  [OrderStatus.OUT_FOR_DELIVERY]: 'En camino',
  [OrderStatus.DELIVERED]: 'Entregado',
  [OrderStatus.REJECTED]: 'Rechazado',
  [OrderStatus.CANCELLED]: 'Cancelado',
};

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly gateway: NotificationsGateway,
  ) {}

  // ─── Queries ──────────────────────────────────────────────────────

  async listForUser(
    userId: string,
    limit = 30,
    unreadOnly = false,
  ): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: unreadOnly ? { userId, read: false } : { userId },
      order: { createdAt: 'DESC' },
      take: Math.min(Math.max(limit, 1), 100),
    });
  }

  async unreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, read: false },
    });
  }

  async markRead(userId: string, id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });
    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }
    if (!notification.read) {
      notification.read = true;
      await this.notificationRepository.save(notification);
    }
    return notification;
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await this.notificationRepository.update(
      { userId, read: false },
      { read: true },
    );
    return { updated: result.affected ?? 0 };
  }

  // ─── Triggers ─────────────────────────────────────────────────────

  async notifyOrderCreated(order: OrderNotificationInput): Promise<void> {
    const admins = await this.userRepository.find({
      where: { role: UserRole.ADMIN },
      select: ['id'],
    });
    if (admins.length === 0) return;

    const rows = admins.map((admin) =>
      this.notificationRepository.create({
        userId: admin.id,
        type: NotificationType.ORDER_CREATED,
        title: 'Nuevo pedido',
        body: this.orderCreatedBody(order),
        orderId: order.id,
        orderNumber: order.orderNumber,
        read: false,
      }),
    );

    const saved = await this.notificationRepository.save(rows);
    saved.forEach((notification) =>
      this.gateway.emitToUser(notification.userId, notification),
    );
  }

  async notifyOrderStatus(order: OrderNotificationInput): Promise<void> {
    const label = STATUS_LABELS[order.status] ?? order.status;
    const body =
      order.status === OrderStatus.REJECTED && order.rejectionReason
        ? `${label}: ${order.rejectionReason}`
        : `Estado: ${label}`;

    const notification = await this.notificationRepository.save(
      this.notificationRepository.create({
        userId: order.userId,
        type: NotificationType.ORDER_STATUS,
        title: `Pedido ${order.orderNumber} actualizado`,
        body,
        orderId: order.id,
        orderNumber: order.orderNumber,
        read: false,
      }),
    );
    this.gateway.emitToUser(notification.userId, notification);
  }

  async notifyOrderChat(
    order: {
      id: string;
      orderNumber: string;
      userId: string;
      deliveryId?: string | null;
    },
    message: OrderMessage,
  ): Promise<void> {
    const preview = this.messagePreview(message);
    const fromCustomer = message.senderRole === MessageSenderRole.CUSTOMER;

    if (fromCustomer) {
      const recipients = new Set<string>();

      const admins = await this.userRepository.find({
        where: { role: UserRole.ADMIN },
        select: ['id'],
      });
      admins.forEach((admin) => recipients.add(admin.id));
      if (order.deliveryId) recipients.add(order.deliveryId);

      if (recipients.size === 0) return;

      const rows = [...recipients].map((userId) =>
        this.notificationRepository.create({
          userId,
          type: NotificationType.ORDER_CHAT,
          title: `Nuevo mensaje · ${order.orderNumber}`,
          body: preview,
          orderId: order.id,
          orderNumber: order.orderNumber,
          read: false,
        }),
      );
      const saved = await this.notificationRepository.save(rows);
      saved.forEach((notification) =>
        this.gateway.emitToUser(notification.userId, notification),
      );
      return;
    }

    const notification = await this.notificationRepository.save(
      this.notificationRepository.create({
        userId: order.userId,
        type: NotificationType.ORDER_CHAT,
        title: `Respuesta de la tienda · ${order.orderNumber}`,
        body: preview,
        orderId: order.id,
        orderNumber: order.orderNumber,
        read: false,
      }),
    );
    this.gateway.emitToUser(notification.userId, notification);
  }

  async notifyDeliveryReady(order: OrderNotificationInput): Promise<void> {
    const drivers = await this.userRepository.find({
      where: { role: UserRole.DELIVERY },
      select: ['id'],
    });
    if (drivers.length === 0) return;

    const rows = drivers.map((driver) =>
      this.notificationRepository.create({
        userId: driver.id,
        type: NotificationType.ORDER_CREATED,
        title: 'Pedido listo para entrega',
        body: this.orderCreatedBody(order),
        orderId: order.id,
        orderNumber: order.orderNumber,
        read: false,
      }),
    );
    const saved = await this.notificationRepository.save(rows);
    saved.forEach((notification) =>
      this.gateway.emitToUser(notification.userId, notification),
    );
  }

  // ─── Helpers ──────────────────────────────────────────────────────

  private orderCreatedBody(order: OrderNotificationInput): string {
    if (order.totalAmount === undefined) return order.orderNumber;
    return `${order.orderNumber} · $${Number(order.totalAmount).toFixed(2)}`;
  }

  private messagePreview(message: OrderMessage): string {
    const body = (message.body ?? '').trim();
    if (body) {
      return body.length > 140 ? `${body.slice(0, 137)}...` : body;
    }
    return 'Envió un archivo adjunto';
  }
}
