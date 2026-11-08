import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { OrderService, Order, OrderItem } from '../../core/services/order.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-order-completed',
  imports: [RouterLink, CurrencyPipe],
  template: `
    <section class="bg-canvas-soft py-2xl" data-testid="order-completed-header">
      <div class="container-max text-center">
        <h1 class="text-display-lg font-bold mb-sm">Pedido Completado</h1>
        <div class="flex items-center justify-center gap-sm text-body-sm text-body">
          <a routerLink="/" class="hover:text-primary transition">Inicio</a>
          <span>/</span>
          <span class="text-ink font-medium">Pedido Completado</span>
        </div>
      </div>
    </section>

    <section class="container-max py-3xl" data-testid="order-completed-page">
      @if (loading()) {
        <p class="text-body text-center py-3xl">Cargando detalles del pedido...</p>
      } @else if (error()) {
        <div
          class="bg-canvas rounded-xl p-3xl text-center max-w-[32rem] mx-auto border border-surface-pressed"
        >
          <p class="text-body-lg mb-xl">{{ error() }}</p>
          <a routerLink="/orders" class="btn-primary">Ver mis pedidos</a>
        </div>
      } @else if (order()) {
        <div class="max-w-[52rem] mx-auto">
          <div
            class="bg-canvas rounded-xl border border-surface-pressed overflow-hidden"
            data-testid="order-completed-card"
          >
            <div class="text-center py-3xl px-2xl">
              <div class="w-20 h-20 rounded-full bg-accent grid place-items-center mx-auto mb-xl">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  stroke-width="3"
                  class="w-10 h-10"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h2 class="text-display-sm font-bold mb-md" data-testid="completed-title">
                ¡Tu pedido ha sido completado!
              </h2>
              <p class="text-body-sm text-body">Gracias. Tu pedido ha sido recibido.</p>
            </div>

            <div
              class="bg-accent/10 border-y border-accent/20 px-2xl py-xl"
              data-testid="order-info-bar"
            >
              <div class="grid grid-cols-2 md:grid-cols-3 gap-lg items-center">
                <div>
                  <p class="text-caption text-body mb-xxs">ID del Pedido</p>
                  <p class="text-body-sm-strong font-bold" data-testid="order-id">
                    {{ order()!.orderNumber }}
                  </p>
                </div>
                <div>
                  <p class="text-caption text-body mb-xxs">Método de Pago</p>
                  <p class="text-body-sm-strong font-bold capitalize" data-testid="payment-method">
                    {{ order()!.paymentMethod || 'N/A' }}
                  </p>
                </div>
                <div>
                  <p class="text-caption text-body mb-xxs">ID de Transacción</p>
                  <p class="text-body-sm-strong font-bold" data-testid="transaction-id">
                    {{ order()!.id.substring(0, 8).toUpperCase() }}
                  </p>
                </div>
              </div>
            </div>

            <div class="p-2xl">
              <h3 class="text-body-lg-strong font-bold mb-xl pb-lg border-b border-surface-pressed">
                Detalles del Pedido
              </h3>

              <div class="mb-xl">
                <p class="text-body-sm-strong font-bold mb-lg">Productos</p>
                <div class="space-y-lg">
                  @for (item of items(); track item.id) {
                    <div
                      class="flex items-center gap-lg pb-lg border-b border-surface-pressed last:border-b-0"
                      data-testid="completed-item"
                    >
                      <div
                        class="w-14 h-14 rounded-xl bg-canvas-softer grid place-items-center shrink-0 overflow-hidden"
                      >
                        @if (item.productImage) {
                          <img
                            [src]="item.productImage"
                            [alt]="item.productName"
                            class="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        } @else {
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.5"
                            class="text-mute"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                          </svg>
                        }
                      </div>
                      <div class="flex-1">
                        <p class="text-body-sm-strong">{{ item.productName }}</p>
                        <p class="text-caption text-mute">
                          {{ item.quantity }} ×
                          {{ item.unitPrice | currency: environment.currencyCode : 'symbol' : '1.2-2' }}
                        </p>
                      </div>
                      <p class="text-body-sm-strong whitespace-nowrap" data-testid="item-subtotal">
                        {{ item.subtotal | currency: environment.currencyCode : 'symbol' : '1.2-2' }}
                      </p>
                    </div>
                  }
                </div>
              </div>

              <div class="space-y-lg pt-lg border-t border-surface-pressed">
                <div class="flex justify-between text-body-md">
                  <span class="text-body">Envío</span>
                  <span class="font-medium">Gratis</span>
                </div>
                <div class="flex justify-between text-body-md">
                  <span class="text-body">Impuestos</span>
                  <span class="font-medium">{{ '$0.00' }}</span>
                </div>
                <div
                  class="flex justify-between text-body-lg-strong font-bold pt-lg border-t border-surface-pressed"
                >
                  <span>Total</span>
                  <span data-testid="completed-total">
                    {{ order()!.totalAmount | currency: environment.currencyCode : 'symbol' : '1.2-2' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex gap-lg justify-center mt-2xl">
            <a
              routerLink="/orders"
              class="bg-primary text-white font-semibold px-xl py-md rounded-full hover:opacity-90 transition"
              data-testid="view-orders-btn"
            >
              Ver mis pedidos
            </a>
            <a
              routerLink="/"
              class="border border-surface-pressed text-ink font-semibold px-xl py-md rounded-full hover:bg-canvas-soft transition"
            >
              Volver al inicio
            </a>
          </div>

          <div
            class="grid grid-cols-1 md:grid-cols-3 gap-xl mt-3xl pt-3xl border-t border-surface-pressed"
            data-testid="completed-features"
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
                <p class="text-body-sm text-body">Envío gratis para pedidos superiores a $50</p>
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
                <p class="text-body-sm text-body">Múltiples opciones de pago seguras</p>
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
                <p class="text-body-sm text-body">Estamos en línea todos los días</p>
              </div>
            </div>
          </div>
        </div>
      }
    </section>
  `,
})
export class OrderCompleted implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);

  protected readonly environment = environment;

  readonly order = signal<Order | null>(null);
  readonly items = signal<OrderItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('ID de pedido no válido');
      this.loading.set(false);
      return;
    }

    this.orderService.getById(id).subscribe({
      next: (order) => {
        if (!order || !order.id) {
          this.error.set('Pedido no encontrado');
          this.loading.set(false);
          return;
        }
        this.order.set(order);
        this.orderService.getItems(id).subscribe({
          next: (items) => {
            this.items.set(items);
            this.loading.set(false);
          },
          error: () => {
            this.loading.set(false);
          },
        });
      },
      error: () => {
        this.error.set('Error al cargar el pedido');
        this.loading.set(false);
      },
    });
  }
}
