import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from '../database/entities/favorite.entity.js';
import { Product } from '../database/entities/product.entity.js';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoriteRepository: Repository<Favorite>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  findByUser(userId: string): Promise<Favorite[]> {
    return this.favoriteRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async add(userId: string, productId: string): Promise<Favorite> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    const existing = await this.favoriteRepository.findOne({
      where: { userId, productId },
    });
    if (existing) {
      return existing;
    }

    const favorite = this.favoriteRepository.create({ userId, productId });
    const saved = await this.favoriteRepository.save(favorite);
    return this.favoriteRepository.findOne({ where: { id: saved.id } }) as Promise<Favorite>;
  }

  async remove(userId: string, productId: string): Promise<void> {
    await this.favoriteRepository.delete({ userId, productId });
  }
}
