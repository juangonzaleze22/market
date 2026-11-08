import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service.js';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from '../database/entities/index.js';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(
    @Query('categoryId') categoryId?: string,
    @Query('tagId') tagId?: string,
    @Query('tagIds') tagIds?: string,
    @Query('search') search?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('inStock') inStock?: string,
    @Query('sort') sort?: string,
    @Query('bestDeals') bestDeals?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.productsService.findAll({
      categoryId,
      tagId,
      tagIds: tagIds
        ? tagIds.split(',').map((id) => id.trim()).filter(Boolean)
        : undefined,
      search,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      inStock: inStock === 'true' ? true : undefined,
      sort,
      bestDeals: bestDeals === 'true' ? true : undefined,
      branchId,
    });
  }

  @Get('best-sellers')
  findBestSellers(
    @Query('limit') limit?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.productsService.findBestSellers(
      limit ? parseInt(limit, 10) : 8,
      branchId,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('branchId') branchId?: string) {
    return this.productsService.findOne(id, branchId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
