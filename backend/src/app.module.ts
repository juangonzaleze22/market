import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthThrottlerGuard } from './common/guards/auth-throttler.guard.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { ProductsModule } from './products/products.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { TagsModule } from './tags/tags.module.js';
import { CartModule } from './cart/cart.module.js';
import { FavoritesModule } from './favorites/favorites.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { AddressesModule } from './addresses/addresses.module.js';
import { BranchesModule } from './branches/branches.module.js';
import { AdminModule } from './admin/admin.module.js';
import { UploadsModule } from './uploads/uploads.module.js';
import { BannersModule } from './banners/banners.module.js';
import { SettingsModule } from './settings/settings.module.js';
import { FlashSalesModule } from './flash-sales/flash-sales.module.js';
import { WarehouseModule } from './warehouse/warehouse.module.js';
import { DeliveryModule } from './delivery/delivery.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { ExpensesModule } from './expenses/expenses.module.js';
import { StockSubscriptionsModule } from './stock-subscriptions/stock-subscriptions.module.js';
import { UPLOAD_DIR } from './admin/upload.constants.js';
import { DatabaseModule } from './database/database.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: UPLOAD_DIR,
      serveRoot: '/uploads',
      serveStaticOptions: {
        index: false,
        fallthrough: true,
        maxAge: '1y',
        immutable: true,
      },
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    TagsModule,
    CartModule,
    FavoritesModule,
    OrdersModule,
    AddressesModule,
    BranchesModule,
    AdminModule,
    UploadsModule,
    BannersModule,
    SettingsModule,
    FlashSalesModule,
    WarehouseModule,
    DeliveryModule,
    NotificationsModule,
    ExpensesModule,
    StockSubscriptionsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: AuthThrottlerGuard },
  ],
})
export class AppModule {}
