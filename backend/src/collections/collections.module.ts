import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collection } from '../database/entities/collection.entity.js';
import { CollectionProduct } from '../database/entities/collection-product.entity.js';
import { Product } from '../database/entities/product.entity.js';
import { BranchProductStock } from '../database/entities/branch-product-stock.entity.js';
import { ProductsModule } from '../products/products.module.js';
import {
  AdminCollectionsController,
  CollectionsController,
} from './collections.controller.js';
import { CollectionsService } from './collections.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Collection,
      CollectionProduct,
      Product,
      BranchProductStock,
    ]),
    ProductsModule,
  ],
  controllers: [CollectionsController, AdminCollectionsController],
  providers: [CollectionsService],
  exports: [CollectionsService],
})
export class CollectionsModule {}
