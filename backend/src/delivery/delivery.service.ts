import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Order, OrderStatus } from '../database/entities/order.entity.js';
import { OrderItem } from '../database/entities/order-item.entity.js';
import { User, UserRole } from '../database/entities/user.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { OrderChatGateway } from '../chat/order-chat.gateway.js';

const AVAILABLE_STATUS = OrderStatus.SHIPPED;
const ACTIVE_STATUS = OrderStatus.OUT_FOR_DELIVERY;
const MAX_PAGE_SIZE = 100;

export interface DeliveryQueueQuery {
  page?: number;
  limit?: number;
  search?: string;
  scope?: 'available' | 'mine' | 'delivered';
}

export interface DeliveryUser {
  userId: string;
  role: string;
  branchId?: string | null;
}

@Injectable()
export class DeliveryService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notifications: NotificationsService,
    private readonly orderChatGateway: OrderChatGateway,
    private readonly dataSource: DataSource,
  ) {}

  async findQueue(user: DeliveryUser, query: DeliveryQueueQuery) {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 10, 1), MAX_PAGE_SIZE);
    const scope = query.scope ?? 'available';

    const qb = this.orderRepository.createQueryBuilder('order');

    if (scope === 'mine') {
      qb.where('order.deliveryId = :userId', { userId: user.userId }).andWhere(
        'order.status IN (:...statuses)',
        { statuses: [ACTIVE_STATUS, OrderStatus.DELIVERED] },
      );
    } else if (scope === 'delivered') {
      qb.where('order.deliveryId = :userId', { userId: user.userId }).andWhere(
        'order.status = :status',
        { status: OrderStatus.DELIVERED },
      );
    } else {
      qb.where('order.status = :status', { status: AVAILABLE_STATUS }).andWhere(
        'order.deliveryId IS NULL',
      );
      if (user.branchId) {
        qb.andWhere('order.branchId = :branchId', {
          branchId: user.branchId,
        });
      }
    }

    if (query.search) {
      qb.andWhere('order.orderNumber ILIKE :search', {
        search: `%${query.search}%`,
      });
    }

    qb.leftJoinAndSelect('order.shippingAddress', 'address')
      .orderBy('order.createdAt', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [orders, total] = await qb.getManyAndCount();

    const ids = orders.map((order) => order.id);
    const counts = ids.length
      ? await this.orderItemRepository
          .createQueryBuilder('item')
          .select('item.orderId', 'orderId')
          .addSelect('COUNT(*)', 'totalItems')
          .where('item.orderId IN (:...ids)', { ids })
          .groupBy('item.orderId')
          .getRawMany<{ orderId: string; totalItems: string }>()
      : [];
    const countMap = new Map(
      counts.map((row) => [row.orderId, Number(row.totalItems)]),
    );

    return {
      data: orders.map((order) => this.toSummary(order, countMap.get(order.id) ?? 0)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(user: DeliveryUser, id: string) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['shippingAddress'],
    });
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }
    this.assertCanView(user, order);

    const items = await this.orderItemRepository.find({
      where: { orderId: id },
      relations: ['product'],
      order: { productName: 'ASC' },
    });

    const customer = await this.userRepository.findOne({
      where: { id: order.userId },
      select: ['id', 'firstName', 'lastName', 'email', 'phone'],
    });

    const delivery = order.deliveryId
      ? await this.userRepository.findOne({
          where: { id: order.deliveryId },
          select: ['id', 'firstName', 'lastName', 'phone'],
        })
      : null;

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      deliveryId: order.deliveryId,
      deliveryAcceptedAt: order.deliveryAcceptedAt,
      deliveredAt: order.deliveredAt,
      deliveryPosition: this.positionOf(order),
      shippingAddress: order.shippingAddress
        ? {
            street: order.shippingAddress.street,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            zipCode: order.shippingAddress.zipCode,
            country: order.shippingAddress.country,
            latitude: order.shippingAddress.latitude,
            longitude: order.shippingAddress.longitude,
          }
        : null,
      customer: customer
        ? {
            id: customer.id,
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.email,
            phone: customer.phone,
          }
        : null,
      delivery: delivery
        ? {
            id: delivery.id,
            firstName: delivery.firstName,
            lastName: delivery.lastName,
            phone: delivery.phone,
          }
        : null,
      items: items.map((item) => ({
        id: item.id,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
        productId: item.productId,
        productImage:
          item.product?.featuredImage || item.product?.images?.[0] || null,
      })),
    };
  }

  async accept(id: string, userId: string, branchId?: string | null) {
    const updated = await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
        loadEagerRelations: false,
      });
      if (!order) {
        throw new NotFoundException('Pedido no encontrado');
      }
      if (branchId && order.branchId !== branchId) {
        throw new ForbiddenException(
          'El pedido pertenece a otra sucursal',
        );
      }
      if (order.deliveryId && order.deliveryId !== userId) {
        throw new BadRequestException('El pedido ya fue tomado por otro repartidor');
      }
      if (order.status !== AVAILABLE_STATUS) {
        throw new BadRequestException(
          'El pedido no está listo para entrega',
        );
      }

      order.deliveryId = userId;
      order.deliveryAcceptedAt = new Date();
      order.status = ACTIVE_STATUS;
      return manager.save(order);
    });

    await this.notifications.notifyOrderStatus({
      id: updated.id,
      orderNumber: updated.orderNumber,
      userId: updated.userId,
      status: updated.status,
    });
    this.orderChatGateway.emitToOrder(updated.id, 'deliveryAssigned', {
      orderId: updated.id,
      deliveryId: userId,
      status: updated.status,
    });
    this.emitStatus(updated);

    return this.toSummary(updated);
  }

  async complete(id: string, userId: string) {
    const order = await this.getOrderOrFail(id);
    if (order.deliveryId !== userId) {
      throw new ForbiddenException('No sos el repartidor asignado a este pedido');
    }
    if (order.status !== ACTIVE_STATUS) {
      throw new BadRequestException('El pedido no está en camino');
    }

    order.status = OrderStatus.DELIVERED;
    order.deliveredAt = new Date();
    const saved = await this.orderRepository.save(order);

    await this.notifications.notifyOrderStatus({
      id: saved.id,
      orderNumber: saved.orderNumber,
      userId: saved.userId,
      status: saved.status,
    });
    this.emitStatus(saved);

    return this.toSummary(saved);
  }

  async updateLocation(
    id: string,
    userId: string,
    latitude: number,
    longitude: number,
  ) {
    const order = await this.getOrderOrFail(id);
    if (order.deliveryId !== userId) {
      throw new ForbiddenException('No sos el repartidor asignado a este pedido');
    }
    if (order.status !== ACTIVE_STATUS) {
      throw new BadRequestException('El pedido no está en camino');
    }

    order.deliveryLatitude = latitude;
    order.deliveryLongitude = longitude;
    order.deliveryLocationAt = new Date();
    await this.orderRepository.save(order);

    const payload = {
      orderId: order.id,
      latitude,
      longitude,
      at: order.deliveryLocationAt,
    };
    this.orderChatGateway.emitToOrder(order.id, 'deliveryLocation', payload);
    return payload;
  }

  private assertCanView(user: DeliveryUser, order: Order): void {
    if (user.role === UserRole.ADMIN) return;
    if (user.branchId && order.branchId !== user.branchId) {
      throw new ForbiddenException('El pedido pertenece a otra sucursal');
    }
    if (order.deliveryId === user.userId) return;
    if (!order.deliveryId && order.status === AVAILABLE_STATUS) return;
    throw new ForbiddenException('No tenés acceso a este pedido');
  }

  private emitStatus(order: Order): void {
    this.orderChatGateway.emitOrderStatus(order.id, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      rejectionReason: null,
    });
  }

  private positionOf(order: Order) {
    if (order.deliveryLatitude === null || order.deliveryLongitude === null) {
      return null;
    }
    return {
      latitude: Number(order.deliveryLatitude),
      longitude: Number(order.deliveryLongitude),
      at: order.deliveryLocationAt,
    };
  }

  private async getOrderOrFail(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }
    return order;
  }

  private toSummary(order: Order, totalItems = 0) {
    const address = order.shippingAddress;
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      paymentMethod: order.paymentMethod,
      deliveryId: order.deliveryId,
      deliveryAcceptedAt: order.deliveryAcceptedAt,
      deliveredAt: order.deliveredAt,
      deliveryPosition: this.positionOf(order),
      totalItems,
      shippingAddress: address
        ? {
            street: address.street,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
            country: address.country,
            latitude:
              address.latitude !== null ? Number(address.latitude) : null,
            longitude:
              address.longitude !== null ? Number(address.longitude) : null,
          }
        : null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
