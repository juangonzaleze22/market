import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteSettingsService } from '../../core/services/site-settings.service';

@Component({
  selector: 'app-top-banner',
  encapsulation: ViewEncapsulation.None,
  imports: [RouterLink],
  styles: `
    .top-banner-bar {
      background-color: var(--color-accent);
      color: var(--color-on-accent);
    }

    .top-banner-inner {
      max-width: 1400px;
      margin: 0 auto;
      padding: var(--spacing-sm) var(--spacing-lg);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-lg);
      font-size: var(--text-body-sm);
      line-height: var(--text-body-sm--line-height);
    }

    .top-banner-zone {
      display: none;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .top-banner-zone.is-visible {
      display: flex;
    }

    .top-banner-zone.is-hidden-sm {
      display: none;
    }

    .top-banner-socials {
      gap: var(--spacing-sm);
    }

    .top-banner-socials a {
      display: grid;
      place-items: center;
      width: 22px;
      height: 22px;
      border-radius: var(--radius-full);
      background-color: rgba(28, 128, 87, 0.15);
      color: var(--color-on-accent);
      transition: background-color 0.15s ease;
    }

    .top-banner-socials a:hover {
      background-color: rgba(28, 128, 87, 0.3);
    }

    @media (min-width: 768px) {
      .top-banner-zone.is-hidden-sm {
        display: flex;
      }
    }

    @media (max-width: 639px) {
      app-top-banner {
        display: none !important;
      }
    }
  `,
  template: `
    <div class="top-banner-bar" data-testid="top-banner">
      <div class="top-banner-inner">
        @if (settings().topBannerPhone) {
          <a [href]="'tel:' + settings().topBannerPhone" class="top-banner-zone is-visible hover:opacity-80 transition">
            <span>Llámanos: {{ settings().topBannerPhone }}</span>
          </a>
        } @else {
          <span class="top-banner-zone is-visible"></span>
        }

        @if (settings().topBannerText) {
          <div class="top-banner-zone is-hidden-sm">
            <span>{{ settings().topBannerText }}</span>
            @if (settings().topBannerCtaText && settings().topBannerCtaLink) {
              <a [routerLink]="settings().topBannerCtaLink!" class="underline font-semibold hover:opacity-80 transition">{{ settings().topBannerCtaText }}</a>
            }
          </div>
        }

        @if (settings().socialLinks && settings().socialLinks!.length > 0) {
          <div class="top-banner-zone is-hidden-sm top-banner-socials">
            @for (social of settings().socialLinks!; track social.platform) {
              <a [href]="social.url" target="_blank" rel="noopener" [attr.aria-label]="social.platform" class="hover:opacity-80 transition">
                @switch (social.platform) {
                  @case ('facebook') {
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                    </svg>
                  }
                  @case ('twitter') {
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
                    </svg>
                  }
                  @case ('instagram') {
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                      <circle cx="12" cy="12" r="5"/>
                      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/>
                    </svg>
                  }
                  @default {
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="10"/>
                    </svg>
                  }
                }
              </a>
            }
          </div>
        } @else {
          <span class="top-banner-zone is-hidden-sm"></span>
        }
      </div>
    </div>
  `,
})
export class TopBanner implements OnInit {
  private readonly settingsService = inject(SiteSettingsService);
  protected readonly settings = this.settingsService.settings;

  ngOnInit(): void {
    this.settingsService.load();
  }
}
