import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuthModalService } from '../../core/services/auth-modal.service';
import { FavoriteService } from '../../core/services/favorite.service';
import { ProductCard } from '../../shared/ui/product-card';
import { Breadcrumb, PageHero } from '../../shared/ui/page-hero';

@Component({
  selector: 'app-favorites',
  imports: [RouterLink, PageHero, ProductCard],
  template: `
    <app-page-hero title="Favoritos" [breadcrumbs]="breadcrumbs" />

    <section class="container-max favorites-section" data-testid="favorites-page">
      @if (!auth.isAuthed()) {
        <div class="favorites-empty" data-testid="favorites-login">
          <p class="favorites-empty-text">Iniciá sesión para ver tus productos favoritos.</p>
          <button
            type="button"
            class="btn-primary"
            (click)="authModal.openLogin('/favorites')"
            data-testid="favorites-login-button"
          >
            Iniciar sesión
          </button>
        </div>
      } @else if (favorites.loading()) {
        <div class="favorites-grid" data-testid="favorites-loading">
          <div class="favorites-skeleton"></div>
          <div class="favorites-skeleton"></div>
          <div class="favorites-skeleton"></div>
          <div class="favorites-skeleton"></div>
        </div>
      } @else if (favorites.items().length === 0) {
        <div class="favorites-empty" data-testid="favorites-empty">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            class="favorites-empty-icon"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
          <p class="favorites-empty-text">Todavía no tenés productos favoritos.</p>
          <p class="favorites-empty-hint">Marcá el corazón en cualquier producto para guardarlo acá.</p>
          <a routerLink="/shop" class="btn-primary" data-testid="favorites-shop-link">
            Explorar productos
          </a>
        </div>
      } @else {
        <p class="favorites-count" data-testid="favorites-count-text">
          {{ favorites.count() }} {{ favorites.count() === 1 ? 'producto' : 'productos' }}
        </p>
        <div class="favorites-grid" data-testid="favorites-grid">
          @for (favorite of favorites.items(); track favorite.productId) {
            <app-product-card [product]="favorite.product" />
          }
        </div>
      }
    </section>
  `,
  styles: `
    .favorites-section {
      padding-top: var(--spacing-2xl);
      padding-bottom: var(--spacing-3xl);
    }

    .favorites-count {
      font-size: var(--text-body-sm);
      color: var(--color-body);
      margin-bottom: var(--spacing-lg);
    }

    .favorites-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--spacing-lg);
    }

    .favorites-skeleton {
      height: 340px;
      border-radius: 16px;
      background-color: var(--color-canvas-softer);
      animation: favorites-pulse 1.5s ease-in-out infinite;
    }

    @keyframes favorites-pulse {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    .favorites-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-3xl) var(--spacing-lg);
      text-align: center;
      background-color: var(--color-canvas);
      border: 1px solid var(--color-surface-pressed);
      border-radius: 16px;
    }

    .favorites-empty-icon {
      width: 48px;
      height: 48px;
      color: var(--color-mute);
    }

    .favorites-empty-text {
      font-size: var(--text-body-lg);
      font-weight: 600;
      color: var(--color-ink);
    }

    .favorites-empty-hint {
      font-size: var(--text-body-sm);
      color: var(--color-body);
    }

    @media (max-width: 1024px) {
      .favorites-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (max-width: 768px) {
      .favorites-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: var(--spacing-md);
      }
    }

    @media (max-width: 480px) {
      .favorites-grid {
        gap: var(--spacing-sm);
      }
    }
  `,
})
export class Favorites implements OnInit {
  protected readonly auth = inject(AuthService);
  protected readonly authModal = inject(AuthModalService);
  protected readonly favorites = inject(FavoriteService);

  protected readonly breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', link: '/' },
    { label: 'Favoritos' },
  ];

  ngOnInit(): void {
    this.favorites.load();
  }
}
