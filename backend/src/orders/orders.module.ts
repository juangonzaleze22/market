import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { Order } from '../database/entities/order.entity.js';
import { OrderItem } from '../database/entities/order-item.entity.js';
import { CartItem } from '../database/entities/cart-item.entity.js';
import { Address } from '../database/entities/address.entity.js';
import { User } from '../database/entities/user.entity.js';
import { BranchProductStock } from '../database/entities/branch-product-stock.entity.js';
import { FlashSalesModule } from '../flash-sales/flash-sales.module.js';
import { BranchesModule } from '../branches/branches.module.js';
import { ChatModule } from '../chat/chat.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      CartItem,
      Address,
      User,
      BranchProductStock,
    ]),
    BranchesModule,
    FlashSalesModule,
    ChatModule,
    NotificationsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
