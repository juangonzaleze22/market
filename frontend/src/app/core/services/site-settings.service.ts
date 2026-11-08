import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of, tap } from 'rxjs';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

export interface SiteSettings {
  id: string;
  topBannerText: string | null;
  topBannerPhone: string | null;
  topBannerCtaText: string | null;
  topBannerCtaLink: string | null;
  deliveryHours: string | null;
  secondaryLinks: { label: string; url: string }[] | null;
  socialLinks: { platform: string; url: string }[] | null;
  promoMessage: string | null;
  paymentInfo: {
    pago_movil?: { bank: string; phone: string; holderName: string; idDocument: string };
    zelle?: { email: string; holderName: string };
  } | null;
  updatedAt: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  id: '',
  topBannerText: 'Regístrate y obtén 25% OFF en tu primer pedido.',
  topBannerPhone: environment.defaultBannerPhone,
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
  paymentInfo: null,
  updatedAt: '',
};

@Injectable({
  providedIn: 'root',
})
export class SiteSettingsService {
  private readonly path = 'settings';
  private loaded = false;

  readonly settings = signal<SiteSettings>(DEFAULT_SETTINGS);

  constructor(private http: HttpClient, private api: ApiService) {}

  load(): void {
    if (this.loaded) return;
    this.http
      .get<SiteSettings>(this.api.url(this.path))
      .pipe(
        catchError(() => of(DEFAULT_SETTINGS)),
        tap(() => (this.loaded = true)),
      )
      .subscribe((s) => this.settings.set(s));
  }
}
