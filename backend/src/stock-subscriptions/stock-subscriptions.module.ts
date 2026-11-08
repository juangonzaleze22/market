import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product, StockSubscription } from '../database/entities/index.js';
import { MailModule } from '../mail/mail.module.js';
import { StockSubscriptionsController } from './stock-subscriptions.controller.js';
import { StockSubscriptionsService } from './stock-subscriptions.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([StockSubscription, Product]),
    MailModule,
  ],
  controllers: [StockSubscriptionsController],
  providers: [StockSubscriptionsService],
  exports: [StockSubscriptionsService],
})
export class StockSubscriptionsModule {}
