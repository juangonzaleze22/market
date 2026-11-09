import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';
import { FlashSale } from '../database/entities/flash-sale.entity.js';
import { FlashSaleItem } from '../database/entities/flash-sale-item.entity.js';
import { Product } from '../database/entities/product.entity.js';
import { BranchProductStock } from '../database/entities/branch-product-stock.entity.js';
import { CreateFlashSaleDto, UpdateFlashSaleDto } from './dto/flash-sale.dto.js';

@Injectable()
export class FlashSalesService {
  constructor(
    @InjectRepository(FlashSale)
    private readonly flashSaleRepository: Repository<FlashSale>,
    @InjectRepository(FlashSaleItem)
    private readonly flashSaleItemRepository: Repository<FlashSaleItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(BranchProductStock)
    private readonly branchStockRepository: Repository<BranchProductStock>,
  ) {}

  async findActive(branchId?: string): Promise<any[]> {
    const now = new Date();
    const flashSales = await this.flashSaleRepository.find({
      where: {
        isActive: true,
        startTime: LessThanOrEqual(now),
        endTime: MoreThanOrEqual(now),
      },
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
    });

    const productIds = new Set<string>();
    for (const fs of flashSales) {
      for (const item of fs.items) {
        if (item.product) productIds.add(item.productId);
      }
    }

    const branchStocks =
      branchId && productIds.size > 0
        ? await this.branchStockRepository.find({
            where: { branchId, productId: In([...productIds]) },
          })
        : [];
    const branchStockByProduct = new Map(
      branchStocks.map((row) => [row.productId, row]),
    );

    return flashSales.map((fs) => ({
      id: fs.id,
      title: fs.title,
      discountPercent: Number(fs.discountPercent),
      startTime: fs.startTime,
      endTime: fs.endTime,
      maxItems: fs.maxItems,
      items: fs.items
        .filter((item) => {
          if (!item.product || !item.product.isActive) return false;
          if (!branchId) return true;
          const branchStock = branchStockByProduct.get(item.productId);
          return !!branchStock && branchStock.isActive;
        })
        .slice(0, fs.maxItems)
        .map((item) => {
          const branchStock = branchStockByProduct.get(item.productId);
          return {
            id: item.id,
            productId: item.productId,
            flashSaleId: fs.id,
            quantity: item.quantity,
            product: {
              id: item.product.id,
              name: item.product.name,
              slug: item.product.slug,
              price: Number(item.product.price),
              featuredImage: item.product.featuredImage,
              images: item.product.images,
              discountPercent: item.product.discountPercent,
              discountPrice: item.product.discountPrice,
              hasDiscount: item.product.hasDiscount,
              category: item.product.category,
              stock: branchStock ? branchStock.stock : item.product.stock,
            },
            flashPrice: this.calculateFlashPrice(
              Number(item.product.price),
              Number(fs.discountPercent),
            ),
          };
        }),
    }));
  }

  private calculateFlashPrice(originalPrice: number, discountPercent: number): number {
    const discount = originalPrice * (discountPercent / 100);
    return Math.round((originalPrice - discount) * 100) / 100;
  }

  async findAll(page = 1, limit = 10) {
    const [data, total] = await this.flashSaleRepository.findAndCount({
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: data.map((fs) => ({
        id: fs.id,
        title: fs.title,
        discountPercent: Number(fs.discountPercent),
        startTime: fs.startTime,
        endTime: fs.endTime,
        maxItems: fs.maxItems,
        isActive: fs.isActive,
        itemCount: fs.items.length,
        items: fs.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.product?.name ?? 'Producto eliminado',
          productImage: item.product?.featuredImage || item.product?.images?.[0] || null,
          quantity: item.quantity,
          productStock: item.product?.stock ?? 0,
        })),
        createdAt: fs.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const flashSale = await this.flashSaleRepository.findOne({
      where: { id },
      relations: ['items', 'items.product'],
    });
    if (!flashSale) {
      throw new NotFoundException('Flash sale no encontrada');
    }
    return {
      id: flashSale.id,
      title: flashSale.title,
      discountPercent: Number(flashSale.discountPercent),
      startTime: flashSale.startTime,
      endTime: flashSale.endTime,
      maxItems: flashSale.maxItems,
      isActive: flashSale.isActive,
      items: flashSale.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product?.name ?? 'Producto eliminado',
        productImage: item.product?.featuredImage || item.product?.images?.[0] || null,
        productPrice: item.product ? Number(item.product.price) : 0,
        quantity: item.quantity,
        productStock: item.product?.stock ?? 0,
      })),
      createdAt: flashSale.createdAt,
    };
  }

  async create(dto: CreateFlashSaleDto) {
    if (new Date(dto.startTime) >= new Date(dto.endTime)) {
      throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
    }

    if (dto.products.length === 0) {
      throw new BadRequestException('Debe seleccionar al menos un producto');
    }

    const productIds = dto.products.map((p) => p.productId);
    const products = await this.productRepository.find({
      where: { id: In(productIds) },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('Algunos productos no fueron encontrados');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of dto.products) {
      const product = productMap.get(item.productId);
      if (!product) continue;
      if (item.quantity > product.stock) {
        throw new BadRequestException(
          `La cantidad de "${product.name}" (${item.quantity}) excede el stock disponible (${product.stock})`,
        );
      }
    }

    const flashSale = this.flashSaleRepository.create({
      title: dto.title,
      discountPercent: dto.discountPercent,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      maxItems: dto.maxItems ?? 6,
      isActive: dto.isActive ?? true,
    });

    const saved = await this.flashSaleRepository.save(flashSale);

    const items = dto.products.map((p) =>
      this.flashSaleItemRepository.create({
        flashSaleId: saved.id,
        productId: p.productId,
        quantity: p.quantity,
      }),
    );
    await this.flashSaleItemRepository.save(items);

    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateFlashSaleDto) {
    const flashSale = await this.flashSaleRepository.findOne({ where: { id } });
    if (!flashSale) {
      throw new NotFoundException('Flash sale no encontrada');
    }

    if (dto.startTime && dto.endTime && new Date(dto.startTime) >= new Date(dto.endTime)) {
      throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
    }

    if (dto.title !== undefined) flashSale.title = dto.title;
    if (dto.discountPercent !== undefined) flashSale.discountPercent = dto.discountPercent;
    if (dto.startTime !== undefined) flashSale.startTime = new Date(dto.startTime);
    if (dto.endTime !== undefined) flashSale.endTime = new Date(dto.endTime);
    if (dto.maxItems !== undefined) flashSale.maxItems = dto.maxItems;
    if (dto.isActive !== undefined) flashSale.isActive = dto.isActive;

    await this.flashSaleRepository.save(flashSale);

    if (dto.products !== undefined) {
      if (dto.products.length === 0) {
        throw new BadRequestException('Debe seleccionar al menos un producto');
      }

      const productIds = dto.products.map((p) => p.productId);
      const existingProducts = await this.productRepository.find({
        where: { id: In(productIds) },
      });

      if (existingProducts.length !== productIds.length) {
        throw new BadRequestException('Algunos productos no fueron encontrados');
      }

      const productMap = new Map(existingProducts.map((p) => [p.id, p]));

      for (const item of dto.products) {
        const product = productMap.get(item.productId);
        if (!product) continue;
        if (item.quantity > product.stock) {
          throw new BadRequestException(
            `La cantidad de "${product.name}" (${item.quantity}) excede el stock disponible (${product.stock})`,
          );
        }
      }

      await this.flashSaleItemRepository.delete({ flashSaleId: id });

      const items = dto.products.map((p) =>
        this.flashSaleItemRepository.create({
          flashSaleId: id,
          productId: p.productId,
          quantity: p.quantity,
        }),
      );
      await this.flashSaleItemRepository.save(items);
    }

    return this.findOne(id);
  }

  async remove(id: string) {
    const flashSale = await this.flashSaleRepository.findOne({ where: { id } });
    if (!flashSale) {
      throw new NotFoundException('Flash sale no encontrada');
    }
    await this.flashSaleRepository.remove(flashSale);
    return { deleted: true, id };
  }

  async findActiveForProducts(): Promise<Map<string, { flashSaleId: string; discountPercent: number }>> {
    const now = new Date();
    const flashSales = await this.flashSaleRepository.find({
      where: {
        isActive: true,
        startTime: LessThanOrEqual(now),
        endTime: MoreThanOrEqual(now),
      },
      relations: ['items'],
    });

    const productMap = new Map<string, { flashSaleId: string; discountPercent: number }>();

    for (const fs of flashSales) {
      for (const item of fs.items) {
        if (!productMap.has(item.productId)) {
          productMap.set(item.productId, {
            flashSaleId: fs.id,
            discountPercent: Number(fs.discountPercent),
          });
        }
      }
    }

    return productMap;
  }
}
