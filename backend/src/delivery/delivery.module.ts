import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryController } from './delivery.controller.js';
import { DeliveryService } from './delivery.service.js';
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
  controllers: [DeliveryController],
  providers: [DeliveryService],
})
export class DeliveryModule {}
