import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import {
  Product,
  BranchProductStock,
} from '../database/entities/index.js';
import { Tag } from '../database/entities/tag.entity.js';
import { FlashSalesModule } from '../flash-sales/flash-sales.module.js';
import { StockSubscriptionsModule } from '../stock-subscriptions/stock-subscriptions.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Tag, BranchProductStock]),
    FlashSalesModule,
    StockSubscriptionsModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
