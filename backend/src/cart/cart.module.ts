import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartController } from './cart.controller.js';
import { CartService } from './cart.service.js';
import {
  Branch,
  BranchProductStock,
  CartItem,
  Product,
} from '../database/entities/index.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([CartItem, Product, Branch, BranchProductStock]),
  ],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}
