import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { CheckoutStore } from '../checkout-store';

@Component({
  selector: 'app-checkout-order-summary',
  imports: [DecimalPipe],
  template: `
    <div class="checkout-summary-card" data-testid="order-summary">
      <button
        type="button"
        class="checkout-summary-toggle"
        [attr.aria-expanded]="expanded()"
        aria-controls="checkout-summary-body"
        data-testid="checkout-summary-toggle"
        (click)="toggle()"
      >
        <span class="checkout-summary-toggle-title">
          Resumen · {{ store.cart.count() }}
          {{ store.cart.count() === 1 ? 'producto' : 'productos' }}
        </span>
        <span class="checkout-summary-toggle-total">
          {{ '$' + (store.cart.total() | number: '1.2-2') }}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="checkout-summary-chevron"
          [class.is-open]="expanded()"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <div
        id="checkout-summary-body"
        class="checkout-summary-body"
        [class.is-collapsed]="!expanded()"
      >
        <h2 class="checkout-summary-title">Resumen del pedido</h2>

        <div class="checkout-summary-items">
          @for (item of store.cart.items(); track item.id) {
            <div class="checkout-summary-item" data-testid="checkout-item">
              <div class="checkout-summary-thumb">
                @if (item.product.images && item.product.images.length > 0) {
                  <img
                    [src]="item.product.images[0]"
                    [alt]="item.product.name"
                    loading="lazy"
                    decoding="async"
                  />
                } @else {
                  <span>{{ item.product.name.charAt(0) }}</span>
                }
              </div>
              <div class="checkout-summary-item-main">
                <p class="checkout-summary-item-name">{{ item.product.name }}</p>
                <p class="checkout-summary-item-qty">Cant: {{ item.quantity }}</p>
              </div>
              <p class="checkout-summary-item-price" data-testid="checkout-item-price">
                {{
                  '$' +
                    (item.quantity * (item.flashSalePrice ?? item.product.price)
                      | number: '1.2-2')
                }}
              </p>
            </div>
          }
        </div>

        <div class="checkout-summary-totals">
          <div class="checkout-summary-row">
            <span class="checkout-summary-row-label">Subtotal</span>
            <span class="checkout-summary-row-value">
              {{ '$' + (store.cart.total() | number: '1.2-2') }}
            </span>
          </div>
          <div class="checkout-summary-row">
            <span class="checkout-summary-row-label">Envío</span>
            <span class="checkout-summary-row-value is-primary">Gratis</span>
          </div>
          <div class="checkout-summary-row">
            <span class="checkout-summary-row-label">Impuestos</span>
            <span class="checkout-summary-row-value">$0.00</span>
          </div>
        </div>

        <div class="checkout-summary-total">
          <span>Total</span>
          <span data-testid="checkout-total">
            {{ '$' + (store.cart.total() | number: '1.2-2') }}
          </span>
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }

    .checkout-summary-card {
      background-color: var(--color-canvas);
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-xl);
      padding: var(--spacing-lg);
    }

    @media (min-width: 1280px) {
      .checkout-summary-card {
        position: sticky;
        top: 96px;
      }
    }

    .checkout-summary-toggle {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      width: 100%;
      padding: 0;
      border: 0;
      background: none;
      color: inherit;
      text-align: left;
      cursor: pointer;
    }

    .checkout-summary-toggle-title {
      flex: 1;
      font-size: var(--text-body-sm-strong);
      font-weight: 600;
      color: var(--color-ink);
    }

    .checkout-summary-toggle-total {
      font-size: var(--text-body-sm-strong);
      font-weight: 700;
      color: var(--color-ink);
    }

    .checkout-summary-chevron {
      width: 18px;
      height: 18px;
      color: var(--color-mute);
      transition: transform 0.2s ease;
    }

    .checkout-summary-chevron.is-open {
      transform: rotate(180deg);
    }

    .checkout-summary-body.is-collapsed {
      display: none;
    }

    .checkout-summary-title {
      display: none;
      margin-bottom: var(--spacing-lg);
      padding-bottom: var(--spacing-md);
      border-bottom: 1px solid var(--color-surface-pressed);
      font-size: var(--text-body-lg-strong);
      font-weight: 700;
      color: var(--color-ink);
    }

    .checkout-summary-items {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      max-height: 260px;
      margin-top: var(--spacing-lg);
      overflow-y: auto;
    }

    .checkout-summary-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .checkout-summary-thumb {
      display: grid;
      place-items: center;
      flex-shrink: 0;
      width: 44px;
      height: 44px;
      overflow: hidden;
      border-radius: var(--radius-lg);
      background-color: var(--color-canvas-softer);
      color: var(--color-mute);
      font-size: var(--text-caption);
    }

    .checkout-summary-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .checkout-summary-item-main {
      flex: 1;
      min-width: 0;
    }

    .checkout-summary-item-name {
      overflow: hidden;
      font-size: var(--text-body-sm);
      color: var(--color-ink);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .checkout-summary-item-qty {
      font-size: var(--text-caption);
      color: var(--color-mute);
    }

    .checkout-summary-item-price {
      flex-shrink: 0;
      font-size: var(--text-body-sm-strong);
      font-weight: 600;
      color: var(--color-ink);
      white-space: nowrap;
    }

    .checkout-summary-totals {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      margin-top: var(--spacing-lg);
      padding-top: var(--spacing-lg);
      border-top: 1px solid var(--color-surface-pressed);
    }

    .checkout-summary-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-md);
    }

    .checkout-summary-row-label {
      font-size: var(--text-body-sm);
      color: var(--color-body);
    }

    .checkout-summary-row-value {
      font-size: var(--text-body-sm-strong);
      font-weight: 600;
      color: var(--color-ink);
    }

    .checkout-summary-row-value.is-primary {
      color: var(--color-link);
    }

    .checkout-summary-total {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-md);
      margin-top: var(--spacing-md);
      padding-top: var(--spacing-md);
      border-top: 2px solid var(--color-ink);
      font-size: var(--text-body-lg-strong);
      font-weight: 700;
      color: var(--color-ink);
    }

    @media (min-width: 1024px) {
      .checkout-summary-card {
        padding: var(--spacing-xl);
      }

      .checkout-summary-toggle {
        display: none;
      }

      .checkout-summary-body.is-collapsed {
        display: block;
      }

      .checkout-summary-title {
        display: block;
      }

      .checkout-summary-items {
        margin-top: 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .checkout-summary-chevron {
        transition: none;
      }
    }
  `,
})
export class CheckoutOrderSummary {
  protected readonly store = inject(CheckoutStore);
  protected readonly expanded = signal(false);

  protected toggle(): void {
    this.expanded.update((value) => !value);
  }
}
