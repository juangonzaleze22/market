import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BranchesService } from './branches.service.js';
import {
  CreateBranchDto,
  CreateZoneDto,
  UpdateBranchDto,
  UpdateZoneDto,
} from './dto/branch.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from '../database/entities/index.js';

@ApiTags('Admin - Branches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/branches')
export class AdminBranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  findAll() {
    return this.branchesService.findAll();
  }

  @Post()
  create(@Body() dto: CreateBranchDto) {
    return this.branchesService.create(dto);
  }

  @Get(':id/zones')
  findZones(@Param('id', ParseUUIDPipe) id: string) {
    return this.branchesService.findZones(id);
  }

  @Post(':id/zones')
  createZone(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateZoneDto,
  ) {
    return this.branchesService.createZone(id, dto);
  }

  @Patch(':id/zones/:zoneId')
  updateZone(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('zoneId', ParseUUIDPipe) zoneId: string,
    @Body() dto: UpdateZoneDto,
  ) {
    return this.branchesService.updateZone(id, zoneId, dto);
  }

  @Delete(':id/zones/:zoneId')
  removeZone(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('zoneId', ParseUUIDPipe) zoneId: string,
  ) {
    return this.branchesService.removeZone(id, zoneId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.branchesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.branchesService.remove(id);
  }
}
