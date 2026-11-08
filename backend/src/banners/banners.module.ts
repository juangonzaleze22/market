import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BannersController } from './banners.controller.js';
import { BannersService } from './banners.service.js';
import { Banner } from '../database/entities/banner.entity.js';
import { BannerSettings } from '../database/entities/banner-settings.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Banner, BannerSettings])],
  controllers: [BannersController],
  providers: [BannersService],
  exports: [BannersService],
})
export class BannersModule {}
