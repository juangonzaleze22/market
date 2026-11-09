import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Branch } from '../database/entities/branch.entity.js';
import { DeliveryZone } from '../database/entities/delivery-zone.entity.js';
import { Product } from '../database/entities/product.entity.js';
import { BranchProductStock } from '../database/entities/branch-product-stock.entity.js';
import { BranchesController } from './branches.controller.js';
import { AdminBranchesController } from './admin-branches.controller.js';
import { BranchesService } from './branches.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Branch,
      DeliveryZone,
      Product,
      BranchProductStock,
    ]),
  ],
  controllers: [BranchesController, AdminBranchesController],
  providers: [BranchesService],
  exports: [BranchesService],
})
export class BranchesModule {}
