import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service.js';
import { CreateFavoriteDto } from './dto/favorite.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  findByUser(@CurrentUser('userId') userId: string) {
    return this.favoritesService.findByUser(userId);
  }

  @Post()
  add(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateFavoriteDto,
  ) {
    return this.favoritesService.add(userId, dto.productId);
  }

  @Delete(':productId')
  remove(
    @CurrentUser('userId') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.favoritesService.remove(userId, productId);
  }
}
