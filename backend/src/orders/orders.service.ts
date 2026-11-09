import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus } from '../database/entities/order.entity.js';
import { OrderItem } from '../database/entities/order-item.entity.js';
import { CartItem } from '../database/entities/cart-item.entity.js';
import { Product } from '../database/entities/product.entity.js';
import { Address } from '../database/entities/address.entity.js';
import { User } from '../database/entities/user.entity.js';
import { Branch } from '../database/entities/branch.entity.js';
import { DeliveryZone } from '../database/entities/delivery-zone.entity.js';
import { BranchProductStock } from '../database/entities/branch-product-stock.entity.js';
import { BranchesService } from '../branches/branches.service.js';
import { CreateOrderDto } from './dto/order.dto.js';
import { FlashSalesService } from '../flash-sales/flash-sales.service.js';
import { OrderChatGateway } from '../chat/order-chat.gateway.js';
import { NotificationsService } from '../notifications/notifications.service.js';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(CartItem)
    private readonly cartRepository: Repository<CartItem>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(BranchProductStock)
    private readonly branchStockRepository: Repository<BranchProductStock>,
    private readonly dataSource: DataSource,
    private readonly branchesService: BranchesService,
    private readonly flashSalesService: FlashSalesService,
    private readonly orderChatGateway: OrderChatGateway,
    private readonly notifications: NotificationsService,
  ) {}

  async findByUser(userId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(userId: string, orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, userId },
    });
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }
    return order;
  }

  async findItems(orderId: string) {
    const items = await this.orderItemRepository.find({
      where: { orderId },
      relations: ['product'],
    });
    return items.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
      productImage: item.product?.featuredImage || item.product?.images?.[0] || null,
      flashSaleId: item.flashSaleId || null,
      originalPrice: item.originalPrice || null,
      hasFlashDiscount: !!item.flashSaleId,
    }));
  }

  async findFull(userId: string, orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, userId },
      relations: ['shippingAddress'],
    });
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    const items = await this.findItems(orderId);

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      receiptUrl: order.receiptUrl,
      rejectionReason: order.rejectionReason,
      rejectedAt: order.rejectedAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      shippingAddress: order.shippingAddress
        ? {
            street: order.shippingAddress.street,
            city: order.shippingAddress.city,
            state: order.shippingAddress.state,
            zipCode: order.shippingAddress.zipCode,
            country: order.shippingAddress.country,
          }
        : null,
      items,
    };
  }

  async getDeliveryInfo(userId: string, orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, userId },
    });
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    const destination = order.shippingAddress
      ? {
          latitude:
            order.shippingAddress.latitude !== null
              ? Number(order.shippingAddress.latitude)
              : null,
          longitude:
            order.shippingAddress.longitude !== null
              ? Number(order.shippingAddress.longitude)
              : null,
        }
      : null;

    if (!order.deliveryId) {
      return {
        assigned: false,
        status: order.status,
        delivery: null,
        position: null,
        destination,
      };
    }

    const delivery = await this.userRepository.findOne({
      where: { id: order.deliveryId },
      select: ['id', 'firstName', 'lastName', 'phone'],
    });

    const position =
      order.deliveryLatitude !== null && order.deliveryLongitude !== null
        ? {
            latitude: Number(order.deliveryLatitude),
            longitude: Number(order.deliveryLongitude),
            at: order.deliveryLocationAt,
          }
        : null;

    return {
      assigned: true,
      status: order.status,
      delivery: delivery
        ? {
            id: delivery.id,
            firstName: delivery.firstName,
            lastName: delivery.lastName,
            phone: delivery.phone,
          }
        : null,
      position,
      destination,
    };
  }

  async create(userId: string, dto: CreateOrderDto): Promise<Order> {
    const address = await this.addressRepository.findOne({
      where: { id: dto.shippingAddressId, userId },
    });
    if (!address) {
      throw new NotFoundException('Dirección no encontrada');
    }

    const cartItems = await this.cartRepository.find({
      where: { userId },
    });
    if (cartItems.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }

    const location = await this.resolveOrderLocation(dto.branchId, address);

    const flashSaleMap = await this.flashSalesService.findActiveForProducts();

    const order = await this.dataSource.transaction(async (manager) => {
      const orderData = manager.create(Order, {
        orderNumber: `ORD-${Date.now()}`,
        userId,
        shippingAddressId: dto.shippingAddressId,
        branchId: location.branch?.id ?? null,
        zoneId: location.zone?.id ?? null,
        deliveryFee: Number(location.zone?.deliveryFee ?? 0),
        status: OrderStatus.PENDING,
        totalAmount: 0,
        paymentMethod: dto.paymentMethod || null,
        receiptUrl: dto.receipt || null,
      } as any);

      const savedOrder = (await manager.save(orderData)) as Order;
      let total = 0;

      for (const item of cartItems) {
        const product = await manager.findOne(Product, {
          where: { id: item.productId },
        });
        if (!product) {
          throw new BadRequestException('Producto no encontrado en el carrito');
        }
        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Stock insuficiente para ${product.name}`,
          );
        }

        let unitPrice = Number(product.price);
        let originalPrice: number | null = null;
        let flashSaleId: string | null = null;

        if (item.flashSaleId && item.flashSalePrice) {
          originalPrice = unitPrice;
          flashSaleId = item.flashSaleId;
          unitPrice = Number(item.flashSalePrice);
        } else {
          const flashInfo = flashSaleMap.get(product.id);
          if (flashInfo) {
            originalPrice = unitPrice;
            flashSaleId = flashInfo.flashSaleId;
            unitPrice = Math.round((unitPrice * (1 - flashInfo.discountPercent / 100)) * 100) / 100;
          }
        }

        const subtotal = unitPrice * item.quantity;
        total += subtotal;

        const orderItem = manager.create(OrderItem, {
          orderId: savedOrder.id,
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice,
          subtotal,
          unitCost: product.costPrice != null ? Number(product.costPrice) : null,
          flashSaleId,
          originalPrice,
        } as any);
        await manager.save(orderItem);

        if (location.branch) {
          const branchStock = await manager.findOne(BranchProductStock, {
            where: {
              productId: product.id,
              branchId: location.branch.id,
            },
          });

          if (branchStock) {
            if (!branchStock.isActive) {
              throw new BadRequestException(
                `Producto no disponible en la sucursal: ${product.name}`,
              );
            }
            if (branchStock.stock < item.quantity) {
              throw new BadRequestException(
                `Stock insuficiente en la sucursal para ${product.name}`,
              );
            }
            await manager.decrement(
              BranchProductStock,
              { id: branchStock.id },
              'stock',
              item.quantity,
            );
          }
        }

        await manager.decrement(
          Product,
          { id: product.id },
          'stock',
          item.quantity,
        );
      }

      total += Number(location.zone?.deliveryFee ?? 0);

      savedOrder.totalAmount = total;
      await manager.save(savedOrder);

      await manager.delete(CartItem, { userId });

      const finalOrder = await manager.findOne(Order, {
        where: { id: savedOrder.id },
      });
      if (!finalOrder) {
        throw new NotFoundException('Pedido no encontrado después de crearlo');
      }
      return finalOrder;
    });

    this.orderChatGateway.emitToAdmins('newOrder', {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      createdAt: order.createdAt,
    });

    await this.notifications.notifyOrderCreated({
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      status: order.status,
      totalAmount: Number(order.totalAmount),
    });

    return order;
  }

  private async resolveOrderLocation(
    branchId: string | undefined,
    address: Address,
  ): Promise<{ branch: Branch | null; zone: DeliveryZone | null }> {
    const hasCoordinates =
      address.latitude != null && address.longitude != null;
    const lat = Number(address.latitude);
    const lng = Number(address.longitude);

    if (branchId) {
      const branch = await this.branchesService.resolveBranchById(branchId);
      if (hasCoordinates) {
        const zone = await this.branchesService.matchZone(
          branchId,
          lat,
          lng,
        );
        if (!zone) {
          throw new BadRequestException(
            'La dirección está fuera de la cobertura de la sucursal seleccionada',
          );
        }
        return { branch, zone };
      }
      return { branch, zone: null };
    }

    if (hasCoordinates) {
      const resolved = await this.branchesService.resolvePoint(lat, lng);
      if (resolved.branch) {
        return { branch: resolved.branch, zone: resolved.zone };
      }
      if (await this.branchesService.hasActiveBranches()) {
        throw new BadRequestException(
          'La dirección está fuera de la cobertura de nuestras sucursales',
        );
      }
    }

    if (address.branchId) {
      const branch = await this.branchesService.resolveBranchById(
        address.branchId,
      );
      const zones = await this.branchesService.findZones(branch.id);
      const zone = address.zoneId
        ? (zones.find((item) => item.id === address.zoneId) ?? null)
        : null;
      return { branch, zone };
    }

    const fallback = await this.branchesService.findDefault();
    return { branch: fallback, zone: null };
  }
}
