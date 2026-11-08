import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from '../database/entities/index.js';
import { SubscribeStockDto } from './dto/subscribe.dto.js';
import { StockSubscriptionsService } from './stock-subscriptions.service.js';

@ApiTags('Stock subscriptions')
@Controller('stock-subscriptions')
export class StockSubscriptionsController {
  constructor(
    private readonly stockSubscriptionsService: StockSubscriptionsService,
  ) {}

  @Post()
  subscribe(@Body() dto: SubscribeStockDto) {
    return this.stockSubscriptionsService.subscribe(dto.productId, dto.email);
  }

  @Get('product/:productId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  findByProduct(@Param('productId') productId: string) {
    return this.stockSubscriptionsService.findByProduct(productId);
  }
}
