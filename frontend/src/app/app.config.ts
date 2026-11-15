import { ApplicationConfig, DEFAULT_CURRENCY_CODE, LOCALE_ID, inject, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import localeEsVe from '@angular/common/locales/es-VE';
import localeEn from '@angular/common/locales/en';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideLucideIcons, LucideLaptop, LucideShirt, LucideHome, LucideTrophy, LucideSparkles, LucideBookOpen, LucideToyBrick, LucideShoppingBag, LucideShoppingBasket, LucideCupSoda, LucideMilk, LucideBeef, LucideCarrot, LucideCookie, LucideSprayCan } from '@lucide/angular';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { SiteSettingsService } from './core/services/site-settings.service';
import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { environment } from '../environments/environment';

registerLocaleData(localeEs);
registerLocaleData(localeEsVe);
registerLocaleData(localeEn);

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: environment.locale },
    { provide: DEFAULT_CURRENCY_CODE, useValue: environment.currencyCode },
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withViewTransitions()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAppInitializer(() => inject(SiteSettingsService).loadInitial()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
    provideLucideIcons(
      LucideLaptop,
      LucideShirt,
      LucideHome,
      LucideTrophy,
      LucideSparkles,
      LucideBookOpen,
      LucideToyBrick,
      LucideShoppingBag,
      LucideShoppingBasket,
      LucideCupSoda,
      LucideMilk,
      LucideBeef,
      LucideCarrot,
      LucideCookie,
      LucideSprayCan,
    ),
    provideCharts(withDefaultRegisterables()),
  ]
};
