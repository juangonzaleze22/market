import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { DeepPartial } from 'typeorm';
import { hash } from 'bcryptjs';
import {
  Branch,
  BranchProductStock,
  Category,
  Expense,
  ExpenseKind,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  Tag,
  User,
  UserRole,
} from '../database/entities/index.js';
import { resolvePeriod, toDateOnly } from '../common/utils/period.util.js';
import { CreateProductDto, UpdateProductDto } from '../products/dto/product.dto.js';
import {
  normalizeBranchStocks,
  replaceBranchStocks,
  sumBranchStocks,
} from '../products/branch-stock.util.js';
import { CreateCategoryDto, UpdateCategoryDto } from '../categories/dto/category.dto.js';
import { CreateTagDto, UpdateTagDto } from '../tags/dto/tag.dto.js';
import { CreateUserDto, ListUsersQueryDto } from './dto/admin.dto.js';
import { OrderChatGateway } from '../chat/order-chat.gateway.js';
import { OrderChatService } from '../chat/order-chat.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';

const LOW_STOCK_THRESHOLD = 5;

const ORDER_ACCEPTED_MESSAGE =
  '¡Tu pedido fue aceptado! Vamos a proceder con el picking & packing. ' +
  'Cualquier sugerencia o indicación que quieras darnos, podés escribirla por aquí.';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(BranchProductStock)
    private readonly branchStockRepository: Repository<BranchProductStock>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    private readonly orderChatService: OrderChatService,
    private readonly orderChatGateway: OrderChatGateway,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── Stats ────────────────────────────────────────────────────────

  async getStats(branchId?: string) {
    const scope = branchId && branchId !== 'all' ? branchId : null;

    const ordersQb = this.orderRepository.createQueryBuilder('order');
    if (scope) ordersQb.andWhere('order.branchId = :branchId', { branchId: scope });

    const pendingOrdersQb = this.orderRepository
      .createQueryBuilder('order')
      .where('order.status = :status', { status: OrderStatus.PENDING });
    if (scope) pendingOrdersQb.andWhere('order.branchId = :branchId', { branchId: scope });

    const revenueQb = this.orderRepository
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.totalAmount), 0)', 'revenue')
      .where('order.status IN (:...statuses)', {
        statuses: [
          OrderStatus.PAID,
          OrderStatus.SHIPPED,
          OrderStatus.OUT_FOR_DELIVERY,
          OrderStatus.DELIVERED,
        ],
      });
    if (scope) revenueQb.andWhere('order.branchId = :branchId', { branchId: scope });

    const recentOrdersQb = this.orderRepository
      .createQueryBuilder('order')
      .orderBy('order.createdAt', 'DESC')
      .take(5);
    if (scope) recentOrdersQb.andWhere('order.branchId = :branchId', { branchId: scope });

    const [
      totalUsers,
      totalProducts,
      totalCategories,
      totalOrders,
      pendingOrders,
      lowStockProducts,
      revenueRaw,
      recentOrders,
    ] = await Promise.all([
      this.userRepository.count(),
      this.productRepository.count(),
      this.categoryRepository.count(),
      ordersQb.getCount(),
      pendingOrdersQb.getCount(),
      this.productRepository
        .createQueryBuilder('product')
        .where('product.stock <= :threshold', {
          threshold: LOW_STOCK_THRESHOLD,
        })
        .getCount(),
      revenueQb.getRawOne<{ revenue: string }>(),
      recentOrdersQb.getMany(),
    ]);

    return {
      totalUsers,
      totalProducts,
      totalCategories,
      totalOrders,
      pendingOrders,
      lowStockProducts,
      revenue: Number(revenueRaw?.revenue ?? 0),
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: Number(order.totalAmount),
        createdAt: order.createdAt,
      })),
    };
  }

  // ─── Users ────────────────────────────────────────────────────────

  private static readonly USER_SORT_MAP: Record<string, string> = {
    email: 'user.email',
    firstName: 'user.firstName',
    lastName: 'user.lastName',
    role: 'user.role',
    createdAt: 'user.createdAt',
    updatedAt: 'user.updatedAt',
  };

  async findUsers(query: ListUsersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const sortColumn = AdminService.USER_SORT_MAP[query.sort ?? ''] ?? 'user.createdAt';
    const order = query.order ?? 'DESC';

    const qb = this.userRepository
      .createQueryBuilder('user')
      .orderBy(sortColumn, order as 'ASC' | 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.search) {
      qb.where(
        '(user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.role) {
      if (query.search) {
        qb.andWhere('user.role = :role', { role: query.role });
      } else {
        qb.where('user.role = :role', { role: query.role });
      }
    }

    const [users, total] = await qb.getManyAndCount();

    return {
      data: users.map((user) => this.toSafeUser(user)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createUser(dto: CreateUserDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('El correo ya está registrado');
    }

    const passwordHash = await hash(dto.password, 10);
    const payload: DeepPartial<User> = {
      email,
      passwordHash,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      role: dto.role,
      emailVerifiedAt: new Date(),
      branchId: dto.branchId ?? null,
    };
    const phone = dto.phone?.trim();
    if (phone) {
      payload.phone = phone;
    }
    const user = this.userRepository.create(payload);
    const saved = await this.userRepository.save(user);
    return this.toSafeUser(saved);
  }

  async updateUserRole(id: string, role: UserRole, currentUserId: string) {
    if (id === currentUserId) {
      throw new BadRequestException('No puedes cambiar tu propio rol');
    }

    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.role = role;
    const saved = await this.userRepository.save(user);
    return this.toSafeUser(saved);
  }

  async updateUserBranch(id: string, branchId: string | null) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    user.branchId = branchId ?? null;
    const saved = await this.userRepository.save(user);
    return this.toSafeUser(saved);
  }

  async findOneUser(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const statsRaw = await this.orderRepository
      .createQueryBuilder('order')
      .select('COUNT(*)', 'totalOrders')
      .addSelect('COALESCE(SUM(order.totalAmount), 0)', 'totalSpent')
      .addSelect("COUNT(*) FILTER (WHERE order.status = :pending)", 'pendingOrders')
      .addSelect("COUNT(*) FILTER (WHERE order.status = :delivered)", 'deliveredOrders')
      .addSelect("COUNT(*) FILTER (WHERE order.status = :cancelled)", 'cancelledOrders')
      .where('order.userId = :userId', { userId: id })
      .setParameters({
        pending: OrderStatus.PENDING,
        delivered: OrderStatus.DELIVERED,
        cancelled: OrderStatus.CANCELLED,
      })
      .getRawOne();

    const orders = await this.orderRepository.find({
      where: { userId: id },
      order: { createdAt: 'DESC' },
    });

    return {
      user: this.toSafeUser(user),
      stats: {
        totalOrders: parseInt(statsRaw?.totalOrders, 10) || 0,
        totalSpent: parseFloat(statsRaw?.totalSpent) || 0,
        pendingOrders: parseInt(statsRaw?.pendingOrders, 10) || 0,
        deliveredOrders: parseInt(statsRaw?.deliveredOrders, 10) || 0,
        cancelledOrders: parseInt(statsRaw?.cancelledOrders, 10) || 0,
      },
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        totalAmount: Number(o.totalAmount),
        paymentMethod: o.paymentMethod,
        createdAt: o.createdAt,
      })),
    };
  }

  async removeUser(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new BadRequestException('No puedes eliminar tu propia cuenta');
    }

    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.userRepository.remove(user);
    return { deleted: true, id };
  }

  // ─── Products ─────────────────────────────────────────────────────

  private static readonly PRODUCT_SORT_MAP: Record<string, string> = {
    name: 'product.name',
    sku: 'product.sku',
    price: 'product.price',
    costPrice: 'product.costPrice',
    stock: 'product.stock',
    isActive: 'product.isActive',
    createdAt: 'product.createdAt',
    updatedAt: 'product.updatedAt',
  };

  async findProducts(query: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    isActive?: boolean;
    stock?: string;
    sort?: string;
    order?: string;
    tagId?: string;
    branchId?: string;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const branchId = query.branchId?.trim() || null;

    const sortColumn =
      branchId && query.sort === 'stock'
        ? 'branchStock.stock'
        : (AdminService.PRODUCT_SORT_MAP[query.sort ?? ''] ?? 'product.createdAt');
    const order = (query.order ?? 'DESC') as 'ASC' | 'DESC';

    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.tags', 'tags');

    if (branchId) {
      qb.innerJoin(
        'branch_product_stock',
        'branchStock',
        'branchStock.productId = product.id AND branchStock.branchId = :branchId',
        { branchId },
      );
    }

    qb.orderBy(sortColumn, order)
      .skip((page - 1) * limit)
      .take(limit);

    let hasWhere = false;
    const addCondition = (
      condition: string,
      params?: Record<string, unknown>,
    ): void => {
      if (hasWhere) {
        qb.andWhere(condition, params);
      } else {
        qb.where(condition, params);
        hasWhere = true;
      }
    };

    if (query.search) {
      addCondition(
        '(product.name ILIKE :search OR product.sku ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.categoryId) {
      addCondition('category.id = :categoryId', { categoryId: query.categoryId });
    }

    if (query.tagId) {
      addCondition('tags.id = :tagId', { tagId: query.tagId });
    }

    if (query.isActive !== undefined) {
      addCondition('product.isActive = :isActive', { isActive: query.isActive });
    }

    if (query.stock) {
      const stockExpr = branchId ? 'branchStock.stock' : 'product.stock';
      let stockCondition = '';
      if (query.stock === 'low') {
        stockCondition = `${stockExpr} > 0 AND ${stockExpr} <= 5`;
      } else if (query.stock === 'out') {
        stockCondition = `${stockExpr} <= 0`;
      } else if (query.stock === 'in') {
        stockCondition = `${stockExpr} > 5`;
      }
      if (stockCondition) {
        addCondition(stockCondition);
      }
    }

    const [data, total] = await qb.getManyAndCount();

    if (data.length > 0) {
      const stockRows = await this.branchStockRepository.find({
        where: { productId: In(data.map((product) => product.id)) },
      });
      const stocksByProduct = new Map<
        string,
        { branchId: string; stock: number; isActive: boolean }[]
      >();
      for (const row of stockRows) {
        const list = stocksByProduct.get(row.productId) ?? [];
        list.push({
          branchId: row.branchId,
          stock: row.stock,
          isActive: row.isActive,
        });
        stocksByProduct.set(row.productId, list);
      }
      for (const product of data) {
        const branchStocks = stocksByProduct.get(product.id) ?? [];
        (product as any).branchStocks = branchStocks;
        if (branchId) {
          (product as any).branchStock =
            branchStocks.find((entry) => entry.branchId === branchId)?.stock ?? 0;
        }
      }
    }

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createProduct(dto: CreateProductDto) {
    const { tagIds, branchStocks, ...productData } = dto;
    const normalizedStocks = normalizeBranchStocks(branchStocks);

    if (branchStocks !== undefined) {
      productData.stock = sumBranchStocks(normalizedStocks);
    }

    const product = this.productRepository.create(productData);
    const saved = await this.productRepository.save(product);

    if (branchStocks !== undefined) {
      await replaceBranchStocks(
        this.branchStockRepository,
        saved.id,
        normalizedStocks,
      );
    } else {
      await this.assignStockToDefaultBranch(
        saved.id,
        Number(productData.stock ?? 0),
      );
    }

    if (tagIds && tagIds.length > 0) {
      const tags = await this.tagRepository.findByIds(tagIds);
      product.tags = tags;
      await this.productRepository.save(product);
    }

    return this.productRepository.findOne({
      where: { id: saved.id },
      relations: ['category', 'tags'],
    });
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    const { tagIds, branchStocks, ...productData } = dto;
    const normalizedStocks =
      branchStocks !== undefined
        ? normalizeBranchStocks(branchStocks)
        : null;
    if (normalizedStocks) {
      productData.stock = sumBranchStocks(normalizedStocks);
    }

    Object.assign(product, productData);

    if (tagIds !== undefined) {
      const tags = tagIds.length > 0 ? await this.tagRepository.findByIds(tagIds) : [];
      product.tags = tags;
    }

    await this.productRepository.save(product);

    if (normalizedStocks) {
      await replaceBranchStocks(
        this.branchStockRepository,
        id,
        normalizedStocks,
      );
    }

    return this.productRepository.findOne({
      where: { id },
      relations: ['category', 'tags'],
    });
  }

  private async assignStockToDefaultBranch(
    productId: string,
    stock: number,
  ): Promise<void> {
    const branch = await this.branchRepository.findOne({
      where: { isDefault: true },
    });
    if (!branch) return;

    await this.branchStockRepository.save(
      this.branchStockRepository.create({
        productId,
        branchId: branch.id,
        stock: Math.max(0, Math.trunc(stock)),
      }),
    );
  }

  async removeProduct(id: string) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    await this.productRepository.delete(id);
    return { deleted: true, id };
  }

  // ─── Categories ───────────────────────────────────────────────────

  private static readonly CATEGORY_SORT_MAP: Record<string, string> = {
    name: 'category.name',
    slug: 'category.slug',
    description: 'category.description',
    createdAt: 'category.createdAt',
  };

  async findCategories(query: { page?: number; limit?: number; search?: string; sort?: string; order?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const sortColumn = AdminService.CATEGORY_SORT_MAP[query.sort ?? ''] ?? 'category.name';
    const order = (query.order ?? 'ASC') as 'ASC' | 'DESC';

    const qb = this.categoryRepository
      .createQueryBuilder('category')
      .orderBy(sortColumn, order)
      .skip((page - 1) * limit)
      .take(limit);

    if (query.search) {
      qb.where(
        '(category.name ILIKE :search OR category.description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createCategory(dto: CreateCategoryDto) {
    const category = this.categoryRepository.create(dto);
    return this.categoryRepository.save(category);
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }
    Object.assign(category, dto);
    return this.categoryRepository.save(category);
  }

  async removeCategory(id: string) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }
    await this.categoryRepository.delete(id);
    return { deleted: true, id };
  }

  // ─── Dashboard ─────────────────────────────────────────────────────

  async getDashboardData(period?: string, branchId?: string) {
    const { period: resolvedPeriod, from, to } = resolvePeriod(period);
    const toDate = toDateOnly(to);
    const branch = branchId && branchId !== 'all' ? branchId : null;

    const statuses = [
      OrderStatus.PAID,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
    ];
    const activeStatuses = [
      OrderStatus.PENDING,
      OrderStatus.PAID,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.OUT_FOR_DELIVERY,
    ];
    const statusPlaceholders = statuses.map((_, index) => `$${index + 1}`).join(', ');
    const salesParams: unknown[] = [...statuses];

    let topProductsDateClause = '';
    let categoryDateClause = '';
    let costDateClause = '';
    if (from) {
      salesParams.push(from);
      const placeholder = `$${salesParams.length}`;
      topProductsDateClause = ` AND o."createdAt" >= ${placeholder}`;
      categoryDateClause = ` AND o."createdAt" >= ${placeholder}`;
      costDateClause = ` AND o."createdAt" >= ${placeholder}`;
    }

    let salesBranchClause = '';
    if (branch) {
      salesParams.push(branch);
      salesBranchClause = ` AND o."branchId" = $${salesParams.length}`;
    }
    topProductsDateClause += salesBranchClause;
    categoryDateClause += salesBranchClause;
    costDateClause += salesBranchClause;

    const granularity =
      resolvedPeriod === 'today'
        ? 'hour'
        : resolvedPeriod === 'year' || resolvedPeriod === 'all'
          ? 'month'
          : 'day';
    const dateExpression =
      granularity === 'hour'
        ? `TO_CHAR(o."createdAt", 'YYYY-MM-DD HH24:00')`
        : granularity === 'month'
          ? `TO_CHAR(o."createdAt", 'YYYY-MM')`
          : `TO_CHAR(o."createdAt", 'YYYY-MM-DD')`;

    const totalOrdersQb = this.orderRepository.createQueryBuilder('o');
    if (from) totalOrdersQb.andWhere('o.createdAt >= :from', { from });
    if (branch) totalOrdersQb.andWhere('o.branchId = :branchId', { branchId: branch });

    const cancelledOrdersQb = this.orderRepository
      .createQueryBuilder('o')
      .where('o.status = :status', { status: OrderStatus.CANCELLED });
    if (from) cancelledOrdersQb.andWhere('o.createdAt >= :from', { from });
    if (branch) cancelledOrdersQb.andWhere('o.branchId = :branchId', { branchId: branch });

    const completedOrdersQb = this.orderRepository
      .createQueryBuilder('o')
      .where('o.status IN (:...statuses)', { statuses });
    if (from) completedOrdersQb.andWhere('o.createdAt >= :from', { from });
    if (branch) completedOrdersQb.andWhere('o.branchId = :branchId', { branchId: branch });

    const revenueQb = this.orderRepository
      .createQueryBuilder('o')
      .select('COALESCE(SUM(o.totalAmount), 0)', 'revenue')
      .where('o.status IN (:...statuses)', { statuses });
    if (from) revenueQb.andWhere('o.createdAt >= :from', { from });
    if (branch) revenueQb.andWhere('o.branchId = :branchId', { branchId: branch });

    const salesByDayQb = this.orderRepository
      .createQueryBuilder('o')
      .select(dateExpression, 'date')
      .addSelect('COALESCE(SUM(o.totalAmount), 0)', 'revenue')
      .addSelect('COUNT(*)', 'orders')
      .where('o.status IN (:...statuses)', { statuses })
      .groupBy(dateExpression)
      .orderBy(dateExpression, 'ASC');
    if (from) salesByDayQb.andWhere('o.createdAt >= :from', { from });
    if (branch) salesByDayQb.andWhere('o.branchId = :branchId', { branchId: branch });

    const costByDayParams: unknown[] = [...statuses];
    let costByDayDateClause = '';
    if (from) {
      costByDayParams.push(from);
      costByDayDateClause = ` AND o."createdAt" >= $${costByDayParams.length}`;
    }
    if (branch) {
      costByDayParams.push(branch);
      costByDayDateClause += ` AND o."branchId" = $${costByDayParams.length}`;
    }

    const ordersByStatusQb = this.orderRepository
      .createQueryBuilder('o')
      .select('o.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('o.status');
    if (from) ordersByStatusQb.andWhere('o.createdAt >= :from', { from });
    if (branch) ordersByStatusQb.andWhere('o.branchId = :branchId', { branchId: branch });

    const expensesQb = this.expenseRepository
      .createQueryBuilder('expense')
      .select('expense.category', 'category')
      .addSelect('expense.kind', 'kind')
      .addSelect('COALESCE(SUM(expense.amount), 0)', 'total')
      .where('expense.date <= :toDate', { toDate })
      .groupBy('expense.category')
      .addGroupBy('expense.kind');
    if (from) {
      expensesQb.andWhere('expense.date >= :fromDate', {
        fromDate: toDateOnly(from),
      });
    }

    const deliveredOrdersQb = this.orderRepository
      .createQueryBuilder('o')
      .where('o.status = :status', { status: OrderStatus.DELIVERED });
    if (from) deliveredOrdersQb.andWhere('o.createdAt >= :from', { from });
    if (branch) deliveredOrdersQb.andWhere('o.branchId = :branchId', { branchId: branch });

    const pendingOrdersQb = this.orderRepository
      .createQueryBuilder('o')
      .where('o.status = :status', { status: OrderStatus.PENDING });
    if (branch) pendingOrdersQb.andWhere('o.branchId = :branchId', { branchId: branch });

    const ordersToPrepareQb = this.orderRepository
      .createQueryBuilder('o')
      .where('o.status IN (:...statuses)', {
        statuses: [OrderStatus.PENDING, OrderStatus.PAID],
      });
    if (branch) ordersToPrepareQb.andWhere('o.branchId = :branchId', { branchId: branch });

    const inProgressOrdersQb = this.orderRepository
      .createQueryBuilder('o')
      .where('o.status IN (:...statuses)', {
        statuses: [
          OrderStatus.PROCESSING,
          OrderStatus.SHIPPED,
          OrderStatus.OUT_FOR_DELIVERY,
        ],
      });
    if (branch) inProgressOrdersQb.andWhere('o.branchId = :branchId', { branchId: branch });

    const activeProductsQb = this.productRepository
      .createQueryBuilder('p')
      .where('p.isActive = true');

    const inventoryQb = this.productRepository
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.stock), 0)', 'units')
      .addSelect('COALESCE(SUM(p.stock * COALESCE(p.costPrice, 0)), 0)', 'value')
      .where('p.isActive = true');

    const thirtyDaysAgo = new Date(to);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const velocityParams: unknown[] = [...statuses, thirtyDaysAgo];
    let velocityBranchClause = '';
    if (branch) {
      velocityParams.push(branch);
      velocityBranchClause = ` AND o."branchId" = $${velocityParams.length}`;
    }

    const inventoryAtRiskQb = this.productRepository
      .createQueryBuilder('p')
      .select('p.id', 'id')
      .addSelect('p.name', 'name')
      .addSelect('p.sku', 'sku')
      .addSelect('p.stock', 'stock')
      .addSelect(
        `COALESCE(NULLIF(p."featuredImage", ''), NULLIF(split_part(p.images, ',', 1), ''))`,
        'image',
      )
      .where('p.isActive = true')
      .andWhere('p.stock <= :threshold', { threshold: LOW_STOCK_THRESHOLD })
      .orderBy('p.stock', 'ASC')
      .limit(12);

    const velocityByProductQuery = this.orderItemRepository.query(
      `SELECT oi."productId" AS "productId", SUM(oi.quantity)::float AS units
       FROM order_items oi
       INNER JOIN orders o ON o.id = oi."orderId"::uuid
       WHERE o.status IN (${statusPlaceholders})
         AND o."createdAt" >= $${statuses.length + 1}${velocityBranchClause}
         AND oi."productId" IS NOT NULL
       GROUP BY oi."productId"`,
      velocityParams,
    );

    const [
      totalUsers,
      totalOrders,
      activeOrders,
      completedOrders,
      cancelledOrders,
      lowStockProducts,
      outOfStockProducts,
      productsWithoutCost,
      revenueRaw,
      costRaw,
      salesByDay,
      ordersByStatus,
      topProducts,
      salesByCategory,
      lowStockAlerts,
      outOfStockAlerts,
      recentOrders,
      expenseRows,
      deliveredOrders,
      pendingOrders,
      ordersToPrepare,
      inProgressOrders,
      activeProducts,
      inventoryRaw,
      costByDay,
      inventoryAtRiskRows,
      velocityRows,
    ] = await Promise.all([
      this.userRepository.count(),

      totalOrdersQb.getCount(),

      (() => {
        const qb = this.orderRepository
          .createQueryBuilder('o')
          .where('o.status IN (:...statuses)', { statuses: activeStatuses });
        if (branch) qb.andWhere('o.branchId = :branchId', { branchId: branch });
        return qb.getCount();
      })(),

      completedOrdersQb.getCount(),

      cancelledOrdersQb.getCount(),

      this.productRepository
        .createQueryBuilder('p')
        .where('p.isActive = true')
        .andWhere('p.stock > 0 AND p.stock <= :threshold', {
          threshold: LOW_STOCK_THRESHOLD,
        })
        .getCount(),

      this.productRepository
        .createQueryBuilder('p')
        .where('p.isActive = true')
        .andWhere('p.stock <= 0')
        .getCount(),

      this.productRepository
        .createQueryBuilder('p')
        .where('p.isActive = true')
        .andWhere('(p.costPrice IS NULL OR p.costPrice <= 0)')
        .getCount(),

      revenueQb.getRawOne<{ revenue: string }>(),

      this.orderItemRepository.query(
        `SELECT COALESCE(SUM(oi.quantity * COALESCE(oi."unitCost", p."costPrice", 0)), 0)::float AS cost
         FROM order_items oi
         INNER JOIN orders o ON o.id = oi."orderId"::uuid
         LEFT JOIN products p ON p.id = oi."productId"::uuid
         WHERE o.status IN (${statusPlaceholders})${costDateClause}`,
        salesParams,
      ),

      salesByDayQb.getRawMany<{
        date: string;
        revenue: string;
        orders: string;
      }>(),

      ordersByStatusQb.getRawMany<{ status: string; count: string }>(),

      this.orderItemRepository.query(
        `SELECT oi."productName" AS name,
                SUM(oi.quantity)::int AS quantity,
                COALESCE(SUM(oi.subtotal), 0)::float AS revenue
         FROM order_items oi
         INNER JOIN orders o ON o.id = oi."orderId"::uuid
         WHERE o.status IN (${statusPlaceholders})${topProductsDateClause}
         GROUP BY oi."productName"
         ORDER BY SUM(oi.quantity) DESC
         LIMIT 5`,
        salesParams,
      ),

      this.orderItemRepository.query(
        `SELECT c.name, COALESCE(SUM(oi.subtotal), 0)::float AS revenue
         FROM order_items oi
         INNER JOIN orders o ON o.id = oi."orderId"::uuid
         INNER JOIN products p ON p.id = oi."productId"::uuid
         INNER JOIN categories c ON c.id = p."categoryId"::uuid
         WHERE o.status IN (${statusPlaceholders})${categoryDateClause}
         GROUP BY c.name
         ORDER BY SUM(oi.subtotal) DESC`,
        salesParams,
      ),

      this.productRepository
        .createQueryBuilder('p')
        .select('p.id', 'id')
        .addSelect('p.name', 'name')
        .addSelect('p.sku', 'sku')
        .addSelect('p.stock', 'stock')
        .addSelect(
          `COALESCE(NULLIF(p."featuredImage", ''), NULLIF(split_part(p.images, ',', 1), ''))`,
          'image',
        )
        .where('p.isActive = true')
        .andWhere('p.stock > 0 AND p.stock <= :threshold', {
          threshold: LOW_STOCK_THRESHOLD,
        })
        .orderBy('p.stock', 'ASC')
        .limit(10)
        .getRawMany(),

      this.productRepository
        .createQueryBuilder('p')
        .select('p.id', 'id')
        .addSelect('p.name', 'name')
        .addSelect('p.sku', 'sku')
        .addSelect('p.stock', 'stock')
        .addSelect(
          `COALESCE(NULLIF(p."featuredImage", ''), NULLIF(split_part(p.images, ',', 1), ''))`,
          'image',
        )
        .where('p.isActive = true')
        .andWhere('p.stock <= 0')
        .orderBy('p.stock', 'ASC')
        .limit(10)
        .getRawMany(),

      this.orderRepository.find({
        where: branch ? { branchId: branch } : {},
        order: { createdAt: 'DESC' },
        take: 5,
      }),

      expensesQb.getRawMany<{
        category: string;
        kind: string;
        total: string;
      }>(),

      deliveredOrdersQb.getCount(),

      pendingOrdersQb.getCount(),

      ordersToPrepareQb.getCount(),

      inProgressOrdersQb.getCount(),

      activeProductsQb.getCount(),

      inventoryQb.getRawOne<{ units: string; value: string }>(),

      this.orderItemRepository.query(
        `SELECT ${dateExpression} AS date,
                COALESCE(SUM(oi.quantity * COALESCE(oi."unitCost", p."costPrice", 0)), 0)::float AS cost
         FROM order_items oi
         INNER JOIN orders o ON o.id = oi."orderId"::uuid
         LEFT JOIN products p ON p.id = oi."productId"::uuid
         WHERE o.status IN (${statusPlaceholders})${costByDayDateClause}
         GROUP BY ${dateExpression}
         ORDER BY ${dateExpression} ASC`,
        costByDayParams,
      ),

      inventoryAtRiskQb.getRawMany<{
        id: string;
        name: string;
        sku: string;
        stock: string;
        image: string | null;
      }>(),

      velocityByProductQuery,
    ]);

    const totalRevenue = Number(revenueRaw?.revenue ?? 0);
    const totalCost = Number(costRaw?.[0]?.cost ?? 0);
    const grossProfit = totalRevenue - totalCost;
    const grossMarginPercent =
      totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const averageOrderValue =
      completedOrders > 0 ? totalRevenue / completedOrders : 0;
    const cancellationRate =
      totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;

    let operatingExpenses = 0;
    let investmentExpenses = 0;
    const expensesByCategory = new Map<string, number>();
    for (const row of expenseRows) {
      const amount = Number(row.total);
      expensesByCategory.set(
        row.category,
        (expensesByCategory.get(row.category) ?? 0) + amount,
      );
      if (row.kind === ExpenseKind.INVESTMENT) {
        investmentExpenses += amount;
      } else {
        operatingExpenses += amount;
      }
    }

    const netProfit = grossProfit - operatingExpenses;
    const netMarginPercent =
      totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    let comparison: {
      revenue: number | null;
      orders: number | null;
      delivered: number | null;
      averageOrderValue: number | null;
      grossProfit: number | null;
      netProfit: number | null;
      cancellationRatePoints: number | null;
    } | null = null;

    if (from) {
      const rangeMs = Math.max(to.getTime() - from.getTime(), 1);
      const previousFrom = new Date(from.getTime() - rangeMs);
      const previous = await this.getPreviousPeriodMetrics(
        previousFrom,
        from,
        branch,
      );
      comparison = {
        revenue: this.percentChange(totalRevenue, previous.revenue),
        orders: this.percentChange(totalOrders, previous.totalOrders),
        delivered: this.percentChange(
          deliveredOrders,
          previous.deliveredOrders,
        ),
        averageOrderValue: this.percentChange(
          averageOrderValue,
          previous.averageOrderValue,
        ),
        grossProfit: this.percentChange(grossProfit, previous.grossProfit),
        netProfit: this.percentChange(netProfit, previous.netProfit),
        cancellationRatePoints:
          Math.round((cancellationRate - previous.cancellationRate) * 10) / 10,
      };
    }

    const costByDayMap = new Map<string, number>(
      costByDay.map((row: { date: string; cost: string }) => [
        row.date,
        Number(row.cost),
      ]),
    );

    const velocityMap = new Map<string, number>(
      velocityRows.map((row: { productId: string; units: string }) => [
        row.productId,
        Number(row.units),
      ]),
    );

    const inventoryAtRisk = inventoryAtRiskRows
      .map((row) => {
        const stock = Number(row.stock);
        const unitsSold30d = velocityMap.get(row.id) ?? 0;
        const velocityPerDay = Math.round((unitsSold30d / 30) * 100) / 100;
        const daysOfCover =
          velocityPerDay > 0
            ? Math.max(0, Math.round((stock / velocityPerDay) * 10) / 10)
            : null;
        return {
          id: row.id,
          name: row.name,
          sku: row.sku,
          image: row.image,
          stock,
          status: stock <= 0 ? 'out' : 'low',
          unitsSold30d,
          velocityPerDay,
          daysOfCover,
        };
      })
      .sort((a, b) => {
        if (a.stock <= 0 && b.stock > 0) return -1;
        if (b.stock <= 0 && a.stock > 0) return 1;
        const aCover = a.daysOfCover ?? Number.POSITIVE_INFINITY;
        const bCover = b.daysOfCover ?? Number.POSITIVE_INFINITY;
        if (aCover !== bCover) return aCover - bCover;
        return a.stock - b.stock;
      });

    return {
      period: resolvedPeriod,
      granularity,
      from: from ? from.toISOString() : null,
      to: to.toISOString(),
      totalRevenue,
      totalCost,
      grossProfit,
      grossMarginPercent: Math.round(grossMarginPercent * 10) / 10,
      averageOrderValue,
      activeOrders,
      cancellationRate: Math.round(cancellationRate * 10) / 10,
      operatingExpenses,
      investmentExpenses,
      netProfit,
      netMarginPercent: Math.round(netMarginPercent * 10) / 10,
      totalUsers,
      totalOrders,
      completedOrders,
      cancelledOrders,
      deliveredOrders,
      pendingOrders,
      ordersToPrepare,
      inProgressOrders,
      activeProducts,
      inventoryUnits: Number(inventoryRaw?.units ?? 0),
      inventoryValue: Number(inventoryRaw?.value ?? 0),
      comparison,
      lowStockProducts,
      outOfStockProducts,
      productsWithoutCost,
      salesByDay: salesByDay.map((row) => ({
        date: row.date,
        revenue: Number(row.revenue),
        orders: Number(row.orders),
        cost: costByDayMap.get(row.date) ?? 0,
      })),
      inventoryAtRisk,
      ordersByStatus: ordersByStatus.map((row) => ({
        status: row.status,
        count: Number(row.count),
      })),
      topProducts: topProducts.map((row: any) => ({
        name: row.name,
        quantity: Number(row.quantity),
        revenue: Number(row.revenue),
      })),
      salesByCategory: salesByCategory.map((row: any) => ({
        name: row.name,
        revenue: Number(row.revenue),
      })),
      expensesByCategory: [...expensesByCategory.entries()]
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total),
      lowStockAlerts: lowStockAlerts.map((row) => ({
        ...row,
        stock: Number(row.stock),
      })),
      outOfStockAlerts: outOfStockAlerts.map((row) => ({
        ...row,
        stock: Number(row.stock),
      })),
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: Number(order.totalAmount),
        createdAt: order.createdAt,
      })),
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────

  private percentChange(current: number, previous: number): number | null {
    if (previous === 0) return current === 0 ? 0 : null;
    return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
  }

  private async getPreviousPeriodMetrics(
    from: Date,
    to: Date,
    branch?: string | null,
  ) {
    const statuses = [
      OrderStatus.PAID,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.DELIVERED,
    ];
    const statusPlaceholders = statuses.map((_, i) => `$${i + 1}`).join(', ');
    const costParams: unknown[] = [...statuses, from, to];
    let costBranchClause = '';
    if (branch) {
      costParams.push(branch);
      costBranchClause = ` AND o."branchId" = $${costParams.length}`;
    }
    const fromDate = toDateOnly(from);
    const toDate = toDateOnly(to);
    const rangeWhere = 'o.createdAt >= :from AND o.createdAt < :to';

    const [
      revenueRaw,
      totalOrders,
      completedOrders,
      cancelledOrders,
      deliveredOrders,
      costRaw,
      expenseRaw,
    ] = await Promise.all([
      this.orderRepository
        .createQueryBuilder('o')
        .select('COALESCE(SUM(o.totalAmount), 0)', 'revenue')
        .where('o.status IN (:...statuses)', { statuses })
        .andWhere(rangeWhere, { from, to })
        .andWhere(branch ? 'o.branchId = :branchId' : '1=1', { branchId: branch })
        .getRawOne<{ revenue: string }>(),

      this.orderRepository
        .createQueryBuilder('o')
        .where(rangeWhere, { from, to })
        .andWhere(branch ? 'o.branchId = :branchId' : '1=1', { branchId: branch })
        .getCount(),

      this.orderRepository
        .createQueryBuilder('o')
        .where('o.status IN (:...statuses)', { statuses })
        .andWhere(rangeWhere, { from, to })
        .andWhere(branch ? 'o.branchId = :branchId' : '1=1', { branchId: branch })
        .getCount(),

      this.orderRepository
        .createQueryBuilder('o')
        .where('o.status = :status', { status: OrderStatus.CANCELLED })
        .andWhere(rangeWhere, { from, to })
        .andWhere(branch ? 'o.branchId = :branchId' : '1=1', { branchId: branch })
        .getCount(),

      this.orderRepository
        .createQueryBuilder('o')
        .where('o.status = :status', { status: OrderStatus.DELIVERED })
        .andWhere(rangeWhere, { from, to })
        .andWhere(branch ? 'o.branchId = :branchId' : '1=1', { branchId: branch })
        .getCount(),

      this.orderItemRepository.query(
        `SELECT COALESCE(SUM(oi.quantity * COALESCE(oi."unitCost", p."costPrice", 0)), 0)::float AS cost
         FROM order_items oi
         INNER JOIN orders o ON o.id = oi."orderId"::uuid
         LEFT JOIN products p ON p.id = oi."productId"::uuid
         WHERE o.status IN (${statusPlaceholders})
           AND o."createdAt" >= $${statuses.length + 1}
           AND o."createdAt" < $${statuses.length + 2}${costBranchClause}`,
        costParams,
      ),

      this.expenseRepository
        .createQueryBuilder('expense')
        .select('COALESCE(SUM(expense.amount), 0)', 'total')
        .where('expense.kind = :kind', { kind: ExpenseKind.OPERATING })
        .andWhere('expense.date >= :fromDate AND expense.date < :toDate', {
          fromDate,
          toDate,
        })
        .getRawOne<{ total: string }>(),
    ]);

    const revenue = Number(revenueRaw?.revenue ?? 0);
    const cost = Number(costRaw?.[0]?.cost ?? 0);
    const operatingExpenses = Number(expenseRaw?.total ?? 0);
    const grossProfit = revenue - cost;

    return {
      revenue,
      grossProfit,
      netProfit: grossProfit - operatingExpenses,
      totalOrders,
      completedOrders,
      deliveredOrders,
      averageOrderValue:
        completedOrders > 0 ? revenue / completedOrders : 0,
      cancellationRate:
        totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0,
    };
  }

  private toSafeUser(user: User) {
    const { passwordHash: _passwordHash, ...safe } = user;
    return safe;
  }

  // ─── Orders ──────────────────────────────────────────────────────

  private static readonly ORDER_SORT_MAP: Record<string, string> = {
    orderNumber: 'order.orderNumber',
    status: 'order.status',
    totalAmount: 'order.totalAmount',
    createdAt: 'order.createdAt',
    updatedAt: 'order.updatedAt',
  };

  async findOrders(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sort?: string;
    order?: string;
    branchId?: string;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const sortColumn = AdminService.ORDER_SORT_MAP[query.sort ?? ''] ?? 'order.createdAt';
    const order = (query.order ?? 'DESC') as 'ASC' | 'DESC';

    const qb = this.orderRepository
      .createQueryBuilder('order')
      .orderBy(sortColumn, order)
      .skip((page - 1) * limit)
      .take(limit);

    if (query.search) {
      qb.where('order.orderNumber ILIKE :search', { search: `%${query.search}%` });
    }

    if (query.status) {
      if (query.search) {
        qb.andWhere('order.status = :status', { status: query.status });
      } else {
        qb.where('order.status = :status', { status: query.status });
      }
    }

    if (query.branchId && query.branchId !== 'all') {
      qb.andWhere('order.branchId = :branchId', {
        branchId: query.branchId,
      });
    }

    const [data, total] = await qb.getManyAndCount();
    return {
      data: data.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        totalAmount: Number(o.totalAmount),
        userId: o.userId,
        branchId: o.branchId,
        deliveryFee: Number(o.deliveryFee),
        paymentMethod: o.paymentMethod,
        createdAt: o.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOneOrder(id: string) {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    const items = await this.orderItemRepository.find({
      where: { orderId: id },
      relations: ['product'],
    });

    const user = await this.userRepository.findOne({
      where: { id: order.userId },
      select: ['id', 'firstName', 'lastName', 'email', 'phone'],
    });

    const delivery = order.deliveryId
      ? await this.userRepository.findOne({
          where: { id: order.deliveryId },
          select: ['id', 'firstName', 'lastName', 'phone'],
        })
      : null;

    const deliveryPosition =
      order.deliveryLatitude !== null && order.deliveryLongitude !== null
        ? {
            latitude: Number(order.deliveryLatitude),
            longitude: Number(order.deliveryLongitude),
            at: order.deliveryLocationAt,
          }
        : null;

    return {
      ...order,
      totalAmount: Number(order.totalAmount),
      user: user || null,
      delivery: delivery || null,
      deliveryPosition,
      items: items.map((item) => ({
        id: item.id,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
        productId: item.productId,
        productImage: item.product?.featuredImage || item.product?.images?.[0] || null,
      })),
    };
  }

  async updateOrderStatus(id: string, status: OrderStatus) {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    const previousStatus = order.status;
    const wasAccepted = order.status === OrderStatus.PAID;
    const isNowAccepted = status === OrderStatus.PAID;

    order.status = status;
    if (status !== OrderStatus.REJECTED) {
      order.rejectionReason = null;
      order.rejectedAt = null;
    }
    const saved = await this.orderRepository.save(order);

    if (!wasAccepted && isNowAccepted) {
      const systemMessage = await this.orderChatService.createSystemMessage(
        saved.id,
        ORDER_ACCEPTED_MESSAGE,
      );
      this.orderChatGateway.emitToOrder(saved.id, 'message', systemMessage);
    }

    if (previousStatus !== saved.status) {
      this.orderChatGateway.emitOrderStatus(saved.id, {
        orderId: saved.id,
        orderNumber: saved.orderNumber,
        status: saved.status,
        rejectionReason: saved.rejectionReason,
      });
      await this.notifications.notifyOrderStatus({
        id: saved.id,
        orderNumber: saved.orderNumber,
        userId: saved.userId,
        status: saved.status,
        rejectionReason: saved.rejectionReason,
      });
    }

    return {
      id: saved.id,
      orderNumber: saved.orderNumber,
      status: saved.status,
      totalAmount: Number(saved.totalAmount),
      createdAt: saved.createdAt,
    };
  }

  async rejectOrder(id: string, reason: string) {
    const trimmedReason = (reason ?? '').trim();
    if (!trimmedReason) {
      throw new BadRequestException('El motivo de rechazo es obligatorio');
    }

    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }
    if (
      order.status === OrderStatus.PROCESSING ||
      order.status === OrderStatus.SHIPPED ||
      order.status === OrderStatus.OUT_FOR_DELIVERY ||
      order.status === OrderStatus.DELIVERED
    ) {
      throw new BadRequestException(
        'No se puede rechazar un pedido en preparación, enviado o entregado',
      );
    }

    order.status = OrderStatus.REJECTED;
    order.rejectionReason = trimmedReason;
    order.rejectedAt = new Date();
    const saved = await this.orderRepository.save(order);

    this.orderChatGateway.emitOrderStatus(saved.id, {
      orderId: saved.id,
      orderNumber: saved.orderNumber,
      status: saved.status,
      rejectionReason: saved.rejectionReason,
    });

    await this.notifications.notifyOrderStatus({
      id: saved.id,
      orderNumber: saved.orderNumber,
      userId: saved.userId,
      status: saved.status,
      rejectionReason: saved.rejectionReason,
    });

    return {
      id: saved.id,
      orderNumber: saved.orderNumber,
      status: saved.status,
      totalAmount: Number(saved.totalAmount),
      createdAt: saved.createdAt,
      rejectionReason: saved.rejectionReason,
      rejectedAt: saved.rejectedAt,
    };
  }
}
