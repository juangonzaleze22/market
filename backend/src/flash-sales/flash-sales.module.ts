import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlashSale } from '../database/entities/flash-sale.entity.js';
import { FlashSaleItem } from '../database/entities/flash-sale-item.entity.js';
import { Product } from '../database/entities/product.entity.js';
import { FlashSalesService } from './flash-sales.service.js';
import { FlashSalesController, AdminFlashSalesController } from './flash-sales.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([FlashSale, FlashSaleItem, Product])],
  controllers: [FlashSalesController, AdminFlashSalesController],
  providers: [FlashSalesService],
  exports: [FlashSalesService],
})
export class FlashSalesModule {}
