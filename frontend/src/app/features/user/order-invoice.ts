import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import { OrderService, OrderFull } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { AuthModalService } from '../../core/services/auth-modal.service';
import { OrderStatusBadge } from '../../shared/ui/order-status-badge';

@Component({
  selector: 'app-order-invoice',
  imports: [RouterLink, DecimalPipe, DatePipe, OrderStatusBadge],
  template: `
    <section class="py-3xl max-w-[48rem] mx-auto px-lg" data-testid="order-invoice">
      @if (!auth.isAuthed()) {
        <div class="bg-canvas rounded-xl p-3xl text-center border border-surface-pressed">
          <p class="text-body-lg mb-xl">Iniciá sesión para ver esta orden</p>
          <button type="button" class="btn-primary" (click)="authModal.openLogin()">
            Iniciar sesión
          </button>
        </div>
      } @else if (loading()) {
        <div class="space-y-xl">
          <div class="h-16 bg-canvas-softer rounded-xl animate-pulse"></div>
          <div class="h-96 bg-canvas-softer rounded-xl animate-pulse"></div>
        </div>
      } @else if (!order()) {
        <div class="bg-canvas rounded-xl p-3xl text-center border border-surface-pressed">
          <p class="text-body-lg mb-xl">Pedido no encontrado</p>
          <a routerLink="/account" class="btn-primary">Volver al perfil</a>
        </div>
      } @else {
        <!-- Header -->
        <div class="flex items-center justify-between mb-2xl">
          <a
            routerLink="/account"
            class="flex items-center gap-sm text-body-sm text-body hover:text-ink transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Volver
          </a>
          <span class="text-body-sm-strong text-mute">{{ order()?.orderNumber }}</span>
        </div>

        <!-- Invoice Card -->
        <div
          class="bg-canvas rounded-xl border border-surface-pressed overflow-hidden"
          data-testid="invoice-card"
        >
          <!-- Invoice Header -->
          <div class="px-2xl py-xl border-b border-surface-pressed">
            <div class="flex justify-between items-start">
              <div>
                <h1 class="text-display-sm font-bold mb-xs">Comprobante de Pago</h1>
                <p class="text-caption text-mute">
                  {{ order()?.createdAt | date: 'dd/MM/yyyy HH:mm' }}
                </p>
              </div>
              <app-order-status [status]="order()?.status || ''" size="md" />
            </div>
          </div>

          @if (order()?.status === 'rejected') {
            <div
              class="px-2xl py-xl border-b border-surface-pressed"
              data-testid="order-rejected-banner"
            >
              <div class="rejected-banner">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <div>
                  <p class="rejected-banner-title">Pago rechazado</p>
                  <p class="rejected-banner-reason" data-testid="rejected-reason">
                    {{ order()?.rejectionReason || 'Sin motivo especificado' }}
                  </p>
                </div>
              </div>
            </div>
          }

          <!-- Customer Info -->
          <div class="px-2xl py-xl border-b border-surface-pressed">
            <h2 class="text-body-sm-strong mb-lg">Información del Cliente</h2>
            <div class="grid grid-cols-2 gap-lg">
              <div>
                <p class="text-caption text-mute mb-xxs">Nombre</p>
                <p class="text-body-sm-strong">
                  {{ profile()?.firstName }} {{ profile()?.lastName }}
                </p>
              </div>
              <div>
                <p class="text-caption text-mute mb-xxs">Email</p>
                <p class="text-body-sm-strong">{{ profile()?.email }}</p>
              </div>
            </div>
          </div>

          <!-- Shipping Address -->
          @if (order()?.shippingAddress) {
            <div class="px-2xl py-xl border-b border-surface-pressed">
              <h2 class="text-body-sm-strong mb-lg">Dirección de Envío</h2>
              <div class="text-body-sm">
                <p class="text-ink">{{ order()?.shippingAddress?.street }}</p>
                <p class="text-body">
                  {{ order()?.shippingAddress?.city }}, {{ order()?.shippingAddress?.state }}
                  {{ order()?.shippingAddress?.zipCode }}
                </p>
                <p class="text-body">{{ order()?.shippingAddress?.country }}</p>
              </div>
            </div>
          }

          <!-- Products -->
          <div class="px-2xl py-xl border-b border-surface-pressed">
            <h2 class="text-body-sm-strong mb-lg">Productos</h2>
            <div>
              @for (item of order()?.items ?? []; track item.id) {
                <div
                  class="flex items-center gap-lg py-md"
                  [class.border-b]="true"
                  [style.border-bottom-color]="'var(--color-surface-pressed)'"
                  data-testid="invoice-item"
                >
                  <div
                    class="w-12 h-12 rounded-lg bg-canvas-softer flex items-center justify-center flex-shrink-0 overflow-hidden"
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
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-sm">
                      <p class="text-body-sm-strong truncate">{{ item.productName }}</p>
                      @if (item.hasFlashDiscount) {
                        <span
                          class="inline-flex items-center px-xs py-xxs rounded-pill text-body-xs font-medium bg-orange-50 text-orange-700 shrink-0"
                          >Flash</span
                        >
                      }
                    </div>
                    <p class="text-caption text-body">
                      {{ item.quantity }} × {{ '$' + (item.unitPrice | number: '1.2-2') }}
                      @if (item.originalPrice) {
                        <span class="text-mute line-through ml-sm">{{
                          '$' + (item.originalPrice | number: '1.2-2')
                        }}</span>
                      }
                    </p>
                  </div>
                  <p class="text-body-sm-strong whitespace-nowrap">
                    {{ '$' + (item.subtotal | number: '1.2-2') }}
                  </p>
                </div>
              }
            </div>
          </div>

          <!-- Totals -->
          <div class="px-2xl py-xl border-b border-surface-pressed">
            <div class="space-y-md">
              <div class="flex justify-between text-body-sm">
                <span class="text-body">Subtotal</span>
                <span class="text-ink">{{ '$' + (getSubtotal() | number: '1.2-2') }}</span>
              </div>
              <div class="flex justify-between text-body-sm">
                <span class="text-body">Envío</span>
                <span class="text-ink">Gratis</span>
              </div>
              <div
                class="flex justify-between text-body-sm-strong pt-md border-t border-surface-pressed"
              >
                <span class="text-ink">Total</span>
                <span class="text-primary text-body-lg font-bold" data-testid="invoice-total">
                  {{ '$' + (order()?.totalAmount || 0 | number: '1.2-2') }}
                </span>
              </div>
            </div>
          </div>

          <!-- Payment Info -->
          <div class="px-2xl py-xl">
            <h2 class="text-body-sm-strong mb-lg">Información de Pago</h2>
            <div class="space-y-md">
              @if (order()?.paymentMethod) {
                <div class="flex justify-between text-body-sm">
                  <span class="text-body">Método de Pago</span>
                  <span class="text-ink font-medium">{{ order()?.paymentMethod }}</span>
                </div>
              }
              <div class="flex justify-between text-body-sm">
                <span class="text-body">Estado</span>
                <app-order-status [status]="order()?.status || ''" />
              </div>
              @if (order()?.receiptUrl) {
                <div class="pt-md">
                  <a
                    [href]="order()?.receiptUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn-secondary inline-flex items-center gap-sm"
                    data-testid="receipt-link"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    Ver Comprobante
                  </a>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="mt-xl flex justify-center">
          <button
            type="button"
            class="btn-secondary"
            (click)="printInvoice()"
            data-testid="print-invoice"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="mr-sm"
            >
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Imprimir
          </button>
        </div>
      }
    </section>
  `,
  styles: `
    .text-primary {
      color: var(--color-primary);
    }
    .badge-lg {
      padding: 6px 12px;
      font-size: 13px;
    }
    .mr-sm {
      margin-right: 8px;
    }
    .rejected-banner {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      padding: 14px 16px;
      border-radius: 12px;
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
    }
    .rejected-banner-title {
      font-size: 14px;
      font-weight: 700;
      margin: 0 0 2px;
      color: #991b1b;
    }
    .rejected-banner-reason {
      font-size: 13px;
      margin: 0;
      color: #7f1d1d;
    }
  `,
})
export class OrderInvoice implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);
  readonly auth = inject(AuthService);
  readonly authModal = inject(AuthModalService);

  readonly order = signal<OrderFull | null>(null);
  readonly profile = signal<{ firstName: string; lastName: string; email: string } | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    if (!this.auth.isAuthed()) {
      this.loading.set(false);
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      return;
    }

    this.loadOrder(id);
    this.loadProfile();
  }

  private loadOrder(id: string): void {
    this.orderService.getFullById(id).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadProfile(): void {
    this.orderService.getProfile().subscribe({
      next: (profile) => this.profile.set(profile),
    });
  }

  getSubtotal(): number {
    const items = this.order()?.items ?? [];
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  }

  printInvoice(): void {
    window.print();
  }
}
