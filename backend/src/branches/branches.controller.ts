import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BranchesService } from './branches.service.js';

@ApiTags('Branches')
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  findAll() {
    return this.branchesService.findAllPublic();
  }

  @Get('resolve')
  async resolve(@Query('lat') lat?: string, @Query('lng') lng?: string) {
    const resolved = await this.branchesService.resolvePoint(
      parseFloat(lat ?? ''),
      parseFloat(lng ?? ''),
    );
    return {
      branch: resolved.branch,
      zone: resolved.zone,
      inCoverage: Boolean(resolved.branch),
    };
  }

  @Get(':id/zones')
  findZones(@Param('id') id: string) {
    return this.branchesService.findZones(id);
  }
}
