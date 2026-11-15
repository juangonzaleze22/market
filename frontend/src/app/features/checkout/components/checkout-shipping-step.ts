import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MapPicker } from '../../../shared/ui/map-picker';
import { MapPreviewComponent } from '../../../shared/ui/map-preview';
import { Address } from '../../../core/services/address.service';
import { CheckoutStore } from '../checkout-store';

@Component({
  selector: 'app-checkout-shipping-step',
  imports: [FormsModule, RouterLink, MapPicker, MapPreviewComponent],
  template: `
    <section class="checkout-step-card" data-testid="shipping-section">
      <div class="checkout-step-head">
        <div>
          <h2 class="checkout-step-title">Dirección de envío</h2>
          <p class="checkout-step-subtitle">
            Elegí dónde querés recibir tu pedido.
          </p>
        </div>
        <a
          routerLink="/account/addresses"
          class="checkout-step-link"
          data-testid="manage-addresses-link"
        >
          Gestionar direcciones
        </a>
      </div>

      @if (!store.hasItems()) {
        <div class="checkout-empty" data-testid="checkout-empty-cart">
          <p class="text-body-sm-strong">Tu carrito está vacío</p>
          <p class="text-body-sm text-body">
            Agregá productos para poder finalizar la compra.
          </p>
          <a routerLink="/shop" class="btn-primary-sm mt-md inline-flex">Ir a la tienda</a>
        </div>
      }

      @if (store.selectedBranch(); as branch) {
        <div class="checkout-branch" data-testid="checkout-branch">
          <div>
            <p class="form-hint">Pedido desde</p>
            <p class="text-body-sm-strong">{{ branch.name }}</p>
          </div>
          <span class="text-caption text-mute">{{ branch.city }}, {{ branch.state }}</span>
        </div>
      }

      @if (!store.showAddressForm()) {
        @if (store.branchAddresses().length > 0) {
          <div class="address-grid" data-testid="address-list">
            @for (addr of store.branchAddresses(); track addr.id) {
              <label
                class="address-card"
                [class.selected]="store.selectedAddressId() === addr.id"
                [class.has-map]="showMap(addr)"
                data-testid="address-option"
              >
                <input
                  type="radio"
                  name="address"
                  class="sr-only"
                  [value]="addr.id"
                  [checked]="store.selectedAddressId() === addr.id"
                  (change)="store.selectAddress(addr.id)"
                />

                <span
                  class="address-radio"
                  [class.checked]="store.selectedAddressId() === addr.id"
                  aria-hidden="true"
                ></span>

                <div class="address-card-body">
                  <p class="address-card-title">
                    {{ addr.label || 'Dirección' }}
                  </p>
                  <p class="address-card-street">{{ addr.street }}</p>
                  <p class="address-card-meta">
                    {{ addr.city }}, {{ addr.state }} {{ addr.zipCode }}
                  </p>
                </div>

                @if (showMap(addr)) {
                  <div
                    class="address-card-map"
                    data-testid="address-map-preview"
                    (click)="$event.preventDefault(); $event.stopPropagation()"
                  >
                    <app-map-preview
                      [latitude]="addr.latitude"
                      [longitude]="addr.longitude"
                    />
                  </div>
                }

                @if (addr.isDefault) {
                  <span class="address-card-badge">Principal</span>
                }
              </label>
            }

            <button
              type="button"
              class="address-add-card"
              data-testid="add-address"
              (click)="store.showAddressForm.set(true)"
            >
              <span class="address-add-icon" aria-hidden="true">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </span>
              <span class="text-body-sm-strong">Agregar nueva dirección</span>
            </button>
          </div>
        } @else {
          <button
            type="button"
            class="checkout-address-empty"
            data-testid="add-address"
            (click)="store.showAddressForm.set(true)"
          >
            + Agregar dirección de envío
          </button>
        }
      } @else {
        <form class="address-form" (ngSubmit)="store.saveAddress()">
          <div class="form-field">
            <label for="street" class="form-label">
              Calle y número <span class="required">*</span>
            </label>
            <input
              id="street"
              type="text"
              placeholder="Av. Principal 1234"
              class="form-input"
              [class.is-invalid]="store.addressFieldEmpty('street')"
              [(ngModel)]="store.addressForm.street"
              name="street"
              required
            />
            @if (store.addressFieldEmpty('street')) {
              <p class="form-error">Completá la calle y número</p>
            }
          </div>

          <div class="form-row-2">
            <div class="form-field">
              <label for="city" class="form-label">
                Ciudad <span class="required">*</span>
              </label>
              <input
                id="city"
                type="text"
                placeholder="Guanare"
                class="form-input"
                [class.is-invalid]="store.addressFieldEmpty('city')"
                [(ngModel)]="store.addressForm.city"
                name="city"
                required
              />
              @if (store.addressFieldEmpty('city')) {
                <p class="form-error">Requerida</p>
              }
            </div>
            <div class="form-field">
              <label for="state" class="form-label">
                Estado <span class="required">*</span>
              </label>
              <input
                id="state"
                type="text"
                placeholder="Portuguesa"
                class="form-input"
                [class.is-invalid]="store.addressFieldEmpty('state')"
                [(ngModel)]="store.addressForm.state"
                name="state"
                required
              />
              @if (store.addressFieldEmpty('state')) {
                <p class="form-error">Requerido</p>
              }
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-field">
              <label for="zipCode" class="form-label">
                Código postal <span class="required">*</span>
              </label>
              <input
                id="zipCode"
                type="text"
                placeholder="3301"
                class="form-input"
                [class.is-invalid]="store.addressFieldEmpty('zipCode')"
                [(ngModel)]="store.addressForm.zipCode"
                name="zipCode"
                required
              />
              @if (store.addressFieldEmpty('zipCode')) {
                <p class="form-error">Requerido</p>
              }
            </div>
            <div class="form-field">
              <label for="country" class="form-label">
                País <span class="required">*</span>
              </label>
              <input
                id="country"
                type="text"
                class="form-input"
                [class.is-invalid]="store.addressFieldEmpty('country')"
                [(ngModel)]="store.addressForm.country"
                name="country"
                required
              />
              @if (store.addressFieldEmpty('country')) {
                <p class="form-error">Requerido</p>
              }
            </div>
          </div>

          <div class="form-field">
            <label for="label" class="form-label">
              Nombre de la dirección <span class="optional">(Opcional)</span>
            </label>
            <input
              id="label"
              type="text"
              placeholder="Casa, Trabajo, Mamá..."
              class="form-input"
              [(ngModel)]="store.addressForm.label"
              name="label"
              maxlength="30"
            />
          </div>

          <div class="form-field">
            <label for="reference" class="form-label">
              Referencia <span class="optional">(Opcional)</span>
            </label>
            <input
              id="reference"
              type="text"
              placeholder="Edificio azul, piso 3, al lado del cafetal"
              class="form-input"
              [(ngModel)]="store.addressForm.reference"
              name="reference"
            />
          </div>

          <div class="form-field">
            <span class="form-label">
              Ubicación en mapa <span class="optional">(Opcional)</span>
            </span>
            <button type="button" class="btn-map" (click)="mapPicker.open()">
              @if (store.addressForm.latitude && store.addressForm.longitude) {
                📍 Ubicación seleccionada — Tocar para cambiar
              } @else {
                🗺️ Abrir mapa para seleccionar ubicación
              }
            </button>
            @if (store.addressForm.latitude && store.addressForm.longitude) {
              <p class="form-hint">
                Lat: {{ store.addressForm.latitude.toFixed(6) }}, Lng:
                {{ store.addressForm.longitude.toFixed(6) }}
              </p>
            }
            @if (store.coverageError()) {
              <p class="form-error" data-testid="checkout-coverage-error">
                {{ store.coverageError() }}
              </p>
            }
          </div>

          <div class="flex gap-md">
            <button type="submit" class="btn-primary" [disabled]="store.savingAddress()">
              {{ store.savingAddress() ? 'Guardando...' : 'Guardar dirección' }}
            </button>
            @if (store.addresses().length > 0) {
              <button
                type="button"
                class="btn-secondary"
                (click)="store.showAddressForm.set(false); store.attemptedAddressSave.set(false)"
              >
                Cancelar
              </button>
            }
          </div>
        </form>
      }
    </section>

    <app-map-picker
      #mapPicker
      [branch]="store.selectedBranch()"
      [zones]="store.zones()"
      (locationSelected)="store.onLocationPicked($event)"
    />
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
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--spacing-md);
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

    .checkout-step-link {
      flex-shrink: 0;
      border: 0;
      background: none;
      font-size: var(--text-body-sm-strong);
      font-weight: 600;
      color: var(--color-primary);
      cursor: pointer;
      text-decoration: none;
    }

    .checkout-step-link:hover {
      text-decoration: underline;
    }

    .checkout-empty {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-xxs);
      margin-bottom: var(--spacing-lg);
      padding: var(--spacing-lg);
      border: 1px dashed var(--color-surface-pressed);
      border-radius: var(--radius-xl);
      background-color: var(--color-canvas-soft);
    }

    .checkout-branch {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
      padding: var(--spacing-sm) var(--spacing-lg);
      border-radius: var(--radius-lg);
      background-color: var(--color-canvas-soft);
    }

    .address-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: var(--spacing-sm);
    }

    .address-card {
      position: relative;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      grid-template-areas: 'radio body badge';
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-md) var(--spacing-lg);
      overflow: hidden;
      border: 2px solid var(--color-surface-pressed);
      border-radius: var(--radius-xl);
      background-color: var(--color-canvas);
      cursor: pointer;
      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease;
    }

    .address-card.has-map {
      grid-template-columns: auto minmax(0, 1fr) 180px auto;
      grid-template-areas: 'radio body map badge';
    }

    .address-card:hover {
      border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-surface-pressed));
    }

    .address-card.selected {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 1px var(--color-primary);
    }

    .address-radio {
      grid-area: radio;
      flex-shrink: 0;
      display: grid;
      place-items: center;
      width: 20px;
      height: 20px;
      border: 2px solid var(--color-surface-pressed);
      border-radius: 50%;
      background-color: var(--color-canvas);
      transition:
        border-color 0.2s ease,
        background-color 0.2s ease;
    }

    .address-radio::after {
      content: '';
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: transparent;
      transition: background-color 0.2s ease;
    }

    .address-radio.checked {
      border-color: var(--color-primary);
    }

    .address-radio.checked::after {
      background-color: var(--color-primary);
    }

    .address-card-body {
      grid-area: body;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .address-card-title {
      font-size: var(--text-body-sm-strong);
      font-weight: 700;
      color: var(--color-ink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .address-card-street {
      font-size: var(--text-body-sm);
      color: var(--color-body);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .address-card-meta {
      font-size: var(--text-caption);
      color: var(--color-mute);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .address-card-badge {
      grid-area: badge;
      flex-shrink: 0;
      padding: 2px var(--spacing-sm);
      border-radius: 999px;
      background-color: color-mix(in srgb, var(--color-primary) 12%, var(--color-canvas));
      font-size: var(--text-caption);
      font-weight: 600;
      color: var(--color-primary);
    }

    .address-card-map {
      grid-area: map;
      width: 180px;
      height: 104px;
      overflow: hidden;
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-lg);
      cursor: default;
    }

    .address-card-map app-map-preview {
      display: block;
      width: 100%;
      height: 100%;
    }

    .address-add-card {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-md) var(--spacing-lg);
      border: 2px dashed var(--color-surface-pressed);
      border-radius: var(--radius-xl);
      background: none;
      color: var(--color-mute);
      cursor: pointer;
      transition:
        border-color 0.2s ease,
        color 0.2s ease;
    }

    .address-add-card:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }

    .address-add-icon {
      display: grid;
      place-items: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background-color: var(--color-canvas-soft);
    }

    .address-add-icon svg {
      width: 18px;
      height: 18px;
    }

    .checkout-address-empty {
      width: 100%;
      padding: var(--spacing-xl);
      border: 2px dashed var(--color-surface-pressed);
      border-radius: var(--radius-xl);
      background: none;
      font-size: var(--text-body-sm-strong);
      font-weight: 600;
      color: var(--color-mute);
      cursor: pointer;
      transition:
        border-color 0.2s ease,
        color 0.2s ease;
    }

    .checkout-address-empty:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }

    .address-form {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
    }

    @media (max-width: 767px) {
      .address-card.has-map {
        grid-template-columns: auto minmax(0, 1fr) auto;
        grid-template-areas:
          'radio body badge'
          'map map map';
      }

      .address-card-map {
        width: 100%;
        height: 132px;
        margin-top: var(--spacing-sm);
      }
    }

    @media (max-width: 639px) {
      .checkout-step-card {
        padding: var(--spacing-lg);
      }

      .checkout-step-head {
        flex-direction: column;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .address-card,
      .address-add-card {
        transition: none;
      }
    }
  `,
})
export class CheckoutShippingStep {
  protected readonly store = inject(CheckoutStore);

  protected showMap(address: Address): boolean {
    return (
      this.store.selectedAddressId() === address.id &&
      address.latitude !== null &&
      address.longitude !== null
    );
  }
}
