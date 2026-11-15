import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { Branch } from '../database/entities/branch.entity.js';
import { BranchProductStock } from '../database/entities/branch-product-stock.entity.js';
import { CartItem } from '../database/entities/cart-item.entity.js';
import { Product } from '../database/entities/product.entity.js';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto.js';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(BranchProductStock)
    private readonly branchStockRepository: Repository<BranchProductStock>,
  ) {}

  async findByUser(userId: string, branchId?: string): Promise<CartItem[]> {
    const items = await this.cartRepository.find({
      where: branchId ? { userId, branchId } : { userId },
      relations: ['product'],
    });

    if (!branchId || items.length === 0) return items;

    const productIds = [...new Set(items.map((item) => item.productId))];
    const stocks = await this.branchStockRepository.find({
      where: { branchId, productId: In(productIds) },
    });
    const stockByProduct = new Map(
      stocks.map((stock) => [stock.productId, stock]),
    );

    for (const item of items) {
      if (!item.product) continue;
      const branchStock = stockByProduct.get(item.productId);
      item.product.stock =
        branchStock && branchStock.isActive ? branchStock.stock : 0;
    }

    return items;
  }

  async add(userId: string, dto: AddToCartDto): Promise<CartItem> {
    const product = await this.productRepository.findOne({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    const branchId = await this.resolveBranchId(dto.branchId);

    const existing = await this.cartRepository.findOne({
      where: {
        userId,
        productId: dto.productId,
        ...(branchId ? { branchId } : { branchId: IsNull() }),
      },
    });

    const totalQuantity = existing
      ? existing.quantity + dto.quantity
      : dto.quantity;
    await this.assertStock(product, branchId, totalQuantity);

    if (existing) {
      existing.quantity += dto.quantity;
      if (dto.flashSaleId) {
        existing.flashSaleId = dto.flashSaleId;
        existing.flashSalePrice = dto.flashSalePrice ?? null;
      }
      return this.cartRepository.save(existing);
    }

    const item = this.cartRepository.create({
      userId,
      branchId,
      productId: dto.productId,
      quantity: dto.quantity,
      flashSaleId: dto.flashSaleId ?? null,
      flashSalePrice: dto.flashSalePrice ?? null,
    });
    return this.cartRepository.save(item);
  }

  async update(
    userId: string,
    cartItemId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartItem> {
    const item = await this.cartRepository.findOne({
      where: { id: cartItemId, userId },
      relations: ['product'],
    });
    if (!item) {
      throw new NotFoundException('Item no encontrado');
    }

    const branchId = item.branchId ?? (await this.resolveBranchId());
    await this.assertStock(item.product, branchId, dto.quantity);

    if (!item.branchId && branchId) {
      item.branchId = branchId;
    }
    item.quantity = dto.quantity;
    return this.cartRepository.save(item);
  }

  async remove(userId: string, cartItemId: string): Promise<void> {
    const item = await this.cartRepository.findOne({
      where: { id: cartItemId, userId },
    });
    if (!item) {
      throw new NotFoundException('Item no encontrado');
    }
    await this.cartRepository.remove(item);
  }

  async clear(userId: string, branchId?: string): Promise<void> {
    await this.cartRepository.delete(
      branchId ? { userId, branchId } : { userId },
    );
  }

  private async resolveBranchId(branchId?: string): Promise<string | null> {
    if (branchId) return branchId;

    const fallback = await this.branchRepository.findOne({
      where: { isDefault: true, isActive: true },
      order: { createdAt: 'ASC' },
    });
    if (fallback) return fallback.id;

    const active = await this.branchRepository.findOne({
      where: { isActive: true },
      order: { createdAt: 'ASC' },
    });
    return active?.id ?? null;
  }

  private async assertStock(
    product: Product,
    branchId: string | null,
    quantity: number,
  ): Promise<void> {
    if (!branchId) {
      if (product.stock < quantity) {
        throw new BadRequestException('Stock insuficiente');
      }
      return;
    }

    const branchStock = await this.branchStockRepository.findOne({
      where: { productId: product.id, branchId },
    });
    if (!branchStock || !branchStock.isActive) {
      throw new BadRequestException(
        'Producto no disponible en esta sucursal',
      );
    }
    if (branchStock.stock < quantity) {
      throw new BadRequestException('Stock insuficiente en esta sucursal');
    }
  }
}
