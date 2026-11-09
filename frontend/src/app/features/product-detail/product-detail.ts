import {
  Component,
  effect,
  inject,
  OnInit,
  signal,
  computed,
  untracked,
  viewChild,
  ElementRef,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Product, ProductService } from '../../core/services/product.service';
import { BranchService } from '../../core/services/branch.service';
import { CartService } from '../../core/services/cart.service';
import { FavoriteService } from '../../core/services/favorite.service';
import { StockSubscriptionService } from '../../core/services/stock-subscription.service';
import { productTransitionName } from '../../core/utils/view-transition';
import { ProductCard } from '../../shared/ui/product-card';
import { SectionHeader } from '../../shared/ui/section-header';

@Component({
  selector: 'app-product-detail',
  imports: [CurrencyPipe, ProductCard, SectionHeader],
  styles: `
    .detail-gallery {
      position: relative;
    }

    .gallery-main {
      width: 100%;
      aspect-ratio: 1;
      border-radius: var(--radius-xl);
      overflow: hidden;
      background-color: var(--color-canvas-softer);
      display: grid;
      place-items: center;
      border: 1px solid var(--color-surface-pressed);
    }

    .gallery-main img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: opacity 0.3s ease;
    }

    .gallery-arrow {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 40px;
      height: 40px;
      border-radius: var(--radius-full);
      background-color: var(--color-canvas);
      border: 1px solid var(--color-surface-pressed);
      display: grid;
      place-items: center;
      cursor: pointer;
      transition:
        background-color 0.2s ease,
        box-shadow 0.2s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      z-index: 5;
      color: var(--color-ink);
    }

    .gallery-arrow:hover {
      background-color: var(--color-canvas-soft);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    }

    .gallery-arrow.prev {
      left: -20px;
    }

    .gallery-arrow.next {
      right: -20px;
    }

    .gallery-thumbs {
      display: flex;
      gap: var(--spacing-md);
      margin-top: var(--spacing-lg);
      overflow-x: auto;
      padding-bottom: var(--spacing-xs);
    }

    .gallery-thumb {
      width: 72px;
      height: 72px;
      border-radius: var(--radius-lg);
      overflow: hidden;
      border: 2px solid var(--color-surface-pressed);
      cursor: pointer;
      flex-shrink: 0;
      transition: border-color 0.2s ease;
      background-color: var(--color-canvas-softer);
    }

    .gallery-thumb:hover {
      border-color: var(--color-mute);
    }

    .gallery-thumb.active {
      border-color: var(--color-primary);
    }

    .gallery-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .info-category {
      font-size: var(--text-body-md);
      font-weight: 500;
      color: var(--color-primary);
      line-height: 22px;
    }

    .info-name {
      font-size: var(--text-display-md);
      font-weight: 700;
      color: var(--color-ink);
      line-height: 28px;
      margin: 0;
    }

    .badge-discount {
      display: inline-block;
      background-color: var(--color-primary);
      color: var(--color-on-primary);
      font-size: 12px;
      font-weight: 700;
      line-height: 16px;
      padding: var(--spacing-xxs) var(--spacing-md);
      border-radius: var(--radius-pill);
    }

    .stock-badge {
      display: inline-block;
      font-size: var(--text-body-sm);
      font-weight: 600;
      color: #065f46;
      background-color: #d1fae5;
      border-radius: var(--radius-pill);
      padding: var(--spacing-xxs) var(--spacing-md);
      line-height: 18px;
    }

    .stock-badge.out {
      color: #991b1b;
      background-color: #fee2e2;
    }

    .rating-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .stars {
      display: flex;
      gap: 2px;
    }

    .star {
      width: 18px;
      height: 18px;
      color: var(--color-accent);
    }

    .star.empty {
      color: var(--color-surface-pressed);
    }

    .rating-text {
      font-size: var(--text-body-md);
      font-weight: 600;
      color: var(--color-ink);
    }

    .rating-count {
      font-size: var(--text-body-md);
      color: var(--color-body);
    }

    .price-row {
      display: flex;
      align-items: baseline;
      gap: var(--spacing-md);
    }

    .price-current {
      font-size: var(--text-display-sm);
      font-weight: 700;
      color: var(--color-ink);
    }

    .price-flash {
      color: var(--color-accent);
    }

    .price-original {
      font-size: var(--text-body-lg);
      color: var(--color-mute);
      text-decoration: line-through;
    }

    .savings-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .savings-text {
      font-size: var(--text-body-md);
      font-weight: 600;
      color: #16a34a;
      line-height: 22px;
    }

    .savings-percent {
      font-size: var(--text-body-sm);
      font-weight: 600;
      color: #16a34a;
      line-height: 18px;
    }

    .info-description {
      font-size: var(--text-body-md);
      color: var(--color-body);
      line-height: 22px;
      margin: 0;
    }

    .option-group {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .option-label {
      font-size: var(--text-body-md-strong);
      font-weight: 600;
      color: var(--color-ink);
    }

    .option-pills {
      display: flex;
      gap: var(--spacing-sm);
    }

    .option-pill {
      padding: var(--spacing-sm) var(--spacing-lg);
      border-radius: var(--radius-pill);
      border: 1px solid var(--color-surface-pressed);
      background-color: var(--color-canvas);
      font-size: var(--text-body-md);
      color: var(--color-ink);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .option-pill:hover {
      border-color: var(--color-mute);
    }

    .option-pill.selected {
      background-color: var(--color-primary);
      color: var(--color-on-primary);
      border-color: var(--color-primary);
    }

    .qty-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
    }

    .qty-control {
      display: flex;
      align-items: center;
      border-radius: var(--radius-pill);
      border: 1px solid var(--color-surface-pressed);
      overflow: hidden;
    }

    .qty-btn {
      width: 44px;
      height: 44px;
      display: grid;
      place-items: center;
      background-color: var(--color-canvas);
      border: none;
      cursor: pointer;
      font-size: 18px;
      color: var(--color-ink);
      transition: background-color 0.15s ease;
    }

    .qty-btn:hover:not(:disabled) {
      background-color: var(--color-canvas-soft);
    }

    .qty-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    .qty-value {
      width: 48px;
      text-align: center;
      font-size: var(--text-body-md-strong);
      font-weight: 600;
      border-left: 1px solid var(--color-surface-pressed);
      border-right: 1px solid var(--color-surface-pressed);
      padding: var(--spacing-md) 0;
    }

    .action-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .btn-add-to-cart {
      flex: 1;
      padding: var(--spacing-md) var(--spacing-xl);
      border-radius: var(--radius-pill);
      border: none;
      background-color: var(--color-primary);
      color: var(--color-on-primary);
      font-size: var(--text-body-md-strong);
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s ease;
    }

    .btn-add-to-cart:hover:not(:disabled) {
      opacity: 0.85;
    }

    .btn-add-to-cart:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    .btn-wishlist {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-full);
      border: 1px solid var(--color-surface-pressed);
      background-color: var(--color-canvas);
      display: grid;
      place-items: center;
      cursor: pointer;
      color: var(--color-ink);
      transition:
        color 0.2s ease,
        border-color 0.2s ease;
      flex-shrink: 0;
    }

    .btn-wishlist:hover,
    .btn-wishlist.active {
      color: var(--color-primary);
      border-color: var(--color-primary);
    }

    .meta-row {
      display: flex;
      align-items: baseline;
      gap: var(--spacing-sm);
      font-size: var(--text-body-md);
    }

    .meta-label {
      color: var(--color-body);
    }

    .meta-value {
      color: var(--color-ink);
      font-weight: 500;
    }

    .share-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .share-label {
      font-size: var(--text-body-md);
      color: var(--color-body);
    }

    .share-btn {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-full);
      border: 1px solid var(--color-surface-pressed);
      background-color: var(--color-canvas);
      display: grid;
      place-items: center;
      cursor: pointer;
      color: var(--color-body);
      transition:
        color 0.2s ease,
        border-color 0.2s ease,
        background-color 0.2s ease;
    }

    .share-btn:hover {
      color: var(--color-on-primary);
    }

    .share-btn.facebook:hover {
      background-color: #1877f2;
      border-color: #1877f2;
    }

    .share-btn.twitter:hover {
      background-color: #1da1f2;
      border-color: #1da1f2;
    }

    .share-btn.whatsapp:hover {
      background-color: #25d366;
      border-color: #25d366;
    }

    .share-btn.email:hover {
      background-color: var(--color-ink);
      border-color: var(--color-ink);
    }

    .share-btn.pinterest:hover {
      background-color: #e60023;
      border-color: #e60023;
    }

    .tabs-section {
      margin-top: var(--spacing-3xl);
    }

    .tabs-header {
      display: flex;
      border-bottom: 1px solid var(--color-surface-pressed);
    }

    .tab-btn {
      padding: var(--spacing-lg) var(--spacing-xl);
      font-size: var(--text-body-md-strong);
      font-weight: 500;
      color: var(--color-body);
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      transition:
        color 0.2s ease,
        border-color 0.2s ease;
    }

    .tab-btn:hover {
      color: var(--color-ink);
    }

    .tab-btn.active {
      color: var(--color-primary);
      border-bottom-color: var(--color-primary);
    }

    .tab-content {
      padding: var(--spacing-2xl) 0;
      font-size: var(--text-body-md);
      color: var(--color-body);
      line-height: 22px;
    }

    .no-stock-msg {
      font-size: var(--text-body-sm-strong);
      color: var(--color-mute);
    }

    @media (max-width: 768px) {
      .gallery-arrow.prev {
        left: 8px;
      }
      .gallery-arrow.next {
        right: 8px;
      }
    }

    .related-section {
      margin-top: var(--spacing-3xl);
    }

    .related-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--spacing-lg);
      margin-top: var(--spacing-lg);
    }

    @media (min-width: 768px) {
      .related-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (min-width: 1024px) {
      .related-grid {
        grid-template-columns: repeat(5, 1fr);
      }
    }
  `,
  template: `
    <section class="container-max py-3xl" data-testid="product-detail">
      @if (product(); as p) {
        <div class="grid md:grid-cols-2 gap-3xl items-start">
          <!-- Gallery -->
          <div class="detail-gallery">
            <div class="gallery-main" #galleryMain data-testid="detail-image">
              @if (hasImage()) {
                <img
                  [src]="currentImage()"
                  [alt]="p.name"
                  [style.view-transition-name]="imageTransitionName()"
                  fetchpriority="high"
                  decoding="async"
                />
              } @else {
                <span class="text-display-xxl font-bold text-mute">{{ p.name.charAt(0) }}</span>
              }
            </div>
            @if (p.images.length > 1) {
              <button
                type="button"
                class="gallery-arrow prev"
                (click)="prevImage()"
                data-testid="gallery-prev"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                  <path
                    fill-rule="evenodd"
                    d="M12.79 5.23a.75.75 0 0 1-.02 1.06L8.832 10l3.938 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
              <button
                type="button"
                class="gallery-arrow next"
                (click)="nextImage()"
                data-testid="gallery-next"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                  <path
                    fill-rule="evenodd"
                    d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
            }
            @if (p.images.length > 1) {
              <div class="gallery-thumbs">
                @for (img of p.images; track img; let i = $index) {
                  <button
                    type="button"
                    class="gallery-thumb"
                    [class.active]="i === selectedIndex()"
                    (click)="selectedIndex.set(i)"
                    [attr.data-testid]="'thumb-' + i"
                  >
                    <img
                      [src]="img"
                      [alt]="p.name + ' imagen ' + (i + 1)"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                }
              </div>
            }
          </div>

          <!-- Info -->
          <div class="flex flex-col gap-lg">
            @if (p.category) {
              <p class="info-category" data-testid="detail-category">{{ p.category.name }}</p>
            }

            <div class="flex items-center gap-md flex-wrap">
              <h1 class="info-name" data-testid="detail-name">{{ p.name }}</h1>
              @if (p.stock > 0) {
                <span class="stock-badge">En stock</span>
              } @else {
                <span class="stock-badge out">Sin stock</span>
              }
              @if (discountPercent() > 0) {
                <span class="badge-discount" data-testid="detail-discount-badge"
                  >-{{ discountPercent() }}%</span
                >
              }
            </div>

            <!-- Rating -->
            <div class="rating-row">
              <div class="stars">
                @for (s of [1, 2, 3, 4, 5]; track s) {
                  <svg
                    class="star"
                    [class.empty]="s > ratingValue()"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                      clip-rule="evenodd"
                    />
                  </svg>
                }
              </div>
              <span class="rating-text">{{ ratingText() }}</span>
              <span class="rating-count">({{ reviewCount() }} Reseñas)</span>
            </div>

            <!-- Price -->
            <div class="price-row" data-testid="detail-price">
              <span class="price-current" [class.price-flash]="hasFlashSale()">{{
                effectivePrice() | currency
              }}</span>
              @if (hasFlashSale()) {
                <span class="price-original">{{ p.price | currency }}</span>
              } @else if (discountPercent() > 0) {
                <span class="price-original">{{ p.price | currency }}</span>
              }
            </div>
            @if (hasFlashSale()) {
              <div class="savings-row">
                <span class="savings-text">Ahorras {{ savings() | currency }}</span>
                <span class="savings-percent">(-{{ flashDiscountPercent() }}%)</span>
              </div>
            } @else if (discountPercent() > 0) {
              <div class="savings-row">
                <span class="savings-text">Ahorras {{ savings() | currency }}</span>
                <span class="savings-percent">(-{{ discountPercent() }}%)</span>
              </div>
            }

            <!-- Description -->
            <p class="info-description">{{ p.description }}</p>

            <!-- Separator -->
            <div class="border-t border-surface-pressed"></div>

            <!-- SKU -->
            <div class="meta-row">
              <span class="meta-label">SKU :</span>
              <span class="meta-value" data-testid="detail-sku">{{ p.sku }}</span>
            </div>

            <!-- Tags -->
            <div class="meta-row">
              <span class="meta-label">Tags :</span>
              <div class="flex flex-wrap gap-sm">
                @for (tag of p.tags ?? []; track tag.id) {
                  <span
                    class="inline-flex items-center gap-xxs px-md py-xxs rounded-pill text-body-xs font-medium"
                    [style.background-color]="tag.color ? tag.color + '20' : '#f3f3f3'"
                    [style.color]="tag.color ?? '#5e5e5e'"
                  >
                    {{ tag.name }}
                  </span>
                } @empty {
                  <span class="meta-value">Sin tags</span>
                }
              </div>
            </div>

            <!-- Share -->
            <div class="share-row">
              <span class="share-label">Compartir :</span>
              <button
                type="button"
                class="share-btn facebook"
                (click)="share('facebook')"
                title="Compartir en Facebook"
                data-testid="share-facebook"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                  <path
                    d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                  />
                </svg>
              </button>
              <button
                type="button"
                class="share-btn twitter"
                (click)="share('twitter')"
                title="Compartir en Twitter"
                data-testid="share-twitter"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                  <path
                    d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"
                  />
                </svg>
              </button>
              <button
                type="button"
                class="share-btn whatsapp"
                (click)="share('whatsapp')"
                title="Compartir en WhatsApp"
                data-testid="share-whatsapp"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                  <path
                    d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
                  />
                </svg>
              </button>
              <button
                type="button"
                class="share-btn email"
                (click)="share('email')"
                title="Compartir por email"
                data-testid="share-email"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  class="w-4 h-4"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </button>
              <button
                type="button"
                class="share-btn pinterest"
                (click)="share('pinterest')"
                title="Compartir en Pinterest"
                data-testid="share-pinterest"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                  <path
                    d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z"
                  />
                </svg>
              </button>
            </div>

            <!-- Separator -->
            <div class="border-t border-surface-pressed"></div>

            <!-- Quantity + Actions -->
            <div class="qty-row">
              <div class="qty-control">
                <button
                  type="button"
                  class="qty-btn"
                  [disabled]="qty() <= 1"
                  (click)="qty.set(qty() - 1)"
                  data-testid="qty-dec"
                >
                  −
                </button>
                <span class="qty-value" data-testid="qty-value">{{ qty() }}</span>
                <button
                  type="button"
                  class="qty-btn"
                  [disabled]="qty() >= p.stock"
                  (click)="qty.set(qty() + 1)"
                  data-testid="qty-inc"
                >
                  +
                </button>
              </div>
              <div class="action-row" style="flex:1">
                <button
                  type="button"
                  class="btn-add-to-cart"
                  [disabled]="p.stock <= 0"
                  (click)="add()"
                  data-testid="detail-add"
                >
                  Agregar al carrito
                </button>
                <button
                  type="button"
                  class="btn-wishlist"
                  [class.active]="isWishlisted()"
                  [attr.aria-pressed]="isWishlisted()"
                  [attr.aria-label]="isWishlisted() ? 'Quitar de favoritos' : 'Agregar a favoritos'"
                  (click)="toggleWishlist()"
                  data-testid="detail-wishlist"
                >
                  <svg
                    viewBox="0 0 24 24"
                    [attr.fill]="isWishlisted() ? 'currentColor' : 'none'"
                    stroke="currentColor"
                    stroke-width="2"
                    class="w-5 h-5"
                  >
                    <path
                      d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            @if (p.stock <= 0) {
              <div class="flex flex-col gap-sm mt-sm" data-testid="restock-waitlist">
                @if (restockSent()) {
                  <p class="text-body-sm text-primary" data-testid="restock-success">
                    Listo. Te avisaremos cuando vuelva a estar disponible.
                  </p>
                } @else {
                  <p class="no-stock-msg">
                    Producto sin stock. Déjanos tu correo y te avisamos al reponerlo.
                  </p>
                  <form class="flex gap-sm" (submit)="subscribeRestock($event)">
                    <input
                      type="email"
                      required
                      class="form-input flex-1"
                      placeholder="tu@correo.com"
                      [value]="restockEmail()"
                      (input)="restockEmail.set($any($event.target).value)"
                      data-testid="restock-email"
                    />
                    <button
                      type="submit"
                      class="btn-primary"
                      [disabled]="restockLoading()"
                      data-testid="restock-submit"
                    >
                      {{ restockLoading() ? 'Enviando...' : 'Avísame' }}
                    </button>
                  </form>
                  @if (restockError()) {
                    <p class="form-error" data-testid="restock-error">{{ restockError() }}</p>
                  }
                }
              </div>
            }
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs-section">
          <div class="tabs-header">
            <button
              type="button"
              class="tab-btn"
              [class.active]="activeTab() === 'description'"
              (click)="activeTab.set('description')"
              data-testid="tab-description"
            >
              Description
            </button>
            <button
              type="button"
              class="tab-btn"
              [class.active]="activeTab() === 'info'"
              (click)="activeTab.set('info')"
              data-testid="tab-info"
            >
              Additional Information
            </button>
            <button
              type="button"
              class="tab-btn"
              [class.active]="activeTab() === 'reviews'"
              (click)="activeTab.set('reviews')"
              data-testid="tab-reviews"
            >
              Review
            </button>
          </div>
          <div class="tab-content">
            @if (activeTab() === 'description') {
              <p>{{ p.description }}</p>
            } @else if (activeTab() === 'info') {
              <div class="flex flex-col gap-md">
                <div class="meta-row">
                  <span class="meta-label">SKU:</span>
                  <span class="meta-value">{{ p.sku }}</span>
                </div>
                @if (p.category) {
                  <div class="meta-row">
                    <span class="meta-label">Categoría:</span>
                    <span class="meta-value">{{ p.category.name }}</span>
                  </div>
                }
                @if (p.tags && p.tags.length > 0) {
                  <div class="meta-row">
                    <span class="meta-label">Tags:</span>
                    <div class="flex flex-wrap gap-sm">
                      @for (tag of p.tags; track tag.id) {
                        <span
                          class="inline-flex items-center gap-xxs px-md py-xxs rounded-pill text-body-xs font-medium"
                          [style.background-color]="tag.color ? tag.color + '20' : '#f3f3f3'"
                          [style.color]="tag.color ?? '#5e5e5e'"
                        >
                          {{ tag.name }}
                        </span>
                      }
                    </div>
                  </div>
                }
                <div class="meta-row">
                  <span class="meta-label">Stock disponible:</span>
                  <span class="meta-value">{{ p.stock }} unidades</span>
                </div>
              </div>
            } @else {
              <p class="text-mute">Aún no hay reseñas para este producto.</p>
            }
          </div>
        </div>

        <!-- Productos relacionados -->
        @if (relatedProducts().length > 0) {
          <section class="related-section">
            <app-section-header
              subtitle="También te puede gustar"
              titleBold="Productos"
              titleAccent="relacionados"
            />
            <div class="related-grid">
              @for (rp of relatedProducts(); track rp.id) {
                <app-product-card [product]="rp" />
              }
            </div>
          </section>
        }
      } @else {
        <p class="text-body text-center py-3xl">Cargando producto...</p>
      }
    </section>
  `,
})
export class ProductDetail implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly cart = inject(CartService);
  private readonly favorites = inject(FavoriteService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly stockSubscriptions = inject(StockSubscriptionService);
  private readonly branchService = inject(BranchService);
  private readonly galleryMain = viewChild<ElementRef<HTMLElement>>('galleryMain');

  private readonly branchReload = effect(() => {
    const loaded = this.branchService.loaded();
    this.branchService.selectedBranch();
    if (!loaded) return;
    untracked(() => this.loadProduct());
  });

  constructor() {
    const seeded = readProductFromState(this.router);
    if (seeded) this.product.set(seeded);
  }

  protected readonly product = signal<Product | null>(null);
  protected readonly allProducts = signal<Product[]>([]);
  protected readonly qty = signal(1);
  protected readonly imgFailed = signal(false);
  protected readonly selectedIndex = signal(0);
  protected readonly activeTab = signal<'description' | 'info' | 'reviews'>('description');
  protected readonly restockEmail = signal('');
  protected readonly restockLoading = signal(false);
  protected readonly restockSent = signal(false);
  protected readonly restockError = signal('');

  protected readonly hasImage = computed(() => {
    const p = this.product();
    return !!p && p.images.length > 0 && !this.imgFailed();
  });

  protected readonly isWishlisted = computed(() => {
    const p = this.product();
    return !!p && this.favorites.isFavorite(p.id);
  });

  protected readonly currentImage = computed(() => {
    const p = this.product();
    if (!p || p.images.length === 0) return '';
    return p.images[this.selectedIndex()] ?? p.images[0];
  });

  protected readonly imageTransitionName = computed(() => {
    const p = this.product();
    return p ? productTransitionName(p.id) : null;
  });

  protected readonly ratingValue = computed(() => {
    const p = this.product();
    if (!p) return 0;
    const seed = p.id.charCodeAt(0) + p.id.charCodeAt(1);
    return Math.round((4 + (seed % 10) / 10) * 10) / 10;
  });

  protected readonly ratingText = computed(() => this.ratingValue().toFixed(1));

  protected readonly reviewCount = computed(() => {
    const p = this.product();
    if (!p) return 0;
    const seed = p.id.charCodeAt(0) + p.id.charCodeAt(1);
    return 100 + ((seed * 7) % 400);
  });

  protected readonly discountPercent = computed(() => {
    const p = this.product();
    if (!p || !p.hasDiscount || !p.discountPercent || p.discountPercent <= 0) return 0;
    return Math.round(p.discountPercent);
  });

  protected readonly hasFlashSale = computed(() => {
    const p = this.product();
    return p != null && p.flashPrice != null && p.flashSaleId != null;
  });

  protected readonly flashDiscountPercent = computed(() => {
    const p = this.product();
    if (!p || !p.flashPrice || !p.price) return 0;
    return Math.round(((p.price - p.flashPrice) / p.price) * 100);
  });

  protected readonly effectivePrice = computed(() => {
    const p = this.product();
    if (!p) return 0;
    if (p.flashPrice != null) return p.flashPrice;
    if (!p.hasDiscount) return p.price;
    if (p.discountPrice && p.discountPrice > 0) return p.discountPrice;
    if (p.discountPercent && p.discountPercent > 0) {
      return Math.round(p.price * (1 - p.discountPercent / 100) * 100) / 100;
    }
    return p.price;
  });

  protected readonly savings = computed(() => {
    const p = this.product();
    if (!p) return 0;
    if (p.flashPrice != null) {
      return Math.round((p.price - p.flashPrice) * 100) / 100;
    }
    if (!p.hasDiscount) return 0;
    const discount = p.discountPercent ?? 0;
    if (discount > 0) return Math.round(((p.price * discount) / 100) * 100) / 100;
    if (p.discountPrice && p.discountPrice > 0)
      return Math.round((p.price - p.discountPrice) * 100) / 100;
    return 0;
  });

  protected readonly relatedProducts = computed(() => {
    const p = this.product();
    if (!p) return [];
    return this.allProducts()
      .filter((rp) => rp.id !== p.id && rp.categoryId === p.categoryId)
      .slice(0, 5);
  });

  ngOnInit(): void {
    this.branchService.load();
  }

  private loadProduct(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.productService.getById(id).subscribe({
      next: (product) => this.product.set(product),
      error: () => void this.router.navigate(['/shop']),
    });
    this.productService.getAll().subscribe((products) => this.allProducts.set(products));
  }

  protected prevImage(): void {
    const p = this.product();
    if (!p || p.images.length <= 1) return;
    this.selectedIndex.update((i) => (i === 0 ? p.images.length - 1 : i - 1));
  }

  protected nextImage(): void {
    const p = this.product();
    if (!p || p.images.length <= 1) return;
    this.selectedIndex.update((i) => (i === p.images.length - 1 ? 0 : i + 1));
  }

  protected add(): void {
    const p = this.product();
    if (!p) return;
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
      this.qty(),
      this.galleryMain()?.nativeElement,
    );
    this.qty.set(1);
  }

  protected subscribeRestock(event: Event): void {
    event.preventDefault();
    const p = this.product();
    const email = this.restockEmail().trim();
    if (!p || !email || this.restockLoading()) return;

    this.restockLoading.set(true);
    this.restockError.set('');
    this.stockSubscriptions.subscribe(p.id, email).subscribe({
      next: () => {
        this.restockLoading.set(false);
        this.restockSent.set(true);
      },
      error: () => {
        this.restockLoading.set(false);
        this.restockError.set('No pudimos registrar tu correo. Intenta de nuevo.');
      },
    });
  }

  protected toggleWishlist(): void {
    const p = this.product();
    if (p) this.favorites.toggle(p);
  }

  protected share(platform: string): void {
    const p = this.product();
    if (!p) return;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `Mira este producto: ${p.name}`;
    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
      email: `mailto:?subject=${encodeURIComponent(p.name)}&body=${encodeURIComponent(text + '\n' + url)}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(text)}`,
    };
    const shareUrl = urls[platform];
    if (shareUrl && typeof window !== 'undefined') {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  }
}

function readProductFromState(router: Router): Product | null {
  const fromNav = (router.getCurrentNavigation()?.extras.state as { product?: Product } | undefined)
    ?.product;
  if (fromNav) return fromNav;
  if (typeof history !== 'undefined') {
    const fromHistory = (history.state as { product?: Product } | null)?.product;
    if (fromHistory) return fromHistory;
  }
  return null;
}
