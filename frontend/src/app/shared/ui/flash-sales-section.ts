import {
  Component,
  computed,
  effect,
  inject,
  OnInit,
  OnDestroy,
  signal,
  untracked,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { SectionHeader } from './section-header';
import {
  FlashSalesService,
  FlashSale,
  FlashSaleItem,
} from '../../core/services/flash-sales.service';
import { CartService } from '../../core/services/cart.service';
import { BranchService } from '../../core/services/branch.service';

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

@Component({
  selector: 'app-flash-sales-section',
  imports: [CurrencyPipe, SectionHeader],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styles: `
    .countdown {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-md);
      background-color: var(--color-canvas-softer);
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-pill);
      padding: var(--spacing-sm) var(--spacing-lg);
    }

    .countdown-live {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: var(--font-family-2);
      font-size: var(--text-body-xs);
      line-height: 16px;
      font-weight: 600;
      color: var(--color-body);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      white-space: nowrap;
    }

    .countdown-live-dot {
      width: 7px;
      height: 7px;
      border-radius: var(--radius-pill);
      background-color: var(--color-primary);
      animation: countdown-pulse 1.6s ease-in-out infinite;
    }

    .countdown-units {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-xs);
    }

    .countdown-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }

    .countdown-value {
      min-width: 34px;
      height: 32px;
      padding: 0 var(--spacing-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--color-primary);
      color: var(--color-on-primary);
      font-family: var(--font-primary);
      font-size: var(--text-body-lg);
      line-height: 20px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      border-radius: var(--radius-md);
    }

    .countdown-label {
      font-family: var(--font-family-2);
      font-size: 10px;
      line-height: 12px;
      font-weight: 600;
      color: var(--color-mute);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .countdown-separator {
      color: var(--color-mute);
      font-family: var(--font-primary);
      font-size: var(--text-body-lg);
      line-height: 32px;
      font-weight: 700;
    }

    @keyframes countdown-pulse {
      0%,
      100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.35;
        transform: scale(0.8);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .countdown-live-dot {
        animation: none;
      }
    }

    .flash-card {
      position: relative;
      display: flex;
      flex-direction: column;
      background-color: var(--color-canvas);
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-xl);
      overflow: hidden;
      height: 100%;
      transition: box-shadow 0.2s ease;
    }

    .flash-card:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    }

    .flash-badge {
      position: absolute;
      top: var(--spacing-md);
      left: var(--spacing-md);
      z-index: 10;
      background-color: var(--color-primary);
      color: var(--color-on-primary);
      font-family: var(--font-family-2);
      font-size: 11px;
      font-weight: 700;
      line-height: 14px;
      padding: 4px 10px;
      border-radius: var(--radius-pill);
    }

    .flash-image-link {
      display: block;
      aspect-ratio: 4 / 3;
      overflow: hidden;
      background-color: var(--color-canvas);
      padding: var(--spacing-md);
    }

    .flash-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
      transition: transform 0.3s ease;
    }

    .flash-card:hover .flash-image {
      transform: scale(1.05);
    }

    .flash-image-placeholder {
      width: 100%;
      height: 100%;
      display: grid;
      place-items: center;
    }

    .flash-content {
      padding: var(--spacing-md);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xxs);
      flex: 1;
    }

    .flash-product-name {
      font-family: var(--font-family-2);
      font-size: 15px;
      font-weight: 700;
      line-height: 20px;
      color: var(--color-ink);
      text-decoration: none;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .flash-price-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin-top: var(--spacing-xxs);
    }

    .flash-price {
      font-family: var(--font-primary);
      font-size: 15px;
      font-weight: 700;
      color: var(--color-primary);
      line-height: 20px;
    }

    .flash-original-price {
      font-family: var(--font-family-2);
      font-size: 13px;
      color: var(--color-mute);
      text-decoration: line-through;
      line-height: 18px;
    }

    .flash-stock-section {
      margin-top: var(--spacing-sm);
    }

    .flash-stock-text {
      font-family: var(--font-family-2);
      font-size: var(--text-body-xs);
      line-height: 16px;
      color: var(--color-body);
    }

    .flash-stock-text.flash-stock-low {
      color: #dc2626;
      font-weight: 600;
    }

    .flash-add-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-xs);
      width: 100%;
      padding: 8px 14px;
      border-radius: var(--radius-pill);
      border: none;
      background-color: color-mix(in srgb, var(--color-primary) 12%, var(--color-canvas));
      color: var(--color-primary);
      font-family: var(--font-family-2);
      font-size: var(--text-body-sm);
      font-weight: 600;
      line-height: 18px;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: var(--spacing-sm);
    }

    .flash-add-btn:hover {
      background-color: var(--color-primary);
      color: var(--color-on-primary);
    }

    .flash-add-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .flash-add-btn:disabled:hover {
      background-color: color-mix(in srgb, var(--color-primary) 12%, var(--color-canvas));
      color: var(--color-primary);
    }

    .flash-add-icon {
      width: 14px;
      height: 14px;
    }
  `,
  template: `
    @if (availableFlashSales().length > 0) {
      @for (flashSale of availableFlashSales(); track flashSale.id) {
        <section class="container-max py-3xl" data-testid="flash-sales-section">
          <app-section-header
            [titleTestId]="'flash-title'"
            subtitle=""
            titleBold="Ofertas"
            titleAccent="Flash"
            link="/shop"
            linkText="Ver todo"
          >
            <div section-extra class="countdown" data-testid="flash-countdown">
              <span class="countdown-live">
                <span class="countdown-live-dot"></span>
                Termina en
              </span>
              <div class="countdown-units">
                <div class="countdown-block">
                  <span class="countdown-value" data-testid="flash-countdown-hours">{{
                    padZero(timeLeft().hours)
                  }}</span>
                  <span class="countdown-label">Horas</span>
                </div>
                <span class="countdown-separator">:</span>
                <div class="countdown-block">
                  <span class="countdown-value" data-testid="flash-countdown-minutes">{{
                    padZero(timeLeft().minutes)
                  }}</span>
                  <span class="countdown-label">Min</span>
                </div>
                <span class="countdown-separator">:</span>
                <div class="countdown-block">
                  <span class="countdown-value" data-testid="flash-countdown-seconds">{{
                    padZero(timeLeft().seconds)
                  }}</span>
                  <span class="countdown-label">Seg</span>
                </div>
              </div>
            </div>
          </app-section-header>

          <swiper-container
            slides-per-view="2"
            space-between="12"
            free-mode="true"
            class="pb-md mt-lg"
            data-testid="flash-carousel"
            breakpoints='{"640": {"slidesPerView": 3, "spaceBetween": 12}, "768": {"slidesPerView": 4, "spaceBetween": 14}, "1024": {"slidesPerView": 5, "spaceBetween": 16}}'
          >
            @for (item of flashSale.items; track item.id) {
              <swiper-slide>
                <article class="flash-card" [attr.data-testid]="'flash-product-' + item.productId">
                  <div class="flash-badge" [attr.data-testid]="'flash-discount-' + item.productId">
                    -{{ flashSale.discountPercent }}%
                  </div>

                  <div class="flash-image-link">
                    @if (item.product.featuredImage || item.product.images?.[0]) {
                      <img
                        [src]="item.product.featuredImage || item.product.images[0]"
                        [alt]="item.product.name"
                        class="flash-image"
                        loading="lazy"
                        decoding="async"
                      />
                    } @else {
                      <div class="flash-image-placeholder">
                        <span class="text-display-xl font-bold text-mute">{{
                          item.product.name.charAt(0)
                        }}</span>
                      </div>
                    }
                  </div>

                  <div class="flash-content">
                    <p
                      class="flash-product-name"
                      [attr.data-testid]="'flash-product-name-' + item.productId"
                    >
                      {{ item.product.name }}
                    </p>

                    <div class="flash-price-row">
                      <span
                        class="flash-price"
                        [attr.data-testid]="'flash-price-' + item.productId"
                        >{{ item.flashPrice | currency }}</span
                      >
                      <span class="flash-original-price">{{ item.product.price | currency }}</span>
                    </div>

                    <div class="flash-stock-section">
                      @if (item.quantity <= 10) {
                        <p class="flash-stock-text flash-stock-low">
                          Solo quedan {{ item.quantity }} unidades
                        </p>
                      } @else {
                        <p class="flash-stock-text">Disponibles: {{ item.quantity }}</p>
                      }
                    </div>

                    <button
                      type="button"
                      class="flash-add-btn"
                      (click)="addToCart(item, $event)"
                      [disabled]="item.product.stock <= 0"
                      [attr.data-testid]="'flash-add-cart-' + item.productId"
                    >
                      @if (item.product.stock <= 0) {
                        Agotado
                      } @else {
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          class="flash-add-icon"
                        >
                          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                          <path d="M3 6h18" />
                          <path d="M16 10a4 4 0 0 1-8 0" />
                        </svg>
                        Agregar
                      }
                    </button>
                  </div>
                </article>
              </swiper-slide>
            }
          </swiper-container>
        </section>
      }
    }
  `,
})
export class FlashSalesSection implements OnInit, OnDestroy {
  private readonly flashSalesService = inject(FlashSalesService);
  private readonly cartService = inject(CartService);
  private readonly branchService = inject(BranchService);

  protected readonly activeFlashSales = signal<FlashSale[]>([]);
  protected readonly availableFlashSales = computed(() =>
    this.activeFlashSales()
      .map((sale) => ({
        ...sale,
        items: sale.items.filter((item) => item.product.stock > 0),
      }))
      .filter((sale) => sale.items.length > 0),
  );
  protected readonly timeLeft = signal<TimeLeft>({ hours: 0, minutes: 0, seconds: 0 });

  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private currentEndTime: Date | null = null;

  private readonly branchReload = effect(() => {
    const loaded = this.branchService.loaded();
    this.branchService.selectedBranch();
    if (!loaded) return;
    untracked(() => this.loadFlashSales());
  });

  ngOnInit(): void {
    this.loadFlashSales();
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private loadFlashSales(): void {
    this.flashSalesService.getActive().subscribe({
      next: (sales) => {
        this.activeFlashSales.set(sales);
        if (sales.length > 0) {
          this.startCountdown(new Date(sales[0].endTime));
        }
      },
    });
  }

  private startCountdown(endTime: Date): void {
    this.currentEndTime = endTime;
    this.updateTimeLeft();
    this.timerInterval = setInterval(() => this.updateTimeLeft(), 1000);
  }

  private updateTimeLeft(): void {
    if (!this.currentEndTime) return;

    const now = new Date();
    const diff = this.currentEndTime.getTime() - now.getTime();

    if (diff <= 0) {
      this.timeLeft.set({ hours: 0, minutes: 0, seconds: 0 });
      this.clearTimer();
      this.activeFlashSales.set([]);
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    this.timeLeft.set({ hours, minutes, seconds });
  }

  private clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  padZero(num: number): string {
    return num.toString().padStart(2, '0');
  }

  addToCart(item: FlashSaleItem, event: Event): void {
    event.stopPropagation();
    const btn = event.currentTarget as HTMLElement | null;
    const card = btn?.closest('.flash-card');
    const image = card?.querySelector('.flash-image') as HTMLElement | null;
    this.cartService.add(
      {
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        images: item.product.images || [],
        stock: item.product.stock,
        flashSaleId: item.flashSaleId,
        flashSalePrice: item.flashPrice,
      },
      1,
      image ?? btn,
    );
  }
}
