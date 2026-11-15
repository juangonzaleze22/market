import {
  Component,
  ElementRef,
  OnInit,
  computed,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuthModalService } from '../../core/services/auth-modal.service';
import { CheckoutStore } from './checkout-store';
import { CheckoutStepper } from './components/checkout-stepper';
import { CheckoutShippingStep } from './components/checkout-shipping-step';
import { CheckoutPaymentStep } from './components/checkout-payment-step';
import { CheckoutReviewStep } from './components/checkout-review-step';
import { CheckoutOrderSummary } from './components/checkout-order-summary';

@Component({
  selector: 'app-checkout',
  imports: [
    DecimalPipe,
    CheckoutStepper,
    CheckoutShippingStep,
    CheckoutPaymentStep,
    CheckoutReviewStep,
    CheckoutOrderSummary,
  ],
  providers: [CheckoutStore],
  template: `
    <header class="checkout-bar" data-testid="checkout-bar">
      <div class="container-max checkout-bar-inner">
        <button
          type="button"
          class="checkout-bar-back"
          aria-label="Volver"
          data-testid="checkout-back"
          (click)="goBack()"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <h1 class="checkout-bar-title" data-testid="checkout-bar-title">
          {{ barTitle() }}
        </h1>

        <span class="checkout-bar-spacer" aria-hidden="true"></span>
      </div>
    </header>

    <section class="container-max checkout-page" data-testid="checkout-page">
      @if (!auth.isAuthed()) {
        <div class="checkout-auth-gate">
          <div class="checkout-auth-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-primary)"
              stroke-width="2"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <p class="text-body-lg mb-xl">Iniciá sesión para completar tu compra</p>
          <button
            type="button"
            class="btn-primary"
            (click)="authModal.openLogin()"
          >
            Iniciar sesión
          </button>
        </div>
      } @else {
        <div class="checkout-wizard">
          <app-checkout-stepper />

          <div class="checkout-main">
            <div
              #stepPanel
              class="checkout-panel"
              tabindex="-1"
              [class.is-back]="store.direction() === 'back'"
              [attr.data-step]="store.step()"
            >
              @switch (store.step()) {
                @case ('shipping') {
                  <app-checkout-shipping-step />
                }
                @case ('payment') {
                  <app-checkout-payment-step />
                }
                @case ('review') {
                  <app-checkout-review-step />
                }
              }
            </div>

            <div class="checkout-actions" data-testid="checkout-actions">
              @if (helperText(); as hint) {
                <p class="checkout-actions-hint" data-testid="checkout-step-error">
                  {{ hint }}
                </p>
              }
              <div class="checkout-actions-row">
                <div class="checkout-actions-total">
                  <span class="checkout-actions-total-label">Total</span>
                  <span class="checkout-actions-total-value">
                    {{ '$' + (store.cart.total() | number: '1.2-2') }}
                  </span>
                </div>

                <button
                  type="button"
                  class="btn-primary checkout-primary"
                  [disabled]="primaryDisabled()"
                  [attr.data-testid]="store.step() === 'review' ? 'place-order' : 'checkout-next'"
                  (click)="primaryAction()"
                >
                  {{ primaryLabel() }}
                </button>
              </div>
            </div>
          </div>

          <app-checkout-order-summary class="checkout-summary-col" />
        </div>

        <div class="checkout-features" data-testid="checkout-features">
          <div class="checkout-feature">
            <div class="checkout-feature-icon is-accent">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-accent)"
                stroke-width="2"
                aria-hidden="true"
              >
                <rect x="1" y="3" width="15" height="13" rx="2" />
                <path
                  d="M16 8h4l3 3v5a2 2 0 0 1-2 2h-1M6 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"
                />
              </svg>
            </div>
            <div>
              <p class="text-body-md-strong font-bold">Envío Gratis</p>
              <p class="text-body-sm text-body">En pedidos mayores a $50</p>
            </div>
          </div>
          <div class="checkout-feature">
            <div class="checkout-feature-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-primary)"
                stroke-width="2"
                aria-hidden="true"
              >
                <rect x="1" y="4" width="22" height="16" rx="2" />
                <path d="M1 10h22" />
              </svg>
            </div>
            <div>
              <p class="text-body-md-strong font-bold">Pago Flexible</p>
              <p class="text-body-sm text-body">Múltiples opciones seguras</p>
            </div>
          </div>
          <div class="checkout-feature">
            <div class="checkout-feature-icon is-accent">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-accent)"
                stroke-width="2"
                aria-hidden="true"
              >
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                <path
                  d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"
                />
              </svg>
            </div>
            <div>
              <p class="text-body-md-strong font-bold">Soporte 24×7</p>
              <p class="text-body-sm text-body">Atención en línea todos los días</p>
            </div>
          </div>
        </div>
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100vh;
      background-color: var(--color-canvas);
    }
  `,
})
export class Checkout implements OnInit {
  readonly auth = inject(AuthService);
  readonly authModal = inject(AuthModalService);
  protected readonly store = inject(CheckoutStore);
  private readonly router = inject(Router);

  private readonly stepPanel = viewChild<ElementRef<HTMLElement>>('stepPanel');
  private firstStepRun = true;

  protected readonly barTitle = computed(() => {
    if (!this.auth.isAuthed()) return 'Checkout';
    return this.store.activeStep().label;
  });

  protected readonly primaryLabel = computed(() => {
    if (this.store.placing()) return 'Procesando...';
    if (this.store.cart.validatingStock()) return 'Verificando stock...';
    if (this.store.step() === 'review') return 'Confirmar pedido';
    if (this.store.step() === 'payment') return 'Revisar pedido';
    return 'Continuar';
  });

  protected readonly primaryDisabled = computed(() => {
    if (this.store.placing() || this.store.cart.validatingStock()) return true;
    if (this.store.step() === 'review') return !this.store.canPlaceOrder();
    return !this.store.canContinue();
  });

  protected readonly helperText = computed(() => {
    if (this.store.placing() || this.store.cart.validatingStock()) return '';
    return this.primaryDisabled() ? this.store.blockingMessage() : '';
  });

  constructor() {
    effect(() => {
      this.store.step();
      if (this.firstStepRun) {
        this.firstStepRun = false;
        return;
      }

      setTimeout(() => {
        const element = this.stepPanel()?.nativeElement;
        if (!element) return;

        const reduceMotion = window.matchMedia?.(
          '(prefers-reduced-motion: reduce)',
        ).matches;
        if (window.matchMedia?.('(max-width: 1023px)').matches) {
          window.scrollTo({
            top: 0,
            behavior: reduceMotion ? 'auto' : 'smooth',
          });
        }
        element.focus({ preventScroll: true });
      });
    });
  }

  ngOnInit(): void {
    if (!this.auth.isAuthed()) return;
    this.store.init();
  }

  protected primaryAction(): void {
    if (this.store.step() === 'review') {
      this.store.onPlaceOrder();
      return;
    }
    this.store.goNext();
  }

  protected goBack(): void {
    if (this.auth.isAuthed() && this.store.step() !== 'shipping') {
      this.store.goBack();
      return;
    }

    void this.router.navigateByUrl('/').then(() => {
      this.store.cart.openDrawer();
    });
  }
}
