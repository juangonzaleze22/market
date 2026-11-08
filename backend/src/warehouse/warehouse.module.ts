import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WarehouseController } from './warehouse.controller.js';
import { WarehouseService } from './warehouse.service.js';
import { Order } from '../database/entities/order.entity.js';
import { OrderItem } from '../database/entities/order-item.entity.js';
import { User } from '../database/entities/user.entity.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { ChatModule } from '../chat/chat.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, User]),
    NotificationsModule,
    ChatModule,
  ],
  controllers: [WarehouseController],
  providers: [WarehouseService],
})
export class WarehouseModule {}
