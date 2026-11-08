import { Component, computed, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { AuthModalService } from '../../core/services/auth-modal.service';

@Component({
  selector: 'app-cart-drawer',
  imports: [CurrencyPipe],
  styles: [
    `
      .drawer-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        z-index: 100;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
      }
      .drawer-backdrop.open {
        opacity: 1;
        pointer-events: auto;
      }
      .drawer-panel {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        max-width: 420px;
        background: var(--color-canvas);
        z-index: 101;
        transform: translateX(100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
      }
      .drawer-panel.open {
        transform: translateX(0);
      }
      .drawer-items {
        flex: 1;
        overflow-y: auto;
        overscroll-behavior: contain;
      }
    `,
  ],
  template: `
    <!-- Backdrop -->
    <div
      class="drawer-backdrop"
      [class.open]="cart.drawerOpen()"
      (click)="cart.closeDrawer()"
    ></div>

    <!-- Panel -->
    <div class="drawer-panel" [class.open]="cart.drawerOpen()" data-testid="cart-drawer">
      <!-- Header -->
      <div class="flex items-center justify-between px-xl py-lg border-b border-surface-pressed">
        <h2 class="text-body-lg-strong font-bold">Tu Carrito ({{ cart.count() }})</h2>
        <button
          type="button"
          class="w-9 h-9 rounded-full flex items-center justify-center hover:bg-canvas-soft transition text-ink"
          (click)="cart.closeDrawer()"
          aria-label="Cerrar carrito"
          data-testid="cart-drawer-close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="w-5 h-5"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      <!-- Items -->
      <div class="drawer-items">
        @if (cart.items().length === 0) {
          <div class="flex flex-col items-center justify-center h-full px-xl text-center">
            <div class="w-20 h-20 rounded-full bg-canvas-softer grid place-items-center mb-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-mute)"
                stroke-width="1.5"
                class="w-10 h-10"
              >
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path
                  d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"
                />
              </svg>
            </div>
            <p class="text-body-md text-mute mb-lg">Tu carrito está vacío</p>
            <button
              type="button"
              class="bg-primary text-white font-semibold px-xl py-md rounded-full hover:opacity-90 transition text-body-sm"
              (click)="goToShop()"
            >
              Explorar productos
            </button>
          </div>
        } @else {
          @for (item of cart.items(); track item.id) {
            <div
              class="flex gap-lg px-xl py-lg border-b border-surface-pressed"
              data-testid="cart-drawer-item"
            >
              <!-- Image -->
              <div
                class="w-16 h-16 rounded-lg bg-canvas-softer grid place-items-center shrink-0 overflow-hidden"
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
                  <span class="text-caption text-mute">{{ item.product.name.charAt(0) }}</span>
                }
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <p class="text-body-sm-strong truncate">{{ item.product.name }}</p>
                <p class="text-body-sm text-primary font-medium mt-xxs">
                  @if (item.flashSalePrice) {
                    {{ item.flashSalePrice | currency }}
                    <span class="text-mute text-body-xs line-through ml-xs">{{
                      item.product.price | currency
                    }}</span>
                  } @else {
                    {{ item.product.price | currency }}
                  }
                </p>

                <!-- Quantity controls -->
                <div class="flex items-center gap-md mt-sm">
                  <div
                    class="flex items-center rounded-lg border border-surface-pressed overflow-hidden"
                  >
                    <button
                      type="button"
                      class="w-8 h-8 flex items-center justify-center hover:bg-canvas-soft transition text-body-sm"
                      [disabled]="item.quantity <= 1"
                      (click)="cart.update(item.id, item.quantity - 1)"
                      data-testid="drawer-qty-dec"
                    >
                      −
                    </button>
                    <span
                      class="w-8 h-8 flex items-center justify-center text-body-sm-strong border-x border-surface-pressed"
                      data-testid="drawer-qty"
                    >
                      {{ item.quantity }}
                    </span>
                    <button
                      type="button"
                      class="w-8 h-8 flex items-center justify-center hover:bg-canvas-soft transition text-body-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      [disabled]="item.product.stock != null && item.quantity >= item.product.stock"
                      (click)="cart.update(item.id, item.quantity + 1)"
                      data-testid="drawer-qty-inc"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    class="text-caption text-mute hover:text-ink transition ml-auto"
                    (click)="cart.remove(item.id)"
                    data-testid="drawer-remove"
                  >
                    Eliminar
                  </button>
                </div>
                @if (item.product.stock != null) {
                  <p
                    class="text-caption mt-xs"
                    [class]="item.quantity > item.product.stock ? 'text-red-600' : 'text-mute'"
                    data-testid="drawer-item-stock"
                  >
                    @if (item.quantity > item.product.stock) {
                      Solo quedan {{ item.product.stock }}
                    } @else if (item.quantity === item.product.stock) {
                      Máximo disponible: {{ item.product.stock }}
                    } @else {
                      Disponibles: {{ item.product.stock - item.quantity }} de
                      {{ item.product.stock }}
                    }
                  </p>
                }
              </div>
            </div>
          }
        }
      </div>

      <!-- Footer -->
      @if (cart.items().length > 0) {
        <div class="border-t border-surface-pressed px-xl py-lg space-y-lg">
          <div class="flex items-center justify-between">
            <span class="text-body-md text-body">Subtotal</span>
            <span class="text-body-md-strong font-bold">{{ cart.total() | currency }}</span>
          </div>
          <div class="flex items-center justify-between text-caption text-mute">
            <span>Envío e impuestos se calculan al finalizar</span>
          </div>
          @if (cart.stockMessage()) {
            <p class="text-caption text-red-600" data-testid="drawer-stock-error">
              {{ cart.stockMessage() }}
            </p>
          }
          <button
            type="button"
            class="w-full bg-primary text-white font-semibold py-3 rounded-full hover:opacity-90 transition text-body-md disabled:opacity-60 disabled:cursor-not-allowed"
            [disabled]="cart.validatingStock()"
            (click)="goToCheckout()"
            data-testid="drawer-checkout"
          >
            {{ cart.validatingStock() ? 'Verificando stock...' : 'Ir a Pagar' }}
          </button>
          <button
            type="button"
            class="w-full text-center text-body-sm text-primary font-medium hover:underline transition"
            (click)="cart.closeDrawer(); goToShop()"
          >
            Seguir comprando
          </button>
        </div>
      }
    </div>
  `,
})
export class CartDrawer {
  readonly cart = inject(CartService);
  private readonly auth = inject(AuthService);
  private readonly authModal = inject(AuthModalService);
  private readonly router = inject(Router);

  goToShop(): void {
    this.router.navigate(['/shop']);
  }

  goToCheckout(): void {
    if (this.cart.validatingStock() || this.cart.items().length === 0) return;
    this.cart.validatingStock.set(true);
    this.cart.validateStock().subscribe({
      next: (issues) => {
        this.cart.validatingStock.set(false);
        if (issues.length > 0) return;
        this.cart.closeDrawer();
        if (this.auth.isAuthed()) {
          this.router.navigate(['/checkout']);
        } else {
          this.authModal.openLogin('/checkout');
        }
      },
      error: () => this.cart.validatingStock.set(false),
    });
  }
}
