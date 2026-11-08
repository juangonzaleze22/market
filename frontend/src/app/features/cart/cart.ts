import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-cart',
  imports: [CurrencyPipe, RouterLink, FormsModule],
  template: `
    <!-- Header -->
    <section class="bg-[#f8f8f8] py-2xl" data-testid="cart-header">
      <div class="container-max text-center">
        <h1 class="text-display-lg font-bold mb-sm">Carrito de Compras</h1>
        <div class="flex items-center justify-center gap-sm text-body-sm text-body">
          <a routerLink="/" class="hover:text-primary transition">Inicio</a>
          <span>/</span>
          <span class="text-ink font-medium">Carrito de Compras</span>
        </div>
      </div>
    </section>

    <section class="container-max py-3xl" data-testid="cart-section">
      @if (items().length === 0) {
        <div
          class="bg-canvas rounded-xl p-3xl text-center border border-surface-pressed"
          data-testid="cart-empty"
        >
          <p class="text-body-lg mb-lg">Tu carrito está vacío.</p>
          <a routerLink="/shop" class="btn-primary">Ir a la tienda</a>
        </div>
      } @else {
        <div class="grid lg:grid-cols-3 gap-2xl">
          <!-- Cart Items Table -->
          <div class="lg:col-span-2">
            <!-- Table Header -->
            <div
              class="grid grid-cols-12 gap-4 bg-accent text-white rounded-t-xl px-lg py-3 font-semibold text-body-sm"
              data-testid="cart-table-header"
            >
              <div class="col-span-5">Producto</div>
              <div class="col-span-2 text-center">Precio</div>
              <div class="col-span-3 text-center">Cantidad</div>
              <div class="col-span-2 text-center">Subtotal</div>
            </div>

            <!-- Table Body -->
            <div class="border border-surface-pressed border-t-0 rounded-b-xl">
              @for (item of items(); track item.id) {
                <div
                  class="grid grid-cols-12 gap-4 items-center px-lg py-4 border-b border-surface-pressed last:border-b-0"
                  data-testid="cart-item"
                >
                  <!-- Remove + Image + Name -->
                  <div class="col-span-5 flex items-center gap-3">
                    <button
                      type="button"
                      class="text-mute hover:text-ink transition text-lg leading-none"
                      (click)="cart.remove(item.id)"
                      data-testid="cart-remove"
                      aria-label="Eliminar producto"
                    >
                      ✕
                    </button>
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
                        <span class="text-body-sm-strong text-mute">{{
                          item.product.name.charAt(0)
                        }}</span>
                      }
                    </div>
                    <div class="min-w-0">
                      <p class="text-body-sm-strong truncate">{{ item.product.name }}</p>
                      <p class="text-caption text-mute">500 g</p>
                    </div>
                  </div>

                  <!-- Price -->
                  <div class="col-span-2 text-center text-body-md">
                    @if (item.flashSalePrice) {
                      <span class="text-primary font-semibold">{{
                        item.flashSalePrice | currency
                      }}</span>
                      <span class="text-mute text-body-xs line-through ml-xs">{{
                        item.product.price | currency
                      }}</span>
                    } @else {
                      {{ item.product.price | currency }}
                    }
                  </div>

                  <!-- Quantity Controls -->
                  <div class="col-span-3 flex flex-col items-center justify-center gap-xs">
                    <div
                      class="flex items-center rounded-lg border border-surface-pressed overflow-hidden"
                    >
                      <button
                        type="button"
                        class="w-9 h-9 flex items-center justify-center hover:bg-canvas-soft transition text-body-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        [disabled]="item.quantity <= 1"
                        (click)="cart.update(item.id, item.quantity - 1)"
                        data-testid="qty-dec"
                      >
                        −
                      </button>
                      <span
                        class="w-10 h-9 flex items-center justify-center text-body-sm-strong border-x border-surface-pressed"
                        data-testid="cart-item-qty"
                      >
                        {{ item.quantity }}
                      </span>
                      <button
                        type="button"
                        class="w-9 h-9 flex items-center justify-center hover:bg-canvas-soft transition text-body-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        [disabled]="
                          item.product.stock != null && item.quantity >= item.product.stock
                        "
                        (click)="cart.update(item.id, item.quantity + 1)"
                        data-testid="qty-inc"
                      >
                        +
                      </button>
                    </div>
                    @if (item.product.stock != null) {
                      <span
                        class="text-caption"
                        [class]="item.quantity > item.product.stock ? 'text-red-600' : 'text-mute'"
                        data-testid="cart-item-stock"
                      >
                        @if (item.quantity > item.product.stock) {
                          Solo quedan {{ item.product.stock }}
                        } @else if (item.quantity === item.product.stock) {
                          Máximo disponible: {{ item.product.stock }}
                        } @else {
                          Disponibles: {{ item.product.stock - item.quantity }} de
                          {{ item.product.stock }}
                        }
                      </span>
                    }
                  </div>

                  <!-- Subtotal -->
                  <div class="col-span-2 text-center text-body-md-strong font-medium">
                    {{ (item.flashSalePrice ?? item.product.price) * item.quantity | currency }}
                  </div>
                </div>
              }
            </div>

            <!-- Coupon + Clear Cart -->
            <div class="flex flex-wrap items-center gap-lg mt-xl">
              <div class="flex items-center gap-sm">
                <input
                  type="text"
                  placeholder="Código de cupón"
                  class="input-field px-lg py-md rounded-lg min-w-48"
                  [(ngModel)]="couponCode"
                  data-testid="coupon-input"
                />
                <button
                  type="button"
                  class="bg-primary text-white font-semibold px-lg py-md rounded-full hover:opacity-90 transition text-body-sm"
                  (click)="applyCoupon()"
                  data-testid="apply-coupon"
                >
                  Aplicar Cupón
                </button>
              </div>
              <button
                type="button"
                class="text-body-sm text-primary underline hover:opacity-80 transition ml-auto"
                (click)="cart.clear()"
                data-testid="clear-cart"
              >
                Vaciar Carrito
              </button>
            </div>
          </div>

          <!-- Order Summary -->
          <div class="lg:col-span-1">
            <div
              class="bg-canvas rounded-xl border border-surface-pressed p-xl sticky top-lg"
              data-testid="order-summary"
            >
              <h2 class="text-display-sm font-bold mb-xl pb-lg border-b border-surface-pressed">
                Resumen del Pedido
              </h2>

              <div class="space-y-lg">
                <div class="flex items-center justify-between text-body-md">
                  <span class="text-body">Artículos</span>
                  <span class="font-medium">{{ cart.count() }}</span>
                </div>
                <div class="flex items-center justify-between text-body-md">
                  <span class="text-body">Subtotal</span>
                  <span class="font-medium">{{ cart.total() | currency }}</span>
                </div>
                <div class="flex items-center justify-between text-body-md">
                  <span class="text-body">Envío</span>
                  <span class="font-medium">$0.00</span>
                </div>
                <div class="flex items-center justify-between text-body-md">
                  <span class="text-body">Impuestos</span>
                  <span class="font-medium">$0.00</span>
                </div>
                @if (discount() > 0) {
                  <div class="flex items-center justify-between text-body-md text-primary">
                    <span>Descuento por cupón</span>
                    <span class="font-medium">-{{ discount() | currency }}</span>
                  </div>
                }
              </div>

              <div
                class="border-t border-surface-pressed mt-xl pt-xl flex items-center justify-between"
              >
                <span class="text-body-lg-strong font-bold">Total</span>
                <span class="text-body-lg-strong font-bold">{{ finalTotal() | currency }}</span>
              </div>

              @if (cart.stockMessage()) {
                <p class="text-caption text-red-600 mt-md" data-testid="cart-stock-error">
                  {{ cart.stockMessage() }}
                </p>
              }

              <button
                type="button"
                class="w-full bg-primary text-white font-semibold py-3 rounded-full mt-xl hover:opacity-90 transition text-body-md disabled:opacity-60 disabled:cursor-not-allowed"
                [disabled]="cart.validatingStock()"
                (click)="checkout()"
                data-testid="checkout-button"
              >
                {{ cart.validatingStock() ? 'Verificando stock...' : 'Proceder al Pago' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Features -->
        <div
          class="grid grid-cols-1 md:grid-cols-3 gap-xl mt-3xl pt-3xl border-t border-surface-pressed"
          data-testid="cart-features"
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
    </section>
  `,
})
export class Cart {
  protected readonly cart = inject(CartService);
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly items = computed(() => this.cart.items());
  protected readonly couponCode = signal('');
  protected readonly discount = signal(0);

  protected readonly finalTotal = computed(() => {
    const total = this.cart.total();
    return Math.max(0, total - this.discount());
  });

  protected applyCoupon(): void {
    const code = this.couponCode().trim().toUpperCase();
    if (code === 'DESCUENTO10') {
      this.discount.set(10);
    } else if (code === 'DESCUENTO20') {
      this.discount.set(20);
    } else {
      this.discount.set(0);
    }
  }

  protected checkout(): void {
    if (this.cart.validatingStock()) return;
    this.cart.validatingStock.set(true);
    this.cart.validateStock().subscribe({
      next: (issues) => {
        this.cart.validatingStock.set(false);
        if (issues.length > 0) return;
        if (this.auth.isAuthed()) {
          this.router.navigate(['/checkout']);
        } else {
          this.router.navigate(['/login'], { queryParams: { redirect: '/checkout' } });
        }
      },
      error: () => this.cart.validatingStock.set(false),
    });
  }
}
