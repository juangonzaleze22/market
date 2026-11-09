import {
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { AddressService, Address, AddressPayload } from '../../core/services/address.service';
import {
  BranchService,
  DeliveryZone,
} from '../../core/services/branch.service';
import { OrderService } from '../../core/services/order.service';
import { UploadService } from '../../core/services/upload.service';
import { AuthService } from '../../core/services/auth.service';
import { AuthModalService } from '../../core/services/auth-modal.service';
import { SiteSettingsService } from '../../core/services/site-settings.service';
import { MapPicker } from '../../shared/ui/map-picker';
import { environment } from '../../../environments/environment';

type PaymentMethod = 'pago_movil' | 'zelle' | 'cash';

@Component({
  selector: 'app-checkout',
  imports: [FormsModule, RouterLink, DecimalPipe, MapPicker],
  template: `
    <!-- Header -->
    <section class="bg-[#f8f8f8] py-2xl" data-testid="checkout-header">
      <div class="container-max text-center">
        <h1 class="text-display-lg font-bold mb-sm">Finalizar Compra</h1>
        <div class="flex items-center justify-center gap-sm text-body-sm text-body">
          <a routerLink="/" class="hover:text-primary transition">Inicio</a>
          <span>/</span>
          <a routerLink="/cart" class="hover:text-primary transition">Carrito</a>
          <span>/</span>
          <span class="text-ink font-medium">Checkout</span>
        </div>
      </div>
    </section>

    <section class="container-max py-3xl" data-testid="checkout-page">
      @if (!auth.isAuthed()) {
        <div
          class="bg-canvas rounded-xl p-3xl text-center max-w-[32rem] mx-auto border border-surface-pressed"
        >
          <div class="w-16 h-16 rounded-full bg-primary/10 grid place-items-center mx-auto mb-xl">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-primary)"
              stroke-width="2"
              class="w-8 h-8"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <p class="text-body-lg mb-xl">Iniciá sesión para completar tu compra</p>
          <button
            type="button"
            class="bg-primary text-white font-semibold px-xl py-md rounded-full hover:opacity-90 transition inline-block"
            (click)="authModal.openLogin()"
          >
            Iniciar sesión
          </button>
        </div>
      } @else {
        <!-- Step indicators -->
        <div class="flex items-center justify-center gap-0 mb-3xl" data-testid="checkout-steps">
          <div class="flex items-center gap-sm">
            <span
              class="w-8 h-8 rounded-full bg-primary text-white grid place-items-center text-body-sm font-bold"
              >✓</span
            >
            <span class="text-body-sm font-medium text-ink">Tu pedido</span>
          </div>
          <div class="w-10 h-0.5 bg-primary mx-sm"></div>
          <div class="flex items-center gap-sm">
            <span
              class="w-8 h-8 rounded-full grid place-items-center text-body-sm font-bold"
              [class.bg-primary]="selectedAddressId().length > 0"
              [class.text-white]="selectedAddressId().length > 0"
              [class.bg-canvas-soft]="selectedAddressId().length === 0"
              [class.text-mute]="selectedAddressId().length === 0"
            >
              @if (selectedAddressId().length > 0) {
                ✓
              } @else {
                2
              }
            </span>
            <span
              class="text-body-sm font-medium"
              [class.text-ink]="selectedAddressId().length > 0"
              [class.text-mute]="selectedAddressId().length === 0"
            >
              Envío
            </span>
          </div>
          <div
            class="w-10 h-0.5 mx-sm"
            [class.bg-primary]="selectedAddressId().length > 0"
            [class.bg-surface-pressed]="selectedAddressId().length === 0"
          ></div>
          <div class="flex items-center gap-sm">
            <span
              class="w-8 h-8 rounded-full grid place-items-center text-body-sm font-bold"
              [class.bg-primary]="false"
              [class.bg-canvas-soft]="true"
              [class.text-mute]="true"
            >
              3
            </span>
            <span class="text-body-sm font-medium text-mute">Pago</span>
          </div>
        </div>

        <!-- 2-column layout -->
        <div class="grid lg:grid-cols-3 gap-2xl">
          <!-- LEFT COLUMN: Form -->
          <div class="lg:col-span-2 flex flex-col gap-xl">
            <!-- Dirección de envío -->
            <div
              class="bg-canvas rounded-xl border border-surface-pressed p-xl"
              data-testid="shipping-section"
            >
              <div class="flex items-center justify-between gap-md mb-lg">
                <h2 class="text-body-lg-strong flex items-center gap-md">
                  <span
                    class="w-7 h-7 rounded-full bg-primary text-white grid place-items-center text-caption font-bold"
                    >1</span
                  >
                  Dirección de envío
                </h2>
                <a
                  routerLink="/account/addresses"
                  class="text-body-sm font-medium text-primary hover:underline"
                  data-testid="manage-addresses-link"
                >
                  Gestionar direcciones
                </a>
              </div>

              @if (branchService.selectedBranch(); as branch) {
                <div
                  class="flex items-center justify-between gap-md bg-canvas-soft rounded-xl px-lg py-md mb-lg"
                  data-testid="checkout-branch"
                >
                  <div>
                    <p class="form-hint">Pedido desde</p>
                    <p class="text-body-sm-strong">{{ branch.name }}</p>
                  </div>
                  <span class="text-caption text-mute">{{ branch.city }}, {{ branch.state }}</span>
                </div>
              }

              @if (!showAddressForm()) {
                @if (branchAddresses().length > 0) {
                  <div class="space-y-md">
                    @for (addr of branchAddresses(); track addr.id) {
                      <label
                        class="flex items-center gap-lg bg-canvas-soft rounded-xl px-lg py-4 cursor-pointer border-2 transition"
                        [class.border-primary]="selectedAddressId() === addr.id"
                        [class.border-transparent]="selectedAddressId() !== addr.id"
                        data-testid="address-option"
                      >
                        <input
                          type="radio"
                          name="address"
                          [value]="addr.id"
                          [checked]="selectedAddressId() === addr.id"
                          (change)="selectedAddressId.set(addr.id)"
                          class="accent-primary"
                        />
                        <div class="flex-1">
                          <p class="text-body-sm-strong">
                            @if (addr.label) {
                              <span class="text-primary font-semibold">{{ addr.label }}</span>
                              <span class="text-mute"> — </span>
                            }
                            {{ addr.street }}
                          </p>
                          <p class="text-body-sm text-body">
                            {{ addr.city }}, {{ addr.state }} {{ addr.zipCode }}
                          </p>
                          @if (addr.latitude && addr.longitude) {
                            <p class="text-caption text-mute mt-xxs">📍 Coordenadas guardadas</p>
                          }
                        </div>
                        @if (addr.isDefault) {
                          <span
                            class="bg-primary/10 text-primary text-caption font-medium px-3 py-1 rounded-full"
                            >Principal</span
                          >
                        }
                      </label>
                    }
                  </div>
                  <button
                    type="button"
                    class="mt-lg text-primary text-body-sm-strong font-medium hover:underline transition"
                    (click)="showAddressForm.set(true)"
                  >
                    + Agregar nueva dirección
                  </button>
                } @else {
                  <button
                    type="button"
                    class="w-full border-2 border-dashed border-surface-pressed rounded-xl py-xl text-body-sm-strong text-mute hover:border-primary hover:text-primary transition"
                    (click)="showAddressForm.set(true)"
                  >
                    + Agregar dirección de envío
                  </button>
                }
              } @else {
                <form class="space-y-lg" (ngSubmit)="saveAddress()">
                  <div>
                    <label for="street" class="block text-body-sm-strong mb-sm"
                      >Calle y número <span class="text-red-500">*</span></label
                    >
                    <input
                      id="street"
                      type="text"
                      placeholder="Av. Principal 1234"
                      class="w-full bg-canvas border rounded-lg px-lg py-3 text-body-md outline-none focus:ring-2"
                      [class.border-red-500]="addressFieldEmpty('street')"
                      [class.focus:ring-red-500]="addressFieldEmpty('street')"
                      [class.border-surface-pressed]="!addressFieldEmpty('street')"
                      [class.focus:ring-primary]="!addressFieldEmpty('street')"
                      [(ngModel)]="addressForm.street"
                      name="street"
                      required
                    />
                    @if (addressFieldEmpty('street')) {
                      <p class="text-red-600 mt-xxs flex items-center gap-xxs">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          class="w-3.5 h-3.5 shrink-0"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        Completá la calle y número
                      </p>
                    }
                  </div>
                  <div class="grid grid-cols-2 gap-lg">
                    <div>
                      <label for="city" class="block text-body-sm-strong mb-sm"
                        >Ciudad <span class="text-red-500">*</span></label
                      >
                      <input
                        id="city"
                        type="text"
                        placeholder="Guanare"
                        class="w-full bg-canvas border rounded-lg px-lg py-3 text-body-md outline-none focus:ring-2"
                        [class.border-red-500]="addressFieldEmpty('city')"
                        [class.focus:ring-red-500]="addressFieldEmpty('city')"
                        [class.border-surface-pressed]="!addressFieldEmpty('city')"
                        [class.focus:ring-primary]="!addressFieldEmpty('city')"
                        [(ngModel)]="addressForm.city"
                        name="city"
                        required
                      />
                      @if (addressFieldEmpty('city')) {
                        <p class="text-red-600 mt-xxs flex items-center gap-xxs">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            class="w-3.5 h-3.5 shrink-0"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          Requerida
                        </p>
                      }
                    </div>
                    <div>
                      <label for="state" class="block text-body-sm-strong mb-sm"
                        >Estado <span class="text-red-500">*</span></label
                      >
                      <input
                        id="state"
                        type="text"
                        placeholder="Portuguesa"
                        class="w-full bg-canvas border rounded-lg px-lg py-3 text-body-md outline-none focus:ring-2"
                        [class.border-red-500]="addressFieldEmpty('state')"
                        [class.focus:ring-red-500]="addressFieldEmpty('state')"
                        [class.border-surface-pressed]="!addressFieldEmpty('state')"
                        [class.focus:ring-primary]="!addressFieldEmpty('state')"
                        [(ngModel)]="addressForm.state"
                        name="state"
                        required
                      />
                      @if (addressFieldEmpty('state')) {
                        <p class="text-red-600 mt-xxs flex items-center gap-xxs">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            class="w-3.5 h-3.5 shrink-0"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          Requerido
                        </p>
                      }
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-lg">
                    <div>
                      <label for="zipCode" class="block text-body-sm-strong mb-sm"
                        >Código postal <span class="text-red-500">*</span></label
                      >
                      <input
                        id="zipCode"
                        type="text"
                        placeholder="3301"
                        class="w-full bg-canvas border rounded-lg px-lg py-3 text-body-md outline-none focus:ring-2"
                        [class.border-red-500]="addressFieldEmpty('zipCode')"
                        [class.focus:ring-red-500]="addressFieldEmpty('zipCode')"
                        [class.border-surface-pressed]="!addressFieldEmpty('zipCode')"
                        [class.focus:ring-primary]="!addressFieldEmpty('zipCode')"
                        [(ngModel)]="addressForm.zipCode"
                        name="zipCode"
                        required
                      />
                      @if (addressFieldEmpty('zipCode')) {
                        <p class="text-red-600 mt-xxs flex items-center gap-xxs">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            class="w-3.5 h-3.5 shrink-0"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          Requerido
                        </p>
                      }
                    </div>
                    <div>
                      <label for="country" class="block text-body-sm-strong mb-sm"
                        >País <span class="text-red-500">*</span></label
                      >
                      <input
                        id="country"
                        type="text"
                        class="w-full bg-canvas border rounded-lg px-lg py-3 text-body-md outline-none focus:ring-2"
                        [class.border-red-500]="addressFieldEmpty('country')"
                        [class.focus:ring-red-500]="addressFieldEmpty('country')"
                        [class.border-surface-pressed]="!addressFieldEmpty('country')"
                        [class.focus:ring-primary]="!addressFieldEmpty('country')"
                        [(ngModel)]="addressForm.country"
                        name="country"
                        required
                      />
                      @if (addressFieldEmpty('country')) {
                        <p class="text-red-600 mt-xxs flex items-center gap-xxs">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            class="w-3.5 h-3.5 shrink-0"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          Requerido
                        </p>
                      }
                    </div>
                  </div>
                  <div>
                    <label for="label" class="block text-body-sm-strong mb-sm"
                      >Nombre de la dirección
                      <span class="text-mute font-normal text-caption">(Opcional)</span></label
                    >
                    <input
                      id="label"
                      type="text"
                      placeholder="Casa, Trabajo, Mamá..."
                      class="w-full bg-canvas border border-surface-pressed rounded-lg px-lg py-3 text-body-md outline-none focus:ring-2 focus:ring-primary"
                      [(ngModel)]="addressForm.label"
                      name="label"
                      maxlength="30"
                    />
                  </div>
                  <div>
                    <label for="reference" class="block text-body-sm-strong mb-sm"
                      >Referencia
                      <span class="text-mute font-normal text-caption">(Opcional)</span></label
                    >
                    <input
                      id="reference"
                      type="text"
                      placeholder="Edificio azul, piso 3, al lado del cafetal"
                      class="w-full bg-canvas border border-surface-pressed rounded-lg px-lg py-3 text-body-md outline-none focus:ring-2 focus:ring-primary"
                      [(ngModel)]="addressForm.reference"
                      name="reference"
                    />
                  </div>
                  <div>
                    <label class="block text-body-sm-strong mb-sm"
                      >Ubicación en mapa
                      <span class="text-mute font-normal text-caption">(Opcional)</span></label
                    >
                    <button
                      type="button"
                      class="w-full border-2 border-dashed border-surface-pressed rounded-xl py-4 text-body-sm-strong hover:border-primary hover:text-primary transition"
                      (click)="mapPicker.open()"
                    >
                      @if (addressForm.latitude && addressForm.longitude) {
                        📍 Ubicación seleccionada — Tocar para cambiar
                      } @else {
                        🗺️ Abrir mapa para seleccionar ubicación
                      }
                    </button>
                    @if (addressForm.latitude && addressForm.longitude) {
                      <p class="text-caption text-mute mt-xxs">
                        Lat: {{ addressForm.latitude!.toFixed(6) }}, Lng:
                        {{ addressForm.longitude!.toFixed(6) }}
                      </p>
                    }
                    @if (coverageError()) {
                      <p class="form-error mt-sm">{{ coverageError() }}</p>
                    }
                  </div>
                  <div class="flex gap-md">
                    <button
                      type="submit"
                      class="bg-primary text-white font-semibold px-xl py-3 rounded-full hover:opacity-90 transition"
                      [disabled]="savingAddress()"
                    >
                      {{ savingAddress() ? 'Guardando...' : 'Guardar dirección' }}
                    </button>
                    @if (addresses().length > 0) {
                      <button
                        type="button"
                        class="border border-surface-pressed text-ink font-semibold px-xl py-3 rounded-full hover:bg-canvas-soft transition"
                        (click)="showAddressForm.set(false); attemptedAddressSave.set(false)"
                      >
                        Cancelar
                      </button>
                    }
                  </div>
                </form>
              }
            </div>

            <!-- Método de pago -->
            <div
              class="bg-canvas rounded-xl border border-surface-pressed p-xl"
              data-testid="payment-section"
            >
              <h2 class="text-body-lg-strong mb-lg flex items-center gap-md">
                <span
                  class="w-7 h-7 rounded-full bg-primary text-white grid place-items-center text-caption font-bold"
                  >2</span
                >
                Método de pago
              </h2>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-md mb-xl">
                <label
                  class="payment-option relative flex flex-col items-center gap-md px-lg py-6 cursor-pointer transition text-center"
                  [class.payment-option-active]="paymentMethod() === 'pago_movil'"
                >
                  <input
                    type="radio"
                    name="payment"
                    value="pago_movil"
                    [checked]="paymentMethod() === 'pago_movil'"
                    (change)="paymentMethod.set('pago_movil')"
                    class="sr-only"
                  />
                  @if (paymentMethod() === 'pago_movil') {
                    <span
                      class="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-white grid place-items-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="3"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="w-3.5 h-3.5"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  }
                  <img
                    src="/metodos_pagos/telefono-inteligente.png"
                    alt="Pago Móvil"
                    class="w-16 h-16 object-contain"
                  />
                  <div>
                    <p class="text-body-sm-strong">Pago Móvil</p>
                    <p class="text-caption text-body">Bancos locales</p>
                  </div>
                </label>

                <label
                  class="payment-option relative flex flex-col items-center gap-md px-lg py-6 cursor-pointer transition text-center"
                  [class.payment-option-active]="paymentMethod() === 'zelle'"
                >
                  <input
                    type="radio"
                    name="payment"
                    value="zelle"
                    [checked]="paymentMethod() === 'zelle'"
                    (change)="paymentMethod.set('zelle')"
                    class="sr-only"
                  />
                  @if (paymentMethod() === 'zelle') {
                    <span
                      class="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-white grid place-items-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="3"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="w-3.5 h-3.5"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  }
                  <img
                    src="/metodos_pagos/Zelle_logo.svg.png"
                    alt="Zelle"
                    class="w-[120px] h-auto object-contain"
                  />
                  <div>
                    <p class="text-body-sm-strong">Zelle</p>
                    <p class="text-caption text-body">USD instantáneo</p>
                  </div>
                </label>

                <label
                  class="payment-option relative flex flex-col items-center gap-md px-lg py-6 cursor-pointer transition text-center"
                  [class.payment-option-active]="paymentMethod() === 'cash'"
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cash"
                    [checked]="paymentMethod() === 'cash'"
                    (change)="paymentMethod.set('cash')"
                    class="sr-only"
                  />
                  @if (paymentMethod() === 'cash') {
                    <span
                      class="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-white grid place-items-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="3"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="w-3.5 h-3.5"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  }
                  <img
                    src="/metodos_pagos/dolar.png"
                    alt="Efectivo"
                    class="w-16 h-16 object-contain"
                  />
                  <div>
                    <p class="text-body-sm-strong">Efectivo</p>
                    <p class="text-caption text-body">Contra entrega</p>
                  </div>
                </label>
              </div>

              <!-- Pago Móvil info -->
              @if (paymentMethod() === 'pago_movil' && settings().paymentInfo?.pago_movil) {
                <div class="border border-surface-pressed rounded-xl p-xl mb-lg">
                  <div
                    class="flex items-center justify-between mb-lg pb-md border-b border-surface-pressed"
                  >
                    <p class="text-body-lg-strong font-bold">Datos para Pago Móvil</p>
                    <button
                      type="button"
                      (click)="copyPagoMovil()"
                      class="flex items-center gap-sm text-body-sm font-medium px-lg py-sm rounded-full border border-primary text-primary hover:bg-primary hover:text-white transition"
                    >
                      @if (copied() === 'pago_movil') {
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
                  <div class="grid grid-cols-2 gap-lg text-body-sm">
                    <div>
                      <p class="text-mute text-caption mb-xxs">Banco</p>
                      <p class="font-semibold">{{ settings().paymentInfo!.pago_movil!.bank }}</p>
                    </div>
                    <div>
                      <p class="text-mute text-caption mb-xxs">Cédula / RIF</p>
                      <p class="font-semibold">
                        {{ settings().paymentInfo!.pago_movil!.idDocument }}
                      </p>
                    </div>
                    <div>
                      <p class="text-mute text-caption mb-xxs">Teléfono</p>
                      <p class="font-semibold">{{ settings().paymentInfo!.pago_movil!.phone }}</p>
                    </div>
                    <div>
                      <p class="text-mute text-caption mb-xxs">Titular</p>
                      <p class="font-semibold">
                        {{ settings().paymentInfo!.pago_movil!.holderName }}
                      </p>
                    </div>
                  </div>
                </div>
              }

              <!-- Zelle info -->
              @if (paymentMethod() === 'zelle' && settings().paymentInfo?.zelle) {
                <div class="border border-surface-pressed rounded-xl p-xl mb-lg">
                  <div
                    class="flex items-center justify-between mb-lg pb-md border-b border-surface-pressed"
                  >
                    <p class="text-body-lg-strong font-bold">Datos para Zelle</p>
                    <button
                      type="button"
                      (click)="copyZelle()"
                      class="flex items-center gap-sm text-body-sm font-medium px-lg py-sm rounded-full border border-primary text-primary hover:bg-primary hover:text-white transition"
                    >
                      @if (copied() === 'zelle') {
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
                  <div class="grid grid-cols-2 gap-lg text-body-sm">
                    <div>
                      <p class="text-mute text-caption mb-xxs">Email</p>
                      <p class="font-semibold">{{ settings().paymentInfo!.zelle!.email }}</p>
                    </div>
                    <div>
                      <p class="text-mute text-caption mb-xxs">Nombre del titular</p>
                      <p class="font-semibold">{{ settings().paymentInfo!.zelle!.holderName }}</p>
                    </div>
                  </div>
                </div>
              }

              <!-- Referencia de pago -->
              @if (paymentMethod() !== 'cash') {
                <div class="mb-lg">
                  <label for="paymentRef" class="block text-body-sm-strong mb-sm"
                    >Referencia del pago <span class="text-red-500">*</span></label
                  >
                  <input
                    id="paymentRef"
                    type="text"
                    placeholder="Ej: 1234567890"
                    class="w-full bg-canvas border border-surface-pressed rounded-lg px-lg py-3 text-body-md outline-none focus:ring-2 focus:ring-primary"
                    [(ngModel)]="paymentReference"
                    name="paymentRef"
                    required
                  />
                  <p class="text-caption text-mute mt-xxs">
                    Número de referencia o comprobante de la transferencia
                  </p>
                </div>

                <!-- Comprobante de pago -->
                <div class="bg-canvas rounded-xl p-lg border border-surface-pressed">
                  <p class="text-body-sm-strong mb-sm">Comprobante de pago</p>
                  <p class="text-body-sm text-body mb-lg">
                    Subí una captura o foto del comprobante para verificación manual
                  </p>

                  @if (!receiptPreview()) {
                    <label
                      class="border-2 border-dashed border-surface-pressed rounded-xl py-xl flex items-center justify-center cursor-pointer hover:border-primary hover:bg-canvas transition"
                      data-testid="receipt-upload"
                    >
                      <input
                        type="file"
                        accept="image/*"
                        class="hidden"
                        (change)="onReceiptSelected($event)"
                      />
                      <div class="text-center">
                        <p class="text-body-sm-strong">Tocá para seleccionar imagen</p>
                        <p class="text-caption text-mute mt-xxs">JPG, PNG — Máx. 5MB</p>
                      </div>
                    </label>
                  } @else {
                    <div class="relative inline-block">
                      <img
                        [src]="receiptPreview()"
                        alt="Comprobante"
                        class="max-w-[200px] max-h-[200px] rounded-lg object-cover border-2 border-surface-pressed"
                      />
                      <button
                        type="button"
                        class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-white border-2 border-canvas grid place-items-center text-xs"
                        (click)="removeReceipt()"
                      >
                        ✕
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- RIGHT COLUMN: Order Summary -->
          <div class="lg:col-span-1">
            <div
              class="bg-canvas rounded-xl border border-surface-pressed p-xl sticky top-lg"
              data-testid="order-summary"
            >
              <h2 class="text-display-sm font-bold mb-xl pb-lg border-b border-surface-pressed">
                Resumen del Pedido
              </h2>

              <div class="space-y-md mb-xl max-h-64 overflow-y-auto">
                @for (item of cart.items(); track item.id) {
                  <div class="flex items-center gap-3" data-testid="checkout-item">
                    <div
                      class="w-12 h-12 rounded-lg bg-canvas-softer grid place-items-center shrink-0 overflow-hidden"
                    >
                      @if (item.product.images && item.product.images.length > 0) {
                        <img
                          [src]="item.product.images[0]"
                          [alt]="item.product.name"
                          class="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      } @else {
                        <span class="text-caption text-mute">{{
                          item.product.name.charAt(0)
                        }}</span>
                      }
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-body-sm truncate">{{ item.product.name }}</p>
                      <p class="text-caption text-mute">Cant: {{ item.quantity }}</p>
                    </div>
                    <p
                      class="text-body-sm-strong whitespace-nowrap"
                      data-testid="checkout-item-price"
                    >
                      {{
                        '$' +
                          (item.quantity * (item.flashSalePrice ?? item.product.price)
                            | number: '1.2-2')
                      }}
                    </p>
                  </div>
                }
              </div>

              <div class="space-y-lg pb-xl border-b border-surface-pressed">
                <div class="flex items-center justify-between text-body-md">
                  <span class="text-body">Subtotal</span>
                  <span class="font-medium">{{ '$' + (cart.total() | number: '1.2-2') }}</span>
                </div>
                <div class="flex items-center justify-between text-body-md">
                  <span class="text-body">Envío</span>
                  <span class="font-medium text-primary">Gratis</span>
                </div>
                <div class="flex items-center justify-between text-body-md">
                  <span class="text-body">Impuestos</span>
                  <span class="font-medium">$0.00</span>
                </div>
              </div>

              <div class="flex items-center justify-between pt-xl">
                <span class="text-body-lg-strong font-bold">Total</span>
                <span class="text-body-lg-strong font-bold" data-testid="checkout-total">
                  {{ '$' + (cart.total() | number: '1.2-2') }}
                </span>
              </div>

              <button
                type="button"
                class="w-full bg-primary text-white font-semibold py-3 rounded-full mt-xl hover:opacity-90 transition text-body-md"
                [disabled]="placing() || cart.validatingStock()"
                (click)="onPlaceOrder()"
                data-testid="place-order"
              >
                {{
                  cart.validatingStock()
                    ? 'Verificando stock...'
                    : placing()
                      ? 'Procesando...'
                      : 'Confirmar Pedido'
                }}
              </button>

              @if (attemptedPlaceOrder()) {
                <div class="mt-md space-y-sm">
                  @if (selectedAddressId().length === 0) {
                    <p class="text-body-sm text-red-600 flex items-center gap-sm">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        class="w-4 h-4 shrink-0"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      Seleccioná una dirección de envío
                    </p>
                  }
                  @if (paymentMethod() !== 'cash' && paymentReference.trim().length === 0) {
                    <p class="text-body-sm text-red-600 flex items-center gap-sm">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        class="w-4 h-4 shrink-0"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      Ingresá la referencia del pago
                    </p>
                  }
                  @if (cart.items().length === 0) {
                    <p class="text-body-sm text-red-600 flex items-center gap-sm">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        class="w-4 h-4 shrink-0"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      El carrito está vacío
                    </p>
                  }
                </div>
              }

              @if (cart.stockMessage()) {
                <p
                  class="text-body-sm text-red-600 mt-md text-center"
                  data-testid="checkout-stock-error"
                >
                  {{ cart.stockMessage() }}
                </p>
              }

              @if (error()) {
                <p class="text-body-sm text-red-600 mt-md text-center">{{ error() }}</p>
              }

              <p class="text-caption text-mute text-center mt-lg">
                Al confirmar, aceptás los términos y condiciones de compra
              </p>
            </div>
          </div>
        </div>

        <!-- Features -->
        <div
          class="grid grid-cols-1 md:grid-cols-3 gap-xl mt-3xl pt-3xl border-t border-surface-pressed"
          data-testid="checkout-features"
        >
          <div class="flex items-center gap-lg">
            <div class="w-14 h-14 rounded-full bg-accent/10 grid place-items-center shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-accent)"
                stroke-width="2"
                class="w-7 h-7"
              >
                <rect x="1" y="3" width="15" height="13" rx="2" />
                <path
                  d="M16 8h4l3 3v5a2 2 0 0 1-2 2h-1M6 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"
                />
              </svg>
            </div>
            <div>
              <p class="text-body-md-strong font-bold">Envío Gratis</p>
              <p class="text-body-sm text-body">Envío gratis en pedidos mayores a $50</p>
            </div>
          </div>
          <div class="flex items-center gap-lg">
            <div class="w-14 h-14 rounded-full bg-primary/10 grid place-items-center shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-primary)"
                stroke-width="2"
                class="w-7 h-7"
              >
                <rect x="1" y="4" width="22" height="16" rx="2" />
                <path d="M1 10h22" />
              </svg>
            </div>
            <div>
              <p class="text-body-md-strong font-bold">Pago Flexible</p>
              <p class="text-body-sm text-body">Múltiples opciones de pago seguro</p>
            </div>
          </div>
          <div class="flex items-center gap-lg">
            <div class="w-14 h-14 rounded-full bg-accent/10 grid place-items-center shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-accent)"
                stroke-width="2"
                class="w-7 h-7"
              >
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                <path
                  d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"
                />
              </svg>
            </div>
            <div>
              <p class="text-body-md-strong font-bold">Soporte 24×7</p>
              <p class="text-body-sm text-body">Atención en línea todos los días.</p>
            </div>
          </div>
        </div>
      }

      <app-map-picker
        #mapPicker
        [branch]="branchService.selectedBranch()"
        [zones]="zones()"
        (locationSelected)="onLocationPicked($event)"
      />
    </section>
  `,
  styles: `
    .payment-option {
      border: 2px solid transparent;
      border-radius: var(--radius-xl);
    }

    .payment-option-active {
      background-color: transparent;
    }
  `,
})
export class Checkout implements OnInit {
  private readonly router = inject(Router);
  private readonly addressService = inject(AddressService);
  private readonly orderService = inject(OrderService);
  private readonly uploadService = inject(UploadService);
  private readonly settingsService = inject(SiteSettingsService);
  protected readonly branchService = inject(BranchService);

  readonly auth = inject(AuthService);
  readonly authModal = inject(AuthModalService);
  readonly cart = inject(CartService);

  readonly addresses = signal<Address[]>([]);
  readonly zones = signal<DeliveryZone[]>([]);
  readonly selectedAddressId = signal('');
  readonly coverageError = signal('');

  readonly branchAddresses = computed(() => {
    const branchId = this.branchService.selectedBranch()?.id;
    if (!branchId) return this.addresses();
    return this.addresses().filter(
      (address) => !address.branchId || address.branchId === branchId,
    );
  });

  private readonly zoneEffect = effect(() => {
    const branch = this.branchService.selectedBranch();
    if (!branch) {
      this.zones.set([]);
      return;
    }
    this.branchService.getZones(branch.id).subscribe((zones) => {
      this.zones.set(zones);
    });
  });

  private readonly addressBranchEffect = effect(() => {
    const options = this.branchAddresses();
    const current = this.selectedAddressId();
    if (options.length === 0) return;
    if (!options.some((address) => address.id === current)) {
      const preferred =
        options.find((address) => address.isDefault) ?? options[0];
      this.selectedAddressId.set(preferred.id);
    }
  });
  readonly showAddressForm = signal(false);
  readonly savingAddress = signal(false);
  readonly paymentMethod = signal<PaymentMethod>('pago_movil');
  paymentReference = '';
  readonly receiptFile = signal<File | null>(null);
  readonly receiptPreview = signal<string | null>(null);
  readonly placing = signal(false);
  readonly copied = signal<'pago_movil' | 'zelle' | ''>('');
  readonly attemptedPlaceOrder = signal(false);
  readonly attemptedAddressSave = signal(false);

  readonly error = signal('');

  get settings() {
    return this.settingsService.settings;
  }

  readonly addressForm = {
    street: '',
    city: environment.defaultCity,
    state: environment.defaultState,
    zipCode: environment.defaultZipCode,
    country: environment.defaultCountry,
    label: '',
    reference: '',
    latitude: null as number | null,
    longitude: null as number | null,
  };

  canPlaceOrder(): boolean {
    const hasAddress = this.selectedAddressId().length > 0;
    const hasItems = this.cart.items().length > 0;
    const needsRef = this.paymentMethod() !== 'cash';
    const hasRef = this.paymentReference.trim().length > 0;
    return hasAddress && hasItems && (!needsRef || hasRef);
  }

  ngOnInit(): void {
    if (!this.auth.isAuthed()) return;
    this.settingsService.load();
    this.branchService.load();
    this.loadAddresses();
    this.cart.validateStock().subscribe();
  }

  private loadAddresses(): void {
    this.addressService.getMine().subscribe({
      next: (addrs) => {
        this.addresses.set(addrs);
        const defaultAddr = addrs.find((a) => a.isDefault);
        if (defaultAddr) this.selectedAddressId.set(defaultAddr.id);
        else if (addrs.length > 0) this.selectedAddressId.set(addrs[0].id);
      },
    });
  }

  saveAddress(): void {
    this.attemptedAddressSave.set(true);
    if (
      !this.addressForm.street.trim() ||
      !this.addressForm.city.trim() ||
      !this.addressForm.state.trim() ||
      !this.addressForm.zipCode.trim() ||
      !this.addressForm.country.trim()
    ) {
      return;
    }
    this.savingAddress.set(true);
    const payload: AddressPayload = {
      street: this.addressForm.street,
      city: this.addressForm.city,
      state: this.addressForm.state,
      zipCode: this.addressForm.zipCode,
      country: this.addressForm.country,
      label: this.addressForm.label || null,
      latitude: this.addressForm.latitude,
      longitude: this.addressForm.longitude,
    };
    this.addressService.create(payload).subscribe({
      next: (addr) => {
        this.addresses.update((list) => [...list, addr]);
        this.selectedAddressId.set(addr.id);
        this.coverageError.set('');
        if (addr.branchId) {
          const branch = this.branchService
            .branches()
            .find((item) => item.id === addr.branchId);
          if (branch) this.branchService.setSelected(branch);
        }
        this.showAddressForm.set(false);
        this.attemptedAddressSave.set(false);
        this.savingAddress.set(false);
        this.addressForm.street = '';
        this.addressForm.label = '';
        this.addressForm.reference = '';
        this.addressForm.latitude = null;
        this.addressForm.longitude = null;
      },
      error: (err) => {
        this.savingAddress.set(false);
        this.coverageError.set(
          err?.error?.message || 'No se pudo guardar la dirección',
        );
        this.error.set(
          err?.error?.message || 'No se pudo guardar la dirección',
        );
      },
    });
  }

  onLocationPicked(coords: { lat: number; lng: number }): void {
    this.addressForm.latitude = coords.lat;
    this.addressForm.longitude = coords.lng;
  }

  onReceiptSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.error.set('El comprobante debe ser una imagen (JPG, PNG, WEBP o GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.error.set('La imagen no puede superar 5MB');
      return;
    }

    this.error.set('');
    this.revokeReceiptPreview();
    this.receiptFile.set(file);
    this.receiptPreview.set(URL.createObjectURL(file));
  }

  private revokeReceiptPreview(): void {
    const preview = this.receiptPreview();
    if (preview) URL.revokeObjectURL(preview);
  }

  removeReceipt(): void {
    this.revokeReceiptPreview();
    this.receiptFile.set(null);
    this.receiptPreview.set(null);
  }

  copyPagoMovil(): void {
    const pm = this.settings().paymentInfo?.pago_movil;
    if (!pm) return;
    const text = `${pm.bank}\n${pm.idDocument}\n${pm.phone}`;
    navigator.clipboard.writeText(text).then(() => {
      this.copied.set('pago_movil');
      setTimeout(() => this.copied.set(''), 2000);
    });
  }

  copyZelle(): void {
    const z = this.settings().paymentInfo?.zelle;
    if (!z) return;
    navigator.clipboard.writeText(z.email).then(() => {
      this.copied.set('zelle');
      setTimeout(() => this.copied.set(''), 2000);
    });
  }

  onPlaceOrder(): void {
    this.attemptedPlaceOrder.set(true);
    if (!this.canPlaceOrder() || this.cart.validatingStock()) return;
    this.cart.validatingStock.set(true);
    this.cart.validateStock().subscribe({
      next: (issues) => {
        this.cart.validatingStock.set(false);
        if (issues.length > 0) return;
        this.placeOrder();
      },
      error: () => this.cart.validatingStock.set(false),
    });
  }

  addressFieldEmpty(field: string): boolean {
    return (
      this.attemptedAddressSave() &&
      !String((this.addressForm as Record<string, unknown>)[field] ?? '').trim()
    );
  }

  placeOrder(): void {
    this.placing.set(true);
    this.error.set('');

    const file = this.receiptFile();
    if (file) {
      this.uploadService.uploadImage('receipts', file).subscribe({
        next: (res) => this.createOrder(res.url),
        error: (err) => {
          this.error.set(err.error?.message || 'No se pudo subir el comprobante');
          this.placing.set(false);
        },
      });
      return;
    }

    this.createOrder();
  }

  private createOrder(receiptUrl?: string): void {
    this.orderService
      .create({
        shippingAddressId: this.selectedAddressId(),
        branchId: this.branchService.getSelectedId() ?? undefined,
        paymentMethod: this.paymentMethod(),
        paymentReference: this.paymentReference.trim() || undefined,
        receipt: receiptUrl,
      })
      .subscribe({
        next: (order) => {
          this.placing.set(false);
          if (order?.id) {
            this.cart.clear();
            this.router.navigate(['/order-completed', order.id]);
          } else {
            this.error.set('Error al procesar el pedido');
          }
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Error al procesar el pedido');
          this.placing.set(false);
        },
      });
  }
}
