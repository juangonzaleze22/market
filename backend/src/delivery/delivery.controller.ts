import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service.js';
import type { DeliveryUser } from './delivery.service.js';
import { UpdateLocationDto } from './dto/delivery.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { UserRole } from '../database/entities/index.js';
import { OrderChatService } from '../chat/order-chat.service.js';
import { OrderChatGateway } from '../chat/order-chat.gateway.js';
import type { ChatUser } from '../chat/order-chat.service.js';
import { SendMessageBodyDto } from '../chat/dto/chat.dto.js';

@ApiTags('Delivery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles(UserRole.DELIVERY, UserRole.ADMIN)
@Controller('delivery')
export class DeliveryController {
  constructor(
    private readonly deliveryService: DeliveryService,
    private readonly orderChatService: OrderChatService,
    private readonly orderChatGateway: OrderChatGateway,
  ) {}

  @Get('orders')
  findQueue(
    @CurrentUser() user: DeliveryUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('scope') scope?: 'available' | 'mine' | 'delivered',
  ) {
    return this.deliveryService.findQueue(user, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search,
      scope,
    });
  }

  @Get('orders/:id')
  findOne(
    @CurrentUser() user: DeliveryUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.deliveryService.findOne(user, id);
  }

  @Post('orders/:id/accept')
  accept(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('branchId') branchId?: string | null,
  ) {
    return this.deliveryService.accept(id, userId, branchId);
  }

  @Post('orders/:id/complete')
  complete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.deliveryService.complete(id, userId);
  }

  @Patch('orders/:id/location')
  updateLocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLocationDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.deliveryService.updateLocation(
      id,
      userId,
      dto.latitude,
      dto.longitude,
    );
  }

  @Get('orders/:id/messages')
  getMessages(@CurrentUser() user: ChatUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.orderChatService.listForUser(user, id);
  }

  @Post('orders/:id/messages')
  async sendMessage(
    @CurrentUser() user: ChatUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageBodyDto,
  ) {
    const message = await this.orderChatService.sendMessage(user, {
      orderId: id,
      body: dto.body,
      attachments: dto.attachments,
    });
    this.orderChatGateway.emitToOrder(id, 'message', message);
    return message;
  }
}
