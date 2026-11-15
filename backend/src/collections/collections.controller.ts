import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from '../database/entities/user.entity.js';
import { CollectionsService } from './collections.service.js';
import {
  CreateCollectionDto,
  ReplaceCollectionProductsDto,
  UpdateCollectionDto,
} from './dto/collection.dto.js';

@ApiTags('Collections')
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  @ApiQuery({ name: 'placement', required: false, enum: ['home', 'shop'] })
  @ApiQuery({ name: 'branchId', required: false })
  findSections(
    @Query('placement') placement: 'home' | 'shop' = 'home',
    @Query('branchId') branchId?: string,
  ) {
    return this.collectionsService.findSections(placement, branchId);
  }

  @Get(':slug')
  findBySlug(
    @Param('slug') slug: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.collectionsService.findBySlug(slug, branchId);
  }
}

@ApiTags('Admin - Collections')
@ApiBearerAuth()
@Controller('admin/collections')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
export class AdminCollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search = '',
  ) {
    return this.collectionsService.findAll(+page, +limit, search);
  }

  @Get('suggestions')
  @ApiQuery({
    name: 'rule',
    required: false,
    enum: ['NEWEST', 'BEST_SELLERS', 'ON_SALE', 'CATEGORY', 'TAG'],
  })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'tagId', required: false })
  @ApiQuery({ name: 'search', required: false })
  suggestions(
    @Query('rule') rule = 'NEWEST',
    @Query('limit') limit = '12',
    @Query('branchId') branchId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('tagId') tagId?: string,
    @Query('search') search?: string,
  ) {
    return this.collectionsService.suggestions(rule as any, {
      limit: +limit,
      branchId,
      categoryId,
      tagId,
      search,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.collectionsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCollectionDto) {
    return this.collectionsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCollectionDto) {
    return this.collectionsService.update(id, dto);
  }

  @Put(':id/products')
  replaceProducts(
    @Param('id') id: string,
    @Body() dto: ReplaceCollectionProductsDto,
  ) {
    return this.collectionsService.replaceProducts(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.collectionsService.remove(id);
  }
}
