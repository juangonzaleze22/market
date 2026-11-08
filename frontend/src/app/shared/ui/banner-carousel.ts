import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  OnInit,
  signal,
  computed,
  OnDestroy,
  AfterViewChecked,
} from '@angular/core';
import { BannerService, Banner, BannerSettings } from '../../core/services/banner.service';
import Swiper from 'swiper';
import {
  Autoplay,
  Pagination,
  EffectFade,
  EffectCube,
  EffectCoverflow,
  EffectFlip,
  Navigation,
} from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import 'swiper/css/effect-cube';
import 'swiper/css/effect-coverflow';
import 'swiper/css/effect-flip';

@Component({
  selector: 'app-banner-carousel',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styles: [
    `
      :host {
        display: block;
      }
      .swiper-banner {
        position: relative;
        width: 100%;
        overflow: hidden;
      }
      .swiper-banner .swiper-wrapper {
        overflow: hidden;
      }
      .swiper-banner .swiper-slide {
        line-height: 0;
        overflow: hidden;
      }
      .swiper-banner .swiper-slide img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .swiper-banner .swiper-button-prev,
      .swiper-banner .swiper-button-next {
        background: rgba(0, 0, 0, 0.35);
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 999px;
        transition: background 0.2s;
      }
      .swiper-banner .swiper-button-prev:hover,
      .swiper-banner .swiper-button-next:hover {
        background: rgba(0, 0, 0, 0.6);
      }
      .swiper-banner .swiper-button-prev::after,
      .swiper-banner .swiper-button-next::after {
        font-size: 16px;
      }
      .swiper-banner .swiper-pagination-bullet {
        background: rgba(255, 255, 255, 0.5);
        opacity: 1;
        width: 8px;
        height: 8px;
        transition: all 0.3s;
      }
      .swiper-banner .swiper-pagination-bullet-active {
        background: #ffffff;
        width: 24px;
        border-radius: 4px;
      }
      .banner-link {
        display: block;
        line-height: 0;
        position: relative;
      }
      .banner-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: var(--spacing-3xl);
        background: linear-gradient(
          to right,
          rgba(0, 0, 0, 0.15) 0%,
          rgba(0, 0, 0, 0.45) 50%,
          rgba(0, 0, 0, 0.15) 100%
        );
        pointer-events: none;
      }
      .banner-subtitle {
        font-size: 0.85rem;
        font-weight: 500;
        color: #c5e6a0;
        letter-spacing: 0.5px;
        margin-bottom: var(--spacing-sm);
      }
      .banner-title {
        font-size: clamp(1.5rem, 4vw, 2.8rem);
        font-weight: 700;
        color: #ffffff;
        line-height: 1.15;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
        max-width: 600px;
      }
      .banner-cta {
        pointer-events: auto;
        display: inline-flex;
        align-items: center;
        gap: var(--spacing-sm);
        margin-top: var(--spacing-xl);
        padding: var(--spacing-md) var(--spacing-xl);
        background: #00b852;
        color: #ffffff;
        font-size: 0.95rem;
        font-weight: 600;
        border-radius: 999px;
        text-decoration: none;
        text-shadow: none;
        transition:
          background 0.2s,
          transform 0.15s;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }
      .banner-cta:hover {
        background: #009e45;
        transform: translateY(-1px);
      }
      .banner-cta svg {
        width: 16px;
        height: 16px;
      }
    `,
  ],
  template: `
    @if (banners().length === 1) {
      <section class="pt-2xl" data-testid="banner-single">
        <a
          [href]="banners()[0].link || '#'"
          class="banner-link overflow-hidden"
          [class.pointer-events-none]="!banners()[0].link"
        >
          <img
            [src]="banners()[0].imageUrl"
            [alt]="banners()[0].title ?? 'Banner promocional'"
            class="w-full h-[200px] sm:h-[280px] md:h-[360px] lg:h-[420px] object-cover"
            fetchpriority="high"
            decoding="async"
            data-testid="banner-image"
          />
          @if (banners()[0].title || banners()[0].subtitle) {
            <div class="banner-overlay">
              @if (banners()[0].subtitle) {
                <p class="banner-subtitle">{{ banners()[0].subtitle }}</p>
              }
              @if (banners()[0].title) {
                <h2 class="banner-title">{{ banners()[0].title }}</h2>
              }
              @if (banners()[0].link) {
                <a [href]="banners()[0].link" class="banner-cta" data-testid="banner-cta">
                  Ver más
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fill-rule="evenodd"
                      d="M3 10a.75.75 0 0 1 .75-.75h10.638L11.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.04-1.08l3.158-2.96H3.75A.75.75 0 0 1 3 10Z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </a>
              }
            </div>
          }
        </a>
      </section>
    } @else if (banners().length > 1) {
      <section class="" data-testid="banner-carousel">
        <div class="swiper-banner" data-testid="swiper-banner">
          <div class="swiper-wrapper">
            @for (banner of banners(); track banner.id) {
              <div class="swiper-slide">
                <a
                  [href]="banner.link || '#'"
                  class="banner-link"
                  [class.pointer-events-none]="!banner.link"
                >
                  <img
                    [src]="banner.imageUrl"
                    [alt]="banner.title ?? 'Banner promocional'"
                    class="w-full h-[200px] sm:h-[280px] md:h-[360px] lg:h-[420px] object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  @if (banner.title || banner.subtitle) {
                    <div class="banner-overlay">
                      @if (banner.subtitle) {
                        <p class="banner-subtitle">{{ banner.subtitle }}</p>
                      }
                      @if (banner.title) {
                        <h2 class="banner-title">{{ banner.title }}</h2>
                      }
                      @if (banner.link) {
                        <a [href]="banner.link" class="banner-cta" data-testid="banner-cta">
                          Ver más
                          <svg viewBox="0 0 20 20" fill="currentColor">
                            <path
                              fill-rule="evenodd"
                              d="M3 10a.75.75 0 0 1 .75-.75h10.638L11.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.04-1.08l3.158-2.96H3.75A.75.75 0 0 1 3 10Z"
                              clip-rule="evenodd"
                            />
                          </svg>
                        </a>
                      }
                    </div>
                  }
                </a>
              </div>
            }
          </div>
          <div class="swiper-button-prev"></div>
          <div class="swiper-button-next"></div>
          <div class="swiper-pagination"></div>
        </div>
      </section>
    }
  `,
})
export class BannerCarousel implements OnInit, AfterViewChecked, OnDestroy {
  private readonly bannerService = inject(BannerService);

  protected readonly banners = signal<Banner[]>([]);
  protected readonly settings = signal<BannerSettings | null>(null);

  private swiperInstance: Swiper | null = null;
  private swiperReady = false;

  protected readonly effectType = computed(() => this.settings()?.transitionEffect ?? 'fade');
  protected readonly autoplayDelay = computed(() => this.settings()?.autoplayDelay ?? 3000);

  ngOnInit(): void {
    this.bannerService.getActive().subscribe((banners) => {
      this.banners.set(banners);
      this.swiperReady = true;
    });
    this.bannerService.getSettings().subscribe((settings) => this.settings.set(settings));
  }

  ngAfterViewChecked(): void {
    if (this.swiperReady && this.banners().length > 1 && !this.swiperInstance) {
      this.initSwiper();
    }
    if (this.swiperInstance && this.settings()) {
      this.updateSwiper();
    }
  }

  ngOnDestroy(): void {
    this.destroySwiper();
  }

  private initSwiper(): void {
    const effect = this.effectType();
    const delay = this.autoplayDelay();

    const modules: any[] = [Autoplay, Pagination, Navigation];

    const effectConfig: Record<string, any> = {
      fade: { EffectFade, fadeEffect: { crossFade: true } },
      cube: {
        EffectCube,
        cubeEffect: { shadow: true, slideShadows: true, shadowOffset: 20, shadowScale: 0.94 },
      },
      coverflow: {
        EffectCoverflow,
        coverflowEffect: { rotate: 50, stretch: 0, depth: 100, modifier: 1, slideShadows: true },
      },
      flip: { EffectFlip, flipEffect: { slideShadows: true, limitRotation: true } },
    };

    const cfg = effectConfig[effect];
    if (cfg) {
      modules.push(cfg.Effect);
    }

    this.swiperInstance = new Swiper('.swiper-banner', {
      modules,
      effect: effect !== 'slide' ? effect : undefined,
      loop: true,
      autoplay: {
        delay,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      ...(cfg ? { [effect + 'Effect']: cfg[effect + 'Effect'] } : {}),
    });

    this.swiperReady = false;
  }

  private updateSwiper(): void {
    if (!this.swiperInstance) return;
    const delay = this.autoplayDelay();
    if (this.swiperInstance.params.autoplay) {
      (this.swiperInstance.params.autoplay as any).delay = delay;
      this.swiperInstance.autoplay.stop();
      this.swiperInstance.autoplay.start();
    }
  }

  private destroySwiper(): void {
    if (this.swiperInstance) {
      this.swiperInstance.destroy();
      this.swiperInstance = null;
    }
  }
}
