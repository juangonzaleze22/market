import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Product } from '../database/entities/product.entity.js';
import { OrderStatus } from '../database/entities/order.entity.js';
import { Tag } from '../database/entities/tag.entity.js';
import { BranchProductStock } from '../database/entities/branch-product-stock.entity.js';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto.js';
import { FlashSalesService } from '../flash-sales/flash-sales.service.js';
import { StockSubscriptionsService } from '../stock-subscriptions/stock-subscriptions.service.js';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(BranchProductStock)
    private readonly branchStockRepository: Repository<BranchProductStock>,
    private readonly flashSalesService: FlashSalesService,
    private readonly stockSubscriptionsService: StockSubscriptionsService,
  ) {}

  private async attachFlashPrices(
    products: Product[],
    branchId?: string | null,
  ): Promise<any[]> {
    const flashMap = await this.flashSalesService.findActiveForProducts();

    let stockByProduct = new Map<string, number>();
    if (branchId && products.length > 0) {
      const rows = await this.branchStockRepository.find({
        where: {
          branchId,
          productId: In(products.map((product) => product.id)),
        },
      });
      stockByProduct = new Map(rows.map((row) => [row.productId, row.stock]));
    }

    return products.map((p) => {
      const flash = flashMap.get(p.id);
      const branchStock = branchId ? stockByProduct.get(p.id) : undefined;
      return {
        ...p,
        stock: branchStock ?? p.stock,
        flashPrice: flash
          ? this.calculateFlashPrice(Number(p.price), flash.discountPercent)
          : null,
        flashSaleId: flash ? flash.flashSaleId : null,
      };
    });
  }

  private calculateFlashPrice(
    originalPrice: number,
    discountPercent: number,
  ): number {
    const discount = originalPrice * (discountPercent / 100);
    return Math.round((originalPrice - discount) * 100) / 100;
  }

  async findAll(
    query: {
      categoryId?: string;
      tagId?: string;
      tagIds?: string[];
      search?: string;
      minPrice?: number;
      maxPrice?: number;
      inStock?: boolean;
      sort?: string;
      bestDeals?: boolean;
      branchId?: string;
    } = {},
  ): Promise<any[]> {
    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.tags', 'tags')
      .where('product.isActive = :isActive', { isActive: true });

    if (query.categoryId) {
      qb.andWhere('product.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    if (query.tagIds && query.tagIds.length > 0) {
      qb.andWhere('tags.id IN (:...tagIds)', { tagIds: query.tagIds });
    } else if (query.tagId) {
      qb.andWhere('tags.id = :tagId', { tagId: query.tagId });
    }

    if (query.search) {
      qb.andWhere('product.name ILIKE :search', {
        search: `%${query.search}%`,
      });
    }

    if (query.minPrice !== undefined) {
      qb.andWhere('product.price >= :minPrice', { minPrice: query.minPrice });
    }

    if (query.maxPrice !== undefined) {
      qb.andWhere('product.price <= :maxPrice', { maxPrice: query.maxPrice });
    }

    if (query.inStock) {
      qb.andWhere('product.stock > :stock', { stock: 0 });
    }

    if (query.bestDeals) {
      qb.andWhere('product.hasDiscount = :hasDiscount', { hasDiscount: true });
    }

    // Sorting: available products always come first, then the requested sort
    const availabilityOrder = 'CASE WHEN product.stock > 0 THEN 0 ELSE 1 END';
    switch (query.sort) {
      case 'price-asc':
        qb.orderBy(availabilityOrder, 'ASC').addOrderBy('product.price', 'ASC');
        break;
      case 'price-desc':
        qb.orderBy(availabilityOrder, 'ASC').addOrderBy(
          'product.price',
          'DESC',
        );
        break;
      case 'name-asc':
        qb.orderBy(availabilityOrder, 'ASC').addOrderBy('product.name', 'ASC');
        break;
      case 'name-desc':
        qb.orderBy(availabilityOrder, 'ASC').addOrderBy('product.name', 'DESC');
        break;
      case 'discount-desc':
        qb.orderBy(availabilityOrder, 'ASC').addOrderBy(
          'product.discountPercent',
          'DESC',
        );
        break;
      default:
        qb.orderBy(availabilityOrder, 'ASC').addOrderBy(
          'product.createdAt',
          'DESC',
        );
    }

    return this.attachFlashPrices(await qb.getMany(), query.branchId);
  }

  async findBestSellers(limit = 8, branchId?: string): Promise<any[]> {
    const safeLimit = Math.min(Math.max(limit, 1), 24);
    const rows: { id: string; soldCount: number }[] =
      await this.productRepository.query(
        `SELECT oi."productId"::text AS id, SUM(oi.quantity)::int AS "soldCount"
       FROM order_items oi
       INNER JOIN orders o ON o.id = oi."orderId"::uuid
       INNER JOIN products p ON p.id = oi."productId"::uuid
       WHERE o.status IN ($1, $2, $3, $4) AND p."isActive" = true
       GROUP BY oi."productId"
       ORDER BY SUM(oi.quantity) DESC
       LIMIT $5`,
        [
          OrderStatus.PAID,
          OrderStatus.SHIPPED,
          OrderStatus.OUT_FOR_DELIVERY,
          OrderStatus.DELIVERED,
          safeLimit * 4,
        ],
      );

    if (rows.length === 0) return [];

    const products = await this.productRepository.find({
      where: { id: In(rows.map((row) => row.id)), isActive: true },
      relations: ['category', 'tags'],
    });
    const productById = new Map(
      products.map((product) => [product.id, product]),
    );

    const ordered = rows
      .map((row) => {
        const product = productById.get(row.id);
        return product
          ? { ...product, soldCount: Number(row.soldCount) }
          : null;
      })
      .filter(
        (product): product is Product & { soldCount: number } =>
          product !== null,
      );

    // Available products first; out-of-stock ones go last keeping sold count order
    ordered.sort((a, b) => {
      const aAvailable = Number(a.stock) > 0 ? 0 : 1;
      const bAvailable = Number(b.stock) > 0 ? 0 : 1;
      return aAvailable - bAvailable;
    });

    return this.attachFlashPrices(ordered.slice(0, safeLimit), branchId);
  }

  async findAllPaginated(
    query: {
      page?: number;
      limit?: number;
      search?: string;
      branchId?: string;
    } = {},
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.tags', 'tags')
      .orderBy('product.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.search) {
      qb.where('(product.name ILIKE :search OR product.sku ILIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const [data, total] = await qb.getManyAndCount();
    const flashData = await this.attachFlashPrices(data, query.branchId);
    return {
      data: flashData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, branchId?: string): Promise<any> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'tags'],
    });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    const [flashProduct] = await this.attachFlashPrices([product], branchId);
    return flashProduct;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const { tagIds, ...productData } = dto;
    const product = this.productRepository.create(productData);
    const saved = await this.productRepository.save(product);

    if (tagIds && tagIds.length > 0) {
      const tags = await this.tagRepository.findByIds(tagIds);
      product.tags = tags;
      await this.productRepository.save(product);
    }

    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    const { tagIds, ...productData } = dto;
    const previousStock = Number(product.stock);
    Object.assign(product, productData);

    if (tagIds !== undefined) {
      const tags =
        tagIds.length > 0 ? await this.tagRepository.findByIds(tagIds) : [];
      product.tags = tags;
    }

    await this.productRepository.save(product);

    if (previousStock <= 0 && Number(product.stock) > 0) {
      void this.stockSubscriptionsService
        .notifyRestock(id)
        .catch(() => undefined);
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.productRepository.delete(id);
  }
}
