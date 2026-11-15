import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { CheckoutStore } from '../checkout-store';

@Component({
  selector: 'app-checkout-review-step',
  imports: [DecimalPipe],
  template: `
    <section class="checkout-step-card" data-testid="checkout-step-review">
      <div class="checkout-step-head">
        <div>
          <h2 class="checkout-step-title">Revisá tu pedido</h2>
          <p class="checkout-step-subtitle">
            Verificá los datos antes de confirmar la compra.
          </p>
        </div>
      </div>

      <div class="review-block">
        <div class="review-block-head">
          <h3 class="review-block-title">Envío</h3>
          <button
            type="button"
            class="review-edit"
            data-testid="review-edit-shipping"
            (click)="store.goTo('shipping')"
          >
            Editar
          </button>
        </div>
        @if (store.selectedAddress(); as address) {
          <p class="review-main">
            @if (address.label) {
              <span class="text-primary font-semibold">{{ address.label }}</span>
              <span class="text-mute"> — </span>
            }
            {{ address.street }}
          </p>
          <p class="review-sub">
            {{ address.city }}, {{ address.state }} {{ address.zipCode }}
          </p>
        } @else {
          <p class="review-sub">Sin dirección seleccionada</p>
        }
        @if (store.selectedBranch(); as branch) {
          <p class="review-sub">Desde {{ branch.name }}</p>
        }
      </div>

      <div class="review-block">
        <div class="review-block-head">
          <h3 class="review-block-title">Pago</h3>
          <button
            type="button"
            class="review-edit"
            data-testid="review-edit-payment"
            (click)="store.goTo('payment')"
          >
            Editar
          </button>
        </div>
        <p class="review-main" data-testid="review-payment-method">
          {{ store.paymentLabel() }}
        </p>
        @if (store.requiresPaymentProof()) {
          <p class="review-sub">Referencia: {{ store.paymentReference() }}</p>
          @if (store.receiptPreview()) {
            <div class="review-receipt">
              <img [src]="store.receiptPreview()" alt="Comprobante" />
              <span class="review-sub">Comprobante adjunto</span>
            </div>
          }
        } @else {
          <p class="review-sub">Pagás contra entrega</p>
        }
      </div>

      <div class="review-total">
        <span>Total a pagar</span>
        <span>{{ '$' + (store.cart.total() | number: '1.2-2') }}</span>
      </div>

      @if (store.cart.stockMessage()) {
        <p class="form-error mt-md" data-testid="checkout-stock-error" role="alert">
          {{ store.cart.stockMessage() }}
        </p>
      }

      @if (store.error()) {
        <p class="form-error mt-md" role="alert">{{ store.error() }}</p>
      }

      <p class="review-legal">
        Al confirmar, aceptás los términos y condiciones de compra.
      </p>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .checkout-step-card {
      background-color: var(--color-canvas);
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-xl);
      padding: var(--spacing-xl);
    }

    .checkout-step-head {
      margin-bottom: var(--spacing-lg);
    }

    .checkout-step-title {
      font-size: var(--text-body-lg-strong);
      font-weight: 700;
      color: var(--color-ink);
    }

    .checkout-step-subtitle {
      margin-top: 2px;
      font-size: var(--text-body-sm);
      color: var(--color-body);
    }

    .review-block {
      margin-bottom: var(--spacing-md);
      padding: var(--spacing-md) var(--spacing-lg);
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-xl);
    }

    .review-block-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-xs);
    }

    .review-block-title {
      font-size: var(--text-body-sm-strong);
      font-weight: 700;
      color: var(--color-ink);
    }

    .review-edit {
      border: 0;
      background: none;
      font-size: var(--text-body-sm-strong);
      font-weight: 600;
      color: var(--color-primary);
      cursor: pointer;
    }

    .review-edit:hover {
      text-decoration: underline;
    }

    .review-main {
      font-size: var(--text-body-sm-strong);
      font-weight: 600;
      color: var(--color-ink);
    }

    .review-sub {
      margin-top: 2px;
      font-size: var(--text-body-sm);
      color: var(--color-body);
    }

    .review-receipt {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      margin-top: var(--spacing-sm);
    }

    .review-receipt img {
      width: 44px;
      height: 44px;
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-lg);
      object-fit: cover;
    }

    .review-total {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-md);
      margin-top: var(--spacing-lg);
      padding-top: var(--spacing-md);
      border-top: 2px solid var(--color-ink);
      font-size: var(--text-body-lg-strong);
      font-weight: 700;
      color: var(--color-ink);
    }

    .review-legal {
      margin-top: var(--spacing-md);
      font-size: var(--text-caption);
      color: var(--color-mute);
      text-align: center;
    }

    @media (max-width: 639px) {
      .checkout-step-card {
        padding: var(--spacing-lg);
      }
    }
  `,
})
export class CheckoutReviewStep {
  protected readonly store = inject(CheckoutStore);
}
