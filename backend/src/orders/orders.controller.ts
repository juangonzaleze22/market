import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/order.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { OrderChatService } from '../chat/order-chat.service.js';
import { OrderChatGateway } from '../chat/order-chat.gateway.js';
import type { ChatUser } from '../chat/order-chat.service.js';
import { SendMessageBodyDto } from '../chat/dto/chat.dto.js';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly orderChatService: OrderChatService,
    private readonly orderChatGateway: OrderChatGateway,
  ) {}

  @Get()
  findByUser(@CurrentUser('userId') userId: string) {
    return this.ordersService.findByUser(userId);
  }

  @Get(':id')
  findOne(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.ordersService.findOne(userId, id);
  }

  @Get(':id/items')
  findItems(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.ordersService.findItems(id);
  }

  @Get(':id/full')
  findFull(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.ordersService.findFull(userId, id);
  }

  @Post()
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(userId, dto);
  }

  @Get(':id/messages')
  getMessages(@CurrentUser() user: ChatUser, @Param('id') id: string) {
    return this.orderChatService.listForUser(user, id);
  }

  @Get(':id/delivery')
  getDelivery(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.ordersService.getDeliveryInfo(userId, id);
  }

  @Post(':id/messages')
  async sendMessage(
    @CurrentUser() user: ChatUser,
    @Param('id') id: string,
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
