import { Component } from '@angular/core';

@Component({
  selector: 'app-trust-strip',
  template: `
    <section class="container-max py-3xl" data-testid="trust-strip">
      <div class="trust-grid">
        <div class="trust-item" data-testid="trust-shipping">
          <span class="trust-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M3 7h11v10H3z" />
              <path d="M14 10h4l3 3v4h-7z" />
              <circle cx="7" cy="18" r="1.6" />
              <circle cx="17.5" cy="18" r="1.6" />
            </svg>
          </span>
          <div>
            <p class="trust-title">Envío rápido</p>
            <p class="trust-text">Entregas en 24–72 h en zonas principales.</p>
          </div>
        </div>

        <div class="trust-item" data-testid="trust-returns">
          <span class="trust-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 4v5h5" />
            </svg>
          </span>
          <div>
            <p class="trust-title">Devoluciones fáciles</p>
            <p class="trust-text">Hasta 30 días para cambiar de opinión.</p>
          </div>
        </div>

        <div class="trust-item" data-testid="trust-secure">
          <span class="trust-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M12 3 4 6v6c0 4.4 3.4 7.6 8 9 4.6-1.4 8-4.6 8-9V6z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </span>
          <div>
            <p class="trust-title">Pago seguro</p>
            <p class="trust-text">Tus datos protegidos en cada compra.</p>
          </div>
        </div>

        <div class="trust-item" data-testid="trust-support">
          <span class="trust-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M4 13a8 8 0 0 1 16 0" />
              <path d="M4 13v4a2 2 0 0 0 2 2h2v-6H6a2 2 0 0 0-2 2Z" />
              <path d="M20 13v4a2 2 0 0 1-2 2h-2v-6h2a2 2 0 0 1 2 2Z" />
            </svg>
          </span>
          <div>
            <p class="trust-title">Atención real</p>
            <p class="trust-text">Te ayudamos antes y después de comprar.</p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .trust-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--spacing-lg);
      border-top: 1px solid var(--color-surface-pressed);
      border-bottom: 1px solid var(--color-surface-pressed);
      padding: var(--spacing-2xl) 0;
    }

    .trust-item {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-md);
    }

    .trust-icon {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      border-radius: var(--radius-full);
      background-color: var(--color-canvas-soft);
      color: var(--color-primary);
    }

    .trust-icon svg {
      width: 20px;
      height: 20px;
    }

    .trust-title {
      font-size: var(--text-body-md-strong);
      font-weight: 700;
      color: var(--color-ink);
      margin: 0 0 var(--spacing-xxs);
      line-height: 18px;
    }

    .trust-text {
      font-size: var(--text-body-sm);
      color: var(--color-body);
      margin: 0;
      line-height: 18px;
    }

    @media (max-width: 1024px) {
      .trust-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 520px) {
      .trust-grid {
        grid-template-columns: 1fr;
        gap: var(--spacing-md);
      }
    }
  `,
})
export class TrustStrip {}
