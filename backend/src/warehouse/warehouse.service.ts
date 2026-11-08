import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Order, OrderStatus } from '../database/entities/order.entity.js';
import { OrderItem } from '../database/entities/order-item.entity.js';
import { User } from '../database/entities/user.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { OrderChatGateway } from '../chat/order-chat.gateway.js';

const QUEUE_STATUSES = [OrderStatus.PAID, OrderStatus.PROCESSING];
const MAX_PAGE_SIZE = 100;

export interface WarehouseQueueQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  minItems?: number;
  maxItems?: number;
}

@Injectable()
export class WarehouseService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notifications: NotificationsService,
    private readonly orderChatGateway: OrderChatGateway,
  ) {}

  async findQueue(query: WarehouseQueueQuery, branchId?: string | null) {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 10, 1), MAX_PAGE_SIZE);

    const qb = this.orderRepository
      .createQueryBuilder('order')
      .where('order.status IN (:...statuses)', { statuses: QUEUE_STATUSES })
      .orderBy('order.createdAt', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (branchId) {
      qb.andWhere('order.branchId = :branchId', { branchId });
    }

    if (query.status && QUEUE_STATUSES.includes(query.status as OrderStatus)) {
      qb.andWhere('order.status = :status', { status: query.status });
    }

    if (query.search) {
      qb.andWhere('order.orderNumber ILIKE :search', {
        search: `%${query.search}%`,
      });
    }

    if (query.dateFrom) {
      const from = new Date(`${query.dateFrom}T00:00:00`);
      if (!isNaN(from.getTime())) {
        qb.andWhere('order.createdAt >= :dateFrom', { dateFrom: from });
      }
    }

    if (query.dateTo) {
      const to = new Date(`${query.dateTo}T23:59:59.999`);
      if (!isNaN(to.getTime())) {
        qb.andWhere('order.createdAt <= :dateTo', { dateTo: to });
      }
    }

    const minItems = query.minItems;
    const maxItems = query.maxItems;
    const hasMin = typeof minItems === 'number' && !isNaN(minItems);
    const hasMax = typeof maxItems === 'number' && !isNaN(maxItems);
    if (hasMin || hasMax) {
      const rows = await this.orderItemRepository
        .createQueryBuilder('filterItem')
        .select('filterItem.orderId', 'orderId')
        .addSelect('COUNT(*)', 'count')
        .groupBy('filterItem.orderId')
        .getRawMany<{ orderId: string; count: string }>();
      const matchingIds = rows
        .filter((row) => {
          const count = Number(row.count);
          if (hasMin && count < (minItems as number)) return false;
          if (hasMax && count > (maxItems as number)) return false;
          return true;
        })
        .map((row) => row.orderId);
      if (matchingIds.length === 0) {
        return { data: [], total: 0, page, limit, totalPages: 0 };
      }
      qb.andWhere('order.id IN (:...itemFilterIds)', {
        itemFilterIds: matchingIds,
      });
    }

    const [orders, total] = await qb.getManyAndCount();

    const userIds = [...new Set(orders.map((order) => order.userId))];
    const users = userIds.length
      ? await this.userRepository.find({
          where: { id: In(userIds) },
          select: ['id', 'firstName', 'lastName'],
        })
      : [];
    const userMap = new Map(users.map((user) => [user.id, user]));

    const ids = orders.map((order) => order.id);
    const counts = ids.length
      ? await this.orderItemRepository
          .createQueryBuilder('item')
          .select('item.orderId', 'orderId')
          .addSelect('COUNT(*)', 'totalItems')
          .addSelect(
            'SUM(CASE WHEN item.picked THEN 1 ELSE 0 END)',
            'pickedItems',
          )
          .where('item.orderId IN (:...ids)', { ids })
          .groupBy('item.orderId')
          .getRawMany<{
            orderId: string;
            totalItems: string;
            pickedItems: string;
          }>()
      : [];

    const countMap = new Map(
      counts.map((row) => [
        row.orderId,
        {
          totalItems: Number(row.totalItems),
          pickedItems: Number(row.pickedItems),
        },
      ]),
    );

    return {
      data: orders.map((order) => {
        const stats = countMap.get(order.id) ?? {
          totalItems: 0,
          pickedItems: 0,
        };
        const customer = userMap.get(order.userId);
        const customerName = customer
          ? `${customer.firstName} ${customer.lastName}`.trim()
          : null;
        return {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          totalAmount: Number(order.totalAmount),
          paymentMethod: order.paymentMethod,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          totalItems: stats.totalItems,
          pickedItems: stats.pickedItems,
          customerName,
        };
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, branchId?: string | null) {
    const order = await this.orderRepository.findOne({
      where: { id },
    });
    if (!order || (branchId && order.branchId !== branchId)) {
      throw new NotFoundException('Pedido no encontrado');
    }

    const items = await this.orderItemRepository.find({
      where: { orderId: id },
      relations: ['product'],
      order: { productName: 'ASC' },
    });

    const user = await this.userRepository.findOne({
      where: { id: order.userId },
      select: ['id', 'firstName', 'lastName', 'email', 'phone'],
    });

    const mappedItems = items.map((item) => ({
      id: item.id,
      productName: item.productName,
      sku: item.product?.sku ?? null,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
      productId: item.productId,
      productImage:
        item.product?.featuredImage || item.product?.images?.[0] || null,
      picked: item.picked,
      pickedAt: item.pickedAt,
      pickedById: item.pickedById,
    }));

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      preparedAt: order.preparedAt,
      preparedById: order.preparedById,
      totalItems: mappedItems.length,
      pickedItems: mappedItems.filter((item) => item.picked).length,
      user: user
        ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
          }
        : null,
      items: mappedItems,
    };
  }

  async start(id: string, userId: string, branchId?: string | null) {
    const order = await this.getOrderOrFail(id, branchId);
    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException(
        'Solo se pueden iniciar pedidos que estén pagados',
      );
    }

    order.status = OrderStatus.PROCESSING;
    order.preparedById = userId;
    order.preparedAt = null;
    const saved = await this.orderRepository.save(order);
    await this.notifications.notifyOrderStatus({
      id: saved.id,
      orderNumber: saved.orderNumber,
      userId: saved.userId,
      status: saved.status,
    });
    this.orderChatGateway.emitOrderStatus(saved.id, {
      orderId: saved.id,
      orderNumber: saved.orderNumber,
      status: saved.status,
      rejectionReason: null,
    });
    return this.toSummary(saved);
  }

  async setItemPicked(
    orderId: string,
    itemId: string,
    picked: boolean,
    userId: string,
    branchId?: string | null,
  ) {
    const order = await this.getOrderOrFail(orderId, branchId);
    if (order.status !== OrderStatus.PROCESSING) {
      throw new BadRequestException(
        'El pedido no está en preparación. Iniciá la preparación primero.',
      );
    }

    const item = await this.orderItemRepository.findOne({
      where: { id: itemId, orderId },
    });
    if (!item) {
      throw new NotFoundException('Artículo no encontrado');
    }

    item.picked = picked;
    item.pickedAt = picked ? new Date() : null;
    item.pickedById = picked ? userId : null;
    const saved = await this.orderItemRepository.save(item);

    const [totalItems, pickedItems] = await Promise.all([
      this.orderItemRepository.count({ where: { orderId } }),
      this.orderItemRepository.count({ where: { orderId, picked: true } }),
    ]);

    return {
      id: saved.id,
      orderId: saved.orderId,
      picked: saved.picked,
      pickedAt: saved.pickedAt,
      pickedById: saved.pickedById,
      totalItems,
      pickedItems,
    };
  }

  async complete(id: string, userId: string, branchId?: string | null) {
    const order = await this.getOrderOrFail(id, branchId);
    if (order.status !== OrderStatus.PROCESSING) {
      throw new BadRequestException(
        'El pedido no está en preparación. Iniciá la preparación primero.',
      );
    }

    const items = await this.orderItemRepository.find({
      where: { orderId: id },
    });
    if (items.length === 0) {
      throw new BadRequestException('El pedido no tiene artículos');
    }

    const pending = items.filter((item) => !item.picked).length;
    if (pending > 0) {
      throw new BadRequestException(
        `Faltan ${pending} artículo${pending === 1 ? '' : 's'} por preparar`,
      );
    }

    order.status = OrderStatus.SHIPPED;
    order.preparedById = order.preparedById ?? userId;
    order.preparedAt = new Date();
    const saved = await this.orderRepository.save(order);
    await this.notifications.notifyOrderStatus({
      id: saved.id,
      orderNumber: saved.orderNumber,
      userId: saved.userId,
      status: saved.status,
    });
    this.orderChatGateway.emitOrderStatus(saved.id, {
      orderId: saved.id,
      orderNumber: saved.orderNumber,
      status: saved.status,
      rejectionReason: null,
    });
    await this.notifications.notifyDeliveryReady({
      id: saved.id,
      orderNumber: saved.orderNumber,
      userId: saved.userId,
      status: saved.status,
      totalAmount: Number(saved.totalAmount),
    });
    this.orderChatGateway.emitToDeliveries('newReadyOrder', this.toSummary(saved));
    return this.toSummary(saved);
  }

  private async getOrderOrFail(
    id: string,
    branchId?: string | null,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order || (branchId && order.branchId !== branchId)) {
      throw new NotFoundException('Pedido no encontrado');
    }
    return order;
  }

  private toSummary(order: Order) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      preparedAt: order.preparedAt,
      preparedById: order.preparedById,
      updatedAt: order.updatedAt,
    };
  }
}
