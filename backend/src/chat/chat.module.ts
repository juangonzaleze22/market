import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { Order } from '../database/entities/order.entity.js';
import { OrderMessage } from '../database/entities/order-message.entity.js';
import { User } from '../database/entities/user.entity.js';
import { OrderChatGateway } from './order-chat.gateway.js';
import { OrderChatService } from './order-chat.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderMessage, Order, User]),
    AuthModule,
    NotificationsModule,
  ],
  providers: [OrderChatService, OrderChatGateway],
  exports: [OrderChatService, OrderChatGateway],
})
export class ChatModule {}
