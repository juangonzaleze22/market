import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Product } from '../database/entities/product.entity.js';
import { StockSubscription } from '../database/entities/stock-subscription.entity.js';
import { MailService } from '../mail/mail.service.js';

@Injectable()
export class StockSubscriptionsService {
  private readonly logger = new Logger(StockSubscriptionsService.name);

  constructor(
    @InjectRepository(StockSubscription)
    private readonly subscriptionRepository: Repository<StockSubscription>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly mailService: MailService,
  ) {}

  async subscribe(productId: string, email: string) {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await this.subscriptionRepository.findOne({
      where: { productId, email: normalizedEmail },
    });

    if (existing) {
      if (existing.notifiedAt) {
        existing.notifiedAt = null;
        await this.subscriptionRepository.save(existing);
      }
      return { subscribed: true, alreadySubscribed: true };
    }

    await this.subscriptionRepository.save(
      this.subscriptionRepository.create({
        productId,
        email: normalizedEmail,
      }),
    );

    return { subscribed: true, alreadySubscribed: false };
  }

  async findByProduct(productId: string): Promise<StockSubscription[]> {
    return this.subscriptionRepository.find({
      where: { productId },
      order: { createdAt: 'DESC' },
    });
  }

  async notifyRestock(productId: string): Promise<number> {
    const pending = await this.subscriptionRepository.find({
      where: { productId, notifiedAt: IsNull() },
    });
    if (pending.length === 0) return 0;

    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) return 0;

    let sent = 0;
    for (const subscription of pending) {
      try {
        await this.mailService.sendBackInStockEmail({
          to: subscription.email,
          productName: product.name,
          productId,
        });
        subscription.notifiedAt = new Date();
        await this.subscriptionRepository.save(subscription);
        sent += 1;
      } catch (error) {
        this.logger.warn(
          `No se pudo avisar a ${subscription.email}: ${String(error)}`,
        );
      }
    }

    return sent;
  }
}
