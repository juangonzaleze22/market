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
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from '../database/entities/user.entity.js';
import { FlashSalesService } from './flash-sales.service.js';
import { CreateFlashSaleDto, UpdateFlashSaleDto } from './dto/flash-sale.dto.js';

@ApiTags('Flash Sales')
@Controller('flash-sales')
export class FlashSalesController {
  constructor(private readonly flashSalesService: FlashSalesService) {}

  @Get('active')
  findActive(@Query('branchId') branchId?: string) {
    return this.flashSalesService.findActive(branchId);
  }
}

@ApiTags('Admin - Flash Sales')
@ApiBearerAuth()
@Controller('admin/flash-sales')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
export class AdminFlashSalesController {
  constructor(private readonly flashSalesService: FlashSalesService) {}

  @Get()
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Query('page') page = '1', @Query('limit') limit = '10') {
    return this.flashSalesService.findAll(+page, +limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.flashSalesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateFlashSaleDto) {
    return this.flashSalesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFlashSaleDto) {
    return this.flashSalesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.flashSalesService.remove(id);
  }
}
