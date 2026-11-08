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
import { WarehouseService } from './warehouse.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { UserRole } from '../database/entities/index.js';
import { UpdateItemPickedDto } from './dto/warehouse.dto.js';

@ApiTags('Warehouse')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles(UserRole.WAREHOUSE, UserRole.ADMIN)
@Controller('warehouse')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get('orders')
  findQueue(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('minItems') minItems?: string,
    @Query('maxItems') maxItems?: string,
    @CurrentUser('branchId') branchId?: string | null,
  ) {
    return this.warehouseService.findQueue({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search,
      status,
      dateFrom,
      dateTo,
      minItems: minItems ? parseInt(minItems, 10) : undefined,
      maxItems: maxItems ? parseInt(maxItems, 10) : undefined,
    }, branchId);
  }

  @Get('orders/:id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('branchId') branchId?: string | null,
  ) {
    return this.warehouseService.findOne(id, branchId);
  }

  @Post('orders/:id/start')
  start(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('branchId') branchId?: string | null,
  ) {
    return this.warehouseService.start(id, userId, branchId);
  }

  @Patch('orders/:id/items/:itemId')
  setItemPicked(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateItemPickedDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('branchId') branchId?: string | null,
  ) {
    return this.warehouseService.setItemPicked(
      id,
      itemId,
      dto.picked,
      userId,
      branchId,
    );
  }

  @Post('orders/:id/complete')
  complete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('branchId') branchId?: string | null,
  ) {
    return this.warehouseService.complete(id, userId, branchId);
  }
}
