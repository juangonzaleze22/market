import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, type TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from './entities/user.entity.js';
import { Category } from './entities/category.entity.js';
import { Product } from './entities/product.entity.js';
import { CartItem } from './entities/cart-item.entity.js';
import { Favorite } from './entities/favorite.entity.js';
import { Order } from './entities/order.entity.js';
import { OrderItem } from './entities/order-item.entity.js';
import { Address } from './entities/address.entity.js';
import { Branch } from './entities/branch.entity.js';
import { DeliveryZone } from './entities/delivery-zone.entity.js';
import { BranchProductStock } from './entities/branch-product-stock.entity.js';
import { Banner } from './entities/banner.entity.js';
import { BannerSettings } from './entities/banner-settings.entity.js';
import { SiteSettings } from './entities/site-settings.entity.js';
import { Tag } from './entities/tag.entity.js';
import { FlashSale } from './entities/flash-sale.entity.js';
import { FlashSaleItem } from './entities/flash-sale-item.entity.js';
import { OrderMessage } from './entities/order-message.entity.js';
import { Notification } from './entities/notification.entity.js';
import { Expense } from './entities/expense.entity.js';
import { RecurringExpense } from './entities/recurring-expense.entity.js';
import { StockSubscription } from './entities/stock-subscription.entity.js';
import { SeedService } from './seeders/seed.service.js';

const entities = [User, Category, Product, Tag, CartItem, Favorite, Order, OrderItem, Address, Branch, DeliveryZone, BranchProductStock, Banner, BannerSettings, SiteSettings, FlashSale, FlashSaleItem, OrderMessage, Notification, Expense, RecurringExpense, StockSubscription];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const nodeEnv = configService.get<string>('NODE_ENV');
        const syncSetting = configService.get<string>('DB_SYNCHRONIZE');
        const synchronize =
          syncSetting === undefined || syncSetting === ''
            ? nodeEnv !== 'production'
            : syncSetting === 'true';

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST') ?? 'localhost',
          port: configService.get<number>('DB_PORT') ?? 5432,
          username: configService.get<string>('DB_USERNAME') ?? 'postgres',
          password: configService.get<string>('DB_PASSWORD') ?? 'postgres',
          database: configService.get<string>('DB_NAME') ?? 'market_db',
          entities,
          synchronize,
          logging: nodeEnv === 'development',
        };
      },
    }),
    TypeOrmModule.forFeature(entities),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class DatabaseModule {}
