import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service.js';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  findByUser(@CurrentUser('userId') userId: string) {
    return this.cartService.findByUser(userId);
  }

  @Post()
  add(@CurrentUser('userId') userId: string, @Body() dto: AddToCartDto) {
    return this.cartService.add(userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.cartService.remove(userId, id);
  }

  @Delete()
  clear(@CurrentUser('userId') userId: string) {
    return this.cartService.clear(userId);
  }
}
