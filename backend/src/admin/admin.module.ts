import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { UploadController } from './upload.controller.js';
import {
  Branch,
  BranchProductStock,
  Category,
  Expense,
  Order,
  OrderItem,
  Product,
  Tag,
  User,
} from '../database/entities/index.js';
import { ChatModule } from '../chat/chat.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Product, Branch, BranchProductStock, Category, Order, OrderItem, Tag, Expense]),
    ChatModule,
    NotificationsModule,
  ],
  controllers: [AdminController, UploadController],
  providers: [AdminService],
})
export class AdminModule {}
