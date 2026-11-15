import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SiteSettings,
  SiteTheme,
} from '../database/entities/site-settings.entity.js';
import { UpdateSiteSettingsDto } from './dto/settings.dto.js';

export const DEFAULT_THEME: SiteTheme = {
  colors: {
    primary: '#1C8057',
    onPrimary: '#ffffff',
    accent: '#f5a623',
    onAccent: '#1C8057',
    link: '#1C8057',
  },
  branding: {
    brandName: 'Tu Mercadito',
    logoUrl: '/assets/icons/logo.png',
    logoDarkUrl: '/assets/icons/logo-white.webp',
    faviconUrl: '/favicon.ico',
    pwaIconUrl: '/icons/icon-192x192.png',
  },
};

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SiteSettings)
    private readonly settingsRepository: Repository<SiteSettings>,
  ) {}

  async get(): Promise<SiteSettings> {
    let settings = await this.settingsRepository.findOne({ where: {} });
    if (!settings) {
      settings = this.settingsRepository.create({
        topBannerText: 'Regístrate y obtén 25% OFF en tu primer pedido.',
        topBannerPhone: '+123-456-789',
        topBannerCtaText: 'Regístrate ahora',
        topBannerCtaLink: '/register',
        deliveryHours: 'Entregamos todos los días de 7:00 a 22:00',
        secondaryLinks: [
          { label: 'Sobre nosotros', url: '/about' },
          { label: 'Mi cuenta', url: '/orders' },
          { label: 'Lista de deseos', url: '/shop' },
        ],
        socialLinks: [
          { platform: 'facebook', url: 'https://facebook.com' },
          { platform: 'twitter', url: 'https://twitter.com' },
          { platform: 'instagram', url: 'https://instagram.com' },
        ],
        promoMessage: 'Envío gratis en pedidos mayores a $50',
        theme: DEFAULT_THEME,
      });
      await this.settingsRepository.save(settings);
    }
    if (!settings.theme) {
      settings.theme = DEFAULT_THEME;
      await this.settingsRepository.save(settings);
    }
    return settings;
  }

  async update(dto: UpdateSiteSettingsDto): Promise<SiteSettings> {
    const settings = await this.get();
    Object.assign(settings, dto);
    return this.settingsRepository.save(settings);
  }
}
