import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  ) {}

  async findByUser(userId: string): Promise<CartItem[]> {
    return this.cartRepository.find({
      where: { userId },
      relations: ['product'],
    });
  }

  async add(userId: string, dto: AddToCartDto): Promise<CartItem> {
    const product = await this.productRepository.findOne({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    const existing = await this.cartRepository.findOne({
      where: { userId, productId: dto.productId },
    });

    const totalQuantity = existing ? existing.quantity + dto.quantity : dto.quantity;
    if (product.stock < totalQuantity) {
      throw new BadRequestException('Stock insuficiente');
    }

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
    if (item.product.stock < dto.quantity) {
      throw new BadRequestException('Stock insuficiente');
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

  async clear(userId: string): Promise<void> {
    await this.cartRepository.delete({ userId });
  }
}
