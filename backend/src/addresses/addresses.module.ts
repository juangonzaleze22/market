import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressesController } from './addresses.controller.js';
import { AddressesService } from './addresses.service.js';
import { Address } from '../database/entities/index.js';
import { BranchesModule } from '../branches/branches.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Address]), BranchesModule],
  controllers: [AddressesController],
  providers: [AddressesService],
  exports: [AddressesService],
})
export class AddressesModule {}
