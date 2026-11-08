import { Component, computed, inject, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { FavoriteService } from '../../core/services/favorite.service';
import { Product } from '../../core/services/product.service';
import { productTransitionName } from '../../core/utils/view-transition';

@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe, RouterLink],
  template: `
    <article
      class="product-card"
      [class.is-out-of-stock]="isOutOfStock()"
      data-testid="product-card"
    >
      <!-- Badges -->
      <div class="product-badges">
        @if (hasFlashSale()) {
          <span class="badge-flash" data-testid="flash-badge"
            >Flash -{{ flashDiscountPercent() }}%</span
          >
        } @else if (discountPercent() > 0) {
          <span class="badge-discount" data-testid="discount-badge"
            >{{ discountPercent() }}% off</span
          >
        }
      </div>

      <!-- Favorite button -->
      <button
        type="button"
        class="btn-favorite"
        [class.active]="isFavorite()"
        [attr.aria-pressed]="isFavorite()"
        [attr.aria-label]="
          isFavorite()
            ? 'Quitar ' + product().name + ' de favoritos'
            : 'Agregar ' + product().name + ' a favoritos'
        "
        (click)="toggleFavorite($event)"
        data-testid="favorite-button"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          [attr.fill]="isFavorite() ? 'currentColor' : 'none'"
          stroke="currentColor"
          stroke-width="2"
          class="w-5 h-5"
        >
          <path
            d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
          />
        </svg>
      </button>

      <!-- Image -->
      <a
        [routerLink]="['/product', product().id]"
        [state]="{ product: product() }"
        class="product-image-link"
        (pointerdown)="startImageTransition($event)"
      >
        @if (hasImage()) {
          <img
            [src]="displayImage()"
            [alt]="product().name"
            loading="lazy"
            decoding="async"
            class="product-image"
            (error)="imgFailed.set(true)"
            data-testid="product-image"
          />
        } @else {
          <div class="product-image-placeholder">
            <span class="text-display-xl font-bold text-mute">{{ product().name.charAt(0) }}</span>
          </div>
        }
        @if (isOutOfStock()) {
          <span class="stock-overlay" data-testid="out-of-stock-overlay">Sin stock</span>
        }
      </a>

      <!-- Content -->
      <div class="product-content">
        <!-- Category row -->
        <div class="product-top-row">
          @if (product().category; as cat) {
            <span class="product-category" data-testid="product-category">{{ cat.name }}</span>
          }
        </div>

        <!-- Name -->
        <a
          [routerLink]="['/product', product().id]"
          class="product-name"
          data-testid="product-name"
          >{{ product().name }}</a
        >

        <!-- Description -->
        <p class="product-meta" data-testid="product-description">{{ product().description }}</p>

        <!-- Stock -->
        @if (!isOutOfStock()) {
          <p class="product-stock" data-testid="product-stock">{{ product().stock }} disponibles</p>
        } @else {
          <p class="product-stock product-stock-out" data-testid="product-stock">Sin stock</p>
        }

        <!-- Price + Add row -->
        <div class="product-bottom">
          <div class="product-price-col">
            <span
              class="product-price"
              [class.product-price-flash]="hasFlashSale()"
              data-testid="product-price"
              >{{ effectivePrice() | currency }}</span
            >
            @if (hasFlashSale()) {
              <span class="product-price-original">{{ product().price | currency }}</span>
            } @else if (discountPercent() > 0) {
              <span class="product-price-original">{{ product().price | currency }}</span>
            }
          </div>
          @if (!isOutOfStock()) {
            <button
              type="button"
              class="btn-add"
              (click)="add($event)"
              aria-label="Agregar al carrito"
              title="Agregar al carrito"
              data-testid="add-to-cart"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                class="btn-add-icon"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          } @else {
            <button
              type="button"
              class="btn-add btn-add-disabled"
              disabled
              aria-disabled="true"
              data-testid="add-to-cart-disabled"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                class="btn-add-icon"
              >
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              Agotado
            </button>
          }
        </div>
      </div>
    </article>
  `,
  styles: `
    .product-card {
      position: relative;
      display: flex;
      flex-direction: column;
      background-color: var(--color-canvas);
      border: 1px solid var(--color-surface-pressed);
      border-radius: 16px;
      overflow: hidden;
      height: 100%;
      transition: box-shadow 0.2s ease;
    }

    .product-card:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    }

    /* Out of stock state */
    .product-card.is-out-of-stock .product-image,
    .product-card.is-out-of-stock .product-image-placeholder {
      filter: grayscale(0.6);
      opacity: 0.85;
    }

    .stock-overlay {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: var(--color-black-elevated);
      color: var(--color-on-dark);
      font-size: 12px;
      font-weight: 700;
      line-height: 16px;
      padding: 6px 14px;
      border-radius: var(--radius-pill);
      white-space: nowrap;
      pointer-events: none;
    }

    .product-card.is-out-of-stock:hover .product-image {
      transform: none;
    }

    /* Badges */
    .product-badges {
      position: absolute;
      top: 12px;
      left: 12px;
      z-index: 10;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .badge-discount {
      display: inline-block;
      background-color: var(--color-primary);
      color: var(--color-on-primary);
      font-size: 11px;
      font-weight: 700;
      line-height: 14px;
      padding: 4px 10px;
      border-radius: var(--radius-pill);
    }

    .badge-flash {
      display: inline-block;
      background-color: var(--color-accent);
      color: var(--color-on-accent);
      font-size: 11px;
      font-weight: 700;
      line-height: 14px;
      padding: 4px 10px;
      border-radius: var(--radius-pill);
    }

    .badge-out-of-stock {
      display: inline-block;
      background-color: var(--color-black-elevated);
      color: var(--color-on-dark);
      font-size: 13px;
      font-weight: 700;
      line-height: 18px;
      padding: 8px 16px;
      border-radius: var(--radius-pill);
    }

    /* Favorite button */
    .btn-favorite {
      position: absolute;
      top: 12px;
      right: 12px;
      z-index: 10;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: var(--color-canvas);
      border: none;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      display: grid;
      place-items: center;
      cursor: pointer;
      transition: all 0.2s ease;
      color: var(--color-ink);
    }

    .btn-favorite:hover,
    .btn-favorite.active {
      color: var(--color-primary);
    }

    .btn-favorite.active {
      transform: scale(1.05);
    }

    /* Image */
    .product-image-link {
      display: block;
      position: relative;
      aspect-ratio: 4 / 3;
      overflow: hidden;
      background-color: var(--color-canvas);
      padding: var(--spacing-md);
    }

    .product-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
      transition: transform 0.3s ease;
    }

    .product-card:hover .product-image {
      transform: scale(1.05);
    }

    .product-image-placeholder {
      width: 100%;
      height: 100%;
      display: grid;
      place-items: center;
    }

    /* Content */
    .product-content {
      padding: var(--spacing-md);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xxs);
      flex: 1;
    }

    .product-top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-sm);
    }

    .product-category {
      font-size: 12px;
      font-weight: 500;
      color: var(--color-primary);
      line-height: 16px;
    }

    .product-name {
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

    .product-name:hover {
      opacity: 0.7;
    }

    .product-meta {
      font-size: 12px;
      color: var(--color-body);
      line-height: 16px;
      min-height: 48px;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .product-stock {
      font-size: 12px;
      font-weight: 500;
      color: var(--color-primary);
      line-height: 16px;
    }

    .product-stock-out {
      color: var(--color-body);
    }

    /* Bottom row */
    .product-bottom {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: var(--spacing-sm);
      margin-top: auto;
      padding-top: var(--spacing-sm);
    }

    .product-price-col {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .product-price {
      font-size: 15px;
      font-weight: 700;
      color: var(--color-ink);
      line-height: 20px;
    }

    .product-price-flash {
      color: var(--color-accent);
    }

    .product-price-original {
      font-size: 13px;
      color: var(--color-mute);
      text-decoration: line-through;
      line-height: 18px;
    }

    /* Add button */
    .btn-add {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      padding: 0;
      border-radius: 50%;
      border: none;
      background-color: color-mix(in srgb, var(--color-primary) 12%, var(--color-canvas));
      color: var(--color-primary);
      cursor: pointer;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .btn-add-icon {
      width: 16px;
      height: 16px;
    }

    .btn-add:hover {
      background-color: var(--color-primary);
      color: var(--color-on-primary);
    }

    .btn-add-disabled,
    .btn-add-disabled:hover {
      width: auto;
      height: auto;
      padding: 6px 14px;
      gap: var(--spacing-xs);
      border-radius: var(--radius-pill);
      background-color: var(--color-canvas-soft);
      color: var(--color-mute);
      cursor: not-allowed;
      opacity: 0.85;
    }
  `,
})
export class ProductCard {
  private readonly cart = inject(CartService);
  private readonly favorites = inject(FavoriteService);

  readonly product = input.required<Product>();
  protected readonly isFavorite = computed(() => this.favorites.isFavorite(this.product().id));
  protected readonly imgFailed = signal(false);
  protected readonly isOutOfStock = computed(() => !(this.product().stock > 0));
  protected readonly hasImage = computed(() => {
    const images = this.product().images;
    const featured = this.product().featuredImage;
    const src = featured ?? images?.[0];
    return !!src && !this.imgFailed();
  });

  protected readonly displayImage = computed(() => {
    const p = this.product();
    return p.featuredImage ?? p.images?.[0] ?? '';
  });

  protected readonly hasFlashSale = computed(() => {
    const p = this.product();
    return p.flashPrice != null && p.flashSaleId != null;
  });

  protected readonly flashDiscountPercent = computed(() => {
    const p = this.product();
    if (!p.flashPrice || !p.price) return 0;
    return Math.round(((p.price - p.flashPrice) / p.price) * 100);
  });

  // Real discount from product data
  protected readonly discountPercent = computed(() => {
    const p = this.product();
    if (!p.hasDiscount || !p.discountPercent || p.discountPercent <= 0) return 0;
    return Math.round(p.discountPercent);
  });

  // Original price before discount
  protected readonly originalPrice = computed(() => {
    const p = this.product();
    if (!p.hasDiscount) return p.price;
    if (p.discountPrice && p.discountPrice > 0) return p.price;
    if (p.discountPercent && p.discountPercent > 0) {
      return p.price / (1 - p.discountPercent / 100);
    }
    return p.price;
  });

  // Effective price (flash price > discount > normal)
  protected readonly effectivePrice = computed(() => {
    const p = this.product();
    if (p.flashPrice != null) return p.flashPrice;
    if (!p.hasDiscount) return p.price;
    if (p.discountPrice && p.discountPrice > 0) return p.discountPrice;
    if (p.discountPercent && p.discountPercent > 0) {
      return Math.round(p.price * (1 - p.discountPercent / 100) * 100) / 100;
    }
    return p.price;
  });

  protected toggleFavorite(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.favorites.toggle(this.product());
  }

  protected startImageTransition(event: Event): void {
    const link = event.currentTarget as HTMLElement | null;
    const img = link?.querySelector('img');
    if (!img) return;
    img.style.setProperty('view-transition-name', productTransitionName(this.product().id));
    setTimeout(() => img.style.removeProperty('view-transition-name'), 1500);
  }

  protected add(event: Event): void {
    const btn = event.currentTarget as HTMLElement | null;
    const card = btn?.closest('.product-card');
    const image = card?.querySelector('.product-image') as HTMLElement | null;
    const p = this.product();
    this.cart.add(
      {
        id: p.id,
        name: p.name,
        price: p.price,
        images: p.images,
        stock: p.stock,
        flashSaleId: p.flashSaleId ?? undefined,
        flashSalePrice: p.flashPrice ?? undefined,
      },
      1,
      image ?? btn,
    );
  }
}
