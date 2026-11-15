import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CheckoutStore } from '../checkout-store';

@Component({
  selector: 'app-checkout-payment-step',
  imports: [FormsModule],
  template: `
    <section class="checkout-step-card" data-testid="payment-section">
      <div class="checkout-step-head">
        <div>
          <h2 class="checkout-step-title">Método de pago</h2>
          <p class="checkout-step-subtitle">
            Elegí cómo querés pagar y adjuntá el comprobante.
          </p>
        </div>
      </div>

      @if (store.error()) {
        <p class="form-error checkout-step-error" role="alert">{{ store.error() }}</p>
      }

      <div class="payment-grid">
        <label
          class="payment-card"
          [class.is-selected]="store.paymentMethod() === 'pago_movil'"
        >
          <input
            type="radio"
            name="payment"
            value="pago_movil"
            [checked]="store.paymentMethod() === 'pago_movil'"
            (change)="store.paymentMethod.set('pago_movil')"
            class="sr-only"
          />
          @if (store.paymentMethod() === 'pago_movil') {
            <span class="payment-card-check" aria-hidden="true">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          }
          <img
            src="/metodos_pagos/telefono-inteligente.png"
            alt="Pago Móvil"
            class="payment-card-img"
          />
          <div>
            <p class="text-body-sm-strong">Pago Móvil</p>
            <p class="text-caption text-body payment-card-desc">Bancos locales</p>
          </div>
        </label>

        <label class="payment-card" [class.is-selected]="store.paymentMethod() === 'zelle'">
          <input
            type="radio"
            name="payment"
            value="zelle"
            [checked]="store.paymentMethod() === 'zelle'"
            (change)="store.paymentMethod.set('zelle')"
            class="sr-only"
          />
          @if (store.paymentMethod() === 'zelle') {
            <span class="payment-card-check" aria-hidden="true">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          }
          <img
            src="/metodos_pagos/Zelle_logo.svg.png"
            alt="Zelle"
            class="payment-card-img payment-card-img-wide"
          />
          <div>
            <p class="text-body-sm-strong">Zelle</p>
            <p class="text-caption text-body payment-card-desc">USD instantáneo</p>
          </div>
        </label>

        <label class="payment-card" [class.is-selected]="store.paymentMethod() === 'cash'">
          <input
            type="radio"
            name="payment"
            value="cash"
            [checked]="store.paymentMethod() === 'cash'"
            (change)="store.paymentMethod.set('cash')"
            class="sr-only"
          />
          @if (store.paymentMethod() === 'cash') {
            <span class="payment-card-check" aria-hidden="true">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          }
          <img
            src="/metodos_pagos/dolar.png"
            alt="Efectivo"
            class="payment-card-img"
          />
          <div>
            <p class="text-body-sm-strong">Efectivo</p>
            <p class="text-caption text-body payment-card-desc">Contra entrega</p>
          </div>
        </label>
      </div>

      @if (store.paymentMethod() === 'pago_movil') {
        @if (pagoMovil(); as pagoMovilData) {
          <div class="checkout-info-card">
            <div class="checkout-info-head">
              <p class="text-body-md-strong font-bold">Datos para Pago Móvil</p>
              <button
                type="button"
                class="checkout-copy-btn"
                (click)="store.copyPagoMovil()"
              >
                @if (store.copied() === 'pago_movil') {
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    class="w-4 h-4"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copiado
                } @else {
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    class="w-4 h-4"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copiar datos
                }
              </button>
            </div>
            <div class="checkout-info-grid">
              <div>
                <p class="checkout-info-label">Banco</p>
                <p class="checkout-info-value">{{ pagoMovilData.bank }}</p>
              </div>
              <div>
                <p class="checkout-info-label">Cédula / RIF</p>
                <p class="checkout-info-value">{{ pagoMovilData.idDocument }}</p>
              </div>
              <div>
                <p class="checkout-info-label">Teléfono</p>
                <p class="checkout-info-value">{{ pagoMovilData.phone }}</p>
              </div>
              <div>
                <p class="checkout-info-label">Titular</p>
                <p class="checkout-info-value">{{ pagoMovilData.holderName }}</p>
              </div>
            </div>
          </div>
        }
      }

      @if (store.paymentMethod() === 'zelle') {
        @if (zelle(); as zelleData) {
          <div class="checkout-info-card">
            <div class="checkout-info-head">
              <p class="text-body-md-strong font-bold">Datos para Zelle</p>
              <button type="button" class="checkout-copy-btn" (click)="store.copyZelle()">
                @if (store.copied() === 'zelle') {
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    class="w-4 h-4"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copiado
                } @else {
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    class="w-4 h-4"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copiar email
                }
              </button>
            </div>
            <div class="checkout-info-grid">
              <div>
                <p class="checkout-info-label">Email</p>
                <p class="checkout-info-value">{{ zelleData.email }}</p>
              </div>
              <div>
                <p class="checkout-info-label">Nombre del titular</p>
                <p class="checkout-info-value">{{ zelleData.holderName }}</p>
              </div>
            </div>
          </div>
        }
      }

      @if (store.paymentMethod() === 'cash') {
        <p class="checkout-cash-hint">
          Pagás al recibir tu pedido. No necesitás referencia ni comprobante.
        </p>
      } @else {
        <div class="payment-proof-card">
          <div class="form-field">
            <label for="paymentRef" class="form-label">
              Referencia del pago <span class="required">*</span>
            </label>
            <input
              id="paymentRef"
              type="text"
              placeholder="Ej: 1234567890"
              class="form-input"
              [class.is-invalid]="
                store.attemptedPayment() && store.paymentReference().trim().length === 0
              "
              [ngModel]="store.paymentReference()"
              (ngModelChange)="store.paymentReference.set($event)"
              name="paymentRef"
              required
            />
            @if (store.attemptedPayment() && store.paymentReference().trim().length === 0) {
              <p class="form-error">Ingresá la referencia del pago</p>
            } @else {
              <p class="form-hint">
                Número de referencia o comprobante de la transferencia
              </p>
            }
          </div>

          <div class="receipt-upload">
            <div class="receipt-upload-head">
              <p class="form-label">
                Comprobante de pago <span class="required">*</span>
              </p>
              <p class="form-hint">
                Subí una captura o foto del comprobante para verificación manual.
              </p>
            </div>

            @if (!store.receiptPreview()) {
              <label
                class="receipt-dropzone"
                [class.is-invalid]="store.attemptedPayment() && !store.receiptFile()"
                data-testid="receipt-upload"
              >
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  (change)="store.onReceiptSelected($event)"
                />
                <span class="receipt-dropzone-icon" aria-hidden="true">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </span>
                <span class="text-body-sm-strong">Tocá para seleccionar imagen</span>
                <span class="receipt-dropzone-hint">JPG, PNG — Máx. 5MB</span>
              </label>
            } @else {
              <div class="receipt-preview" data-testid="receipt-upload">
                <img [src]="store.receiptPreview()" alt="Comprobante" class="receipt-img" />
                <div class="receipt-preview-actions">
                  <label class="receipt-change-btn">
                    <input
                      type="file"
                      accept="image/*"
                      class="hidden"
                      (change)="store.onReceiptSelected($event)"
                    />
                    Cambiar imagen
                  </label>
                  <button
                    type="button"
                    class="receipt-remove-btn"
                    (click)="store.removeReceipt()"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            }

            @if (store.attemptedPayment() && !store.receiptFile()) {
              <p class="form-error">Adjuntá el comprobante para continuar</p>
            }
          </div>
        </div>
      }
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

    .checkout-step-error {
      margin-bottom: var(--spacing-md);
    }

    .payment-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-lg);
    }

    .payment-card {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-md) var(--spacing-sm);
      border: 2px solid var(--color-surface-pressed);
      border-radius: var(--radius-xl);
      background-color: var(--color-canvas);
      text-align: center;
      cursor: pointer;
      transition:
        border-color 0.2s ease,
        background-color 0.2s ease,
        transform 0.2s ease;
    }

    .payment-card:hover {
      border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-surface-pressed));
    }

    .payment-card.is-selected {
      border-color: var(--color-primary);
      background-color: color-mix(in srgb, var(--color-primary) 4%, var(--color-canvas));
    }

    .payment-card-img {
      width: 48px;
      height: 48px;
      object-fit: contain;
    }

    .payment-card-img-wide {
      width: 84px;
      height: auto;
      max-height: 48px;
    }

    .payment-card-check {
      position: absolute;
      top: 6px;
      right: 6px;
      display: grid;
      place-items: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background-color: var(--color-primary);
      color: var(--color-on-primary);
    }

    .payment-card-check svg {
      width: 12px;
      height: 12px;
    }

    .checkout-info-card {
      margin-bottom: var(--spacing-lg);
      padding: var(--spacing-lg);
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-xl);
      background-color: var(--color-canvas-soft);
    }

    .checkout-info-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-md);
      padding-bottom: var(--spacing-sm);
      border-bottom: 1px solid var(--color-surface-pressed);
    }

    .checkout-copy-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-xxs) var(--spacing-md);
      border: 1px solid var(--color-primary);
      border-radius: var(--radius-pill);
      background: none;
      font-size: var(--text-body-xs);
      font-weight: 600;
      color: var(--color-link);
      cursor: pointer;
      transition:
        background-color 0.2s ease,
        color 0.2s ease;
    }

    .checkout-copy-btn:hover {
      background-color: var(--color-primary);
      color: var(--color-on-primary);
    }

    .checkout-info-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--spacing-md);
    }

    .checkout-info-label {
      margin-bottom: 2px;
      font-size: var(--text-body-xs);
      color: var(--color-mute);
    }

    .checkout-info-value {
      font-size: var(--text-body-sm-strong);
      font-weight: 600;
      color: var(--color-ink);
    }

    .checkout-cash-hint {
      padding: var(--spacing-md) var(--spacing-lg);
      border-radius: var(--radius-lg);
      background-color: var(--color-canvas-soft);
      font-size: var(--text-body-sm);
      color: var(--color-body);
    }

    .payment-proof-card {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
      padding: var(--spacing-lg);
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-xl);
      background-color: var(--color-canvas);
    }

    .receipt-upload {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      padding: 0;
      border: 0;
      background: none;
    }

    .receipt-upload-head {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .receipt-dropzone {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-xxs);
      min-height: 160px;
      padding: var(--spacing-xl);
      border: 2px dashed var(--color-surface-pressed);
      border-radius: var(--radius-xl);
      background-color: var(--color-canvas);
      color: var(--color-body);
      text-align: center;
      cursor: pointer;
      transition:
        border-color 0.2s ease,
        background-color 0.2s ease;
    }

    .receipt-dropzone:hover {
      border-color: var(--color-primary);
      background-color: color-mix(in srgb, var(--color-primary) 3%, var(--color-canvas));
    }

    .receipt-dropzone-icon {
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      margin-bottom: var(--spacing-xxs);
      border-radius: 50%;
      background-color: var(--color-canvas-soft);
      color: var(--color-link);
    }

    .receipt-dropzone-icon svg {
      width: 20px;
      height: 20px;
    }

    .receipt-dropzone-hint {
      font-size: var(--text-caption);
      color: var(--color-mute);
    }

    .receipt-dropzone.is-invalid {
      border-color: #dc2626;
    }

    .receipt-preview {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-sm);
    }

    .receipt-img {
      max-width: 100%;
      max-height: 240px;
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-lg);
      background-color: var(--color-canvas-soft);
      object-fit: contain;
    }

    .receipt-preview-actions {
      display: flex;
      gap: var(--spacing-sm);
    }

    .receipt-change-btn,
    .receipt-remove-btn {
      display: inline-flex;
      align-items: center;
      padding: var(--spacing-xs) var(--spacing-md);
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-pill);
      background-color: var(--color-canvas);
      font-size: var(--text-body-xs);
      font-weight: 600;
      color: var(--color-body);
      cursor: pointer;
      transition:
        border-color 0.2s ease,
        color 0.2s ease;
    }

    .receipt-change-btn:hover {
      border-color: var(--color-primary);
      color: var(--color-link);
    }

    .receipt-remove-btn:hover {
      border-color: #dc2626;
      color: #dc2626;
    }

    @media (max-width: 639px) {
      .checkout-step-card {
        padding: var(--spacing-lg);
      }

      .payment-card {
        gap: var(--spacing-xs);
        padding: var(--spacing-sm) var(--spacing-xxs);
      }

      .payment-card-img {
        width: 34px;
        height: 34px;
      }

      .payment-card-img-wide {
        width: 58px;
        max-height: 34px;
      }

      .payment-card-desc {
        display: none;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .payment-card,
      .checkout-copy-btn,
      .receipt-dropzone,
      .receipt-change-btn,
      .receipt-remove-btn {
        transition: none;
      }
    }
  `,
})
export class CheckoutPaymentStep {
  protected readonly store = inject(CheckoutStore);

  protected readonly pagoMovil = computed(
    () => this.store.settings().paymentInfo?.pago_movil ?? null,
  );
  protected readonly zelle = computed(
    () => this.store.settings().paymentInfo?.zelle ?? null,
  );
}
