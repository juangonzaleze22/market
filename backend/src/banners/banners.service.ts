import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Banner } from '../database/entities/banner.entity.js';
import { BannerSettings } from '../database/entities/banner-settings.entity.js';
import {
  CreateBannerDto,
  UpdateBannerDto,
  UpdateBannerSettingsDto,
} from './dto/banner.dto.js';

@Injectable()
export class BannersService {
  constructor(
    @InjectRepository(Banner)
    private readonly bannerRepository: Repository<Banner>,
    @InjectRepository(BannerSettings)
    private readonly settingsRepository: Repository<BannerSettings>,
  ) {}

  async findAll(): Promise<Banner[]> {
    return this.bannerRepository.find({ order: { order: 'ASC', createdAt: 'DESC' } });
  }

  async findActive(): Promise<Banner[]> {
    return this.bannerRepository.find({
      where: { isActive: true },
      order: { order: 'ASC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Banner> {
    const banner = await this.bannerRepository.findOne({ where: { id } });
    if (!banner) {
      throw new NotFoundException('Banner no encontrado');
    }
    return banner;
  }

  async create(dto: CreateBannerDto): Promise<Banner> {
    const banner = this.bannerRepository.create(dto);
    return this.bannerRepository.save(banner);
  }

  async update(id: string, dto: UpdateBannerDto): Promise<Banner> {
    await this.findOne(id);
    await this.bannerRepository.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.bannerRepository.delete(id);
  }

  async reorder(ids: string[]): Promise<void> {
    for (let i = 0; i < ids.length; i++) {
      await this.bannerRepository.update(ids[i], { order: i });
    }
  }

  // ─── Settings ────────────────────────────────────────────────────

  async getSettings(): Promise<BannerSettings> {
    let settings = await this.settingsRepository.findOne({ where: {} });
    if (!settings) {
      settings = this.settingsRepository.create({
        transitionEffect: 'fade',
        autoplayDelay: 3000,
        animationType: 'slide',
        isActive: true,
      });
      await this.settingsRepository.save(settings);
    }
    return settings;
  }

  async updateSettings(dto: UpdateBannerSettingsDto): Promise<BannerSettings> {
    const settings = await this.getSettings();
    Object.assign(settings, dto);
    return this.settingsRepository.save(settings);
  }
}
