import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <section class="not-found" data-testid="not-found-page">
      <div class="not-found-content container-max">
        <p class="not-found-code" aria-hidden="true" data-testid="not-found-code">404</p>

        <div class="not-found-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
            <path d="M8 11h6" />
          </svg>
        </div>

        <h1 class="not-found-title" data-testid="not-found-title">Página no encontrada</h1>
        <p class="not-found-text" data-testid="not-found-text">
          La página que estás buscando no existe, fue movida o el enlace es incorrecto.
        </p>

        <div class="not-found-actions">
          <a routerLink="/" class="btn-primary" data-testid="not-found-home-link">Volver al inicio</a>
          <a routerLink="/shop" class="btn-secondary" data-testid="not-found-shop-link">
            Explorar productos
          </a>
          <button
            type="button"
            class="btn-ghost"
            (click)="goBack()"
            data-testid="not-found-back-button"
          >
            Volver atrás
          </button>
        </div>

        <div class="not-found-help">
          <p class="not-found-help-title">¿Buscabas algo en particular?</p>
          <div class="not-found-links">
            <a routerLink="/shop" class="not-found-link">Tienda</a>
            <span class="not-found-dot" aria-hidden="true"></span>
            <a routerLink="/shop" [queryParams]="{ bestDeals: 'true' }" class="not-found-link">
              Ofertas
            </a>
            <span class="not-found-dot" aria-hidden="true"></span>
            <a routerLink="/cart" class="not-found-link">Carrito</a>
            <span class="not-found-dot" aria-hidden="true"></span>
            <a routerLink="/" class="not-found-link">Inicio</a>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .not-found {
      display: grid;
      place-items: center;
      min-height: 60vh;
      padding: var(--spacing-3xl) 0;
      background-color: var(--color-canvas);
    }

    .not-found-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      max-width: 40rem;
    }

    .not-found-code {
      font-size: clamp(var(--text-display-xxl), 14vw, 140px);
      line-height: 1;
      font-weight: 700;
      letter-spacing: -0.04em;
      color: var(--color-canvas-soft);
      margin: 0 0 calc(var(--spacing-xl) * -1);
      user-select: none;
    }

    .not-found-icon {
      position: relative;
      display: grid;
      place-items: center;
      width: 72px;
      height: 72px;
      border-radius: var(--radius-full);
      background-color: var(--color-canvas-softer);
      color: var(--color-primary);
      margin-bottom: var(--spacing-xl);
    }

    .not-found-icon svg {
      width: 32px;
      height: 32px;
    }

    .not-found-title {
      font-size: var(--text-display-xl);
      line-height: var(--text-display-xl--line-height);
      font-weight: 700;
      color: var(--color-ink);
      margin: 0 0 var(--spacing-sm);
    }

    .not-found-text {
      font-size: var(--text-body-md);
      line-height: var(--text-body-md--line-height);
      color: var(--color-body);
      margin: 0 0 var(--spacing-2xl);
      max-width: 28rem;
    }

    .not-found-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: var(--spacing-md);
    }

    .btn-ghost {
      background-color: transparent;
      color: var(--color-body);
      font-size: var(--text-button-md);
      line-height: var(--text-button-md--line-height);
      font-weight: 500;
      border: none;
      border-radius: var(--radius-pill);
      padding: var(--spacing-md) var(--spacing-lg);
      cursor: pointer;
      transition: color 0.2s ease;
    }

    .btn-ghost:hover {
      color: var(--color-ink);
    }

    .btn-ghost:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    .not-found-help {
      margin-top: var(--spacing-3xl);
      padding-top: var(--spacing-2xl);
      border-top: 1px solid var(--color-surface-pressed);
      width: 100%;
    }

    .not-found-help-title {
      font-size: var(--text-body-sm-strong);
      line-height: var(--text-body-sm-strong--line-height);
      font-weight: 600;
      color: var(--color-body);
      margin: 0 0 var(--spacing-md);
    }

    .not-found-links {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: var(--spacing-md);
    }

    .not-found-link {
      font-size: var(--text-body-sm-strong);
      line-height: var(--text-body-sm-strong--line-height);
      color: var(--color-ink);
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .not-found-link:hover {
      color: var(--color-primary);
      text-decoration: underline;
    }

    .not-found-dot {
      width: 3px;
      height: 3px;
      border-radius: var(--radius-full);
      background-color: var(--color-mute);
    }

    @media (max-width: 480px) {
      .not-found-actions {
        flex-direction: column;
        width: 100%;
      }

      .not-found-actions > a,
      .not-found-actions > button {
        width: 100%;
        text-align: center;
      }
    }
  `,
})
export class NotFound {
  private readonly location = inject(Location);

  protected goBack(): void {
    this.location.back();
  }
}
