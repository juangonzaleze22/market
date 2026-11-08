import { Component, DestroyRef, inject, OnInit, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe, DatePipe } from '@angular/common';
import {
  OrderService,
  Order,
  OrderItem,
  OrderDeliveryInfo,
} from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { AuthModalService } from '../../core/services/auth-modal.service';
import { ChatService, OrderStatusEvent } from '../../core/services/chat.service';
import { OrderChat } from '../../shared/ui/order-chat';
import { DeliveryMapComponent } from '../../shared/ui/delivery-map';
import { OrderStatusBadge } from '../../shared/ui/order-status-badge';
import { OrderFlowSteps } from '../../shared/ui/order-flow-steps';

interface TimelineStep {
  label: string;
  completed: boolean;
  active: boolean;
  date: string | null;
  time: string | null;
}

@Component({
  selector: 'app-orders',
  imports: [
    RouterLink,
    DecimalPipe,
    DatePipe,
    OrderChat,
    DeliveryMapComponent,
    OrderStatusBadge,
    OrderFlowSteps,
  ],
  template: `
    <section class="py-3xl max-w-[52rem] mx-auto px-lg" data-testid="orders-page">
      <h1 class="text-display-md font-bold mb-3xl">Mis Pedidos</h1>

      @if (!auth.isAuthed()) {
        <div class="bg-canvas rounded-xl p-3xl text-center border border-surface-pressed">
          <p class="text-body-lg mb-xl">Iniciá sesión para ver tus pedidos</p>
          <button type="button" class="btn-primary" (click)="authModal.openLogin()">
            Iniciar sesión
          </button>
        </div>
      } @else if (loading()) {
        <p class="text-body text-center py-3xl">Cargando pedidos...</p>
      } @else if (orders().length === 0) {
        <div class="bg-canvas rounded-xl p-3xl text-center border border-surface-pressed">
          <p class="text-body-lg mb-xl">Aún no tenés pedidos</p>
          <a routerLink="/shop" class="btn-primary">Ir a la tienda</a>
        </div>
      } @else {
        <div class="space-y-lg">
          @for (order of orders(); track order.id) {
            <div
              class="bg-canvas rounded-xl border border-surface-pressed overflow-hidden"
              data-testid="order-card"
            >
              <!-- Order Header (always visible) -->
              <button
                type="button"
                class="w-full text-left px-2xl py-xl cursor-pointer hover:bg-canvas-softer transition-colors"
                (click)="toggleOrder(order)"
              >
                <div class="flex justify-between items-center">
                  <div class="flex items-center gap-lg">
                    <div
                      class="w-8 h-8 rounded-full bg-canvas-softer flex items-center justify-center flex-shrink-0"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        class="transition-transform duration-200"
                        [class.rotate-90]="expandedOrderId() === order.id"
                      >
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </div>
                    <div>
                      <p class="text-body-sm-strong">{{ order.orderNumber }}</p>
                      <p class="text-caption text-body">
                        {{ order.createdAt | date: 'dd/MM/yyyy' }}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-lg">
                    <app-order-status [status]="order.status" size="md" testId="order-status" />
                    <p class="text-body-sm-strong" data-testid="order-total">
                      {{ '$' + (order.totalAmount | number: '1.2-2') }}
                    </p>
                  </div>
                </div>
              </button>

              <!-- Expanded Content -->
              @if (expandedOrderId() === order.id) {
                <div class="border-t border-surface-pressed px-2xl py-2xl">
                  @if (order.status === 'rejected') {
                    <div class="order-rejected mb-2xl" data-testid="order-rejected-banner">
                      <svg
                        width="18"
                        height="18"
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
                        <p class="order-rejected-title">Pago rechazado</p>
                        <p class="order-rejected-reason" data-testid="order-rejected-reason">
                          {{ order.rejectionReason || 'Sin motivo especificado' }}
                        </p>
                      </div>
                    </div>
                  }

                  <!-- Timeline -->
                  <div class="mb-2xl">
                    <h3 class="text-body-sm-strong mb-xl">Estado del Pedido</h3>
                    <div class="hidden md:block">
                      <div class="timeline">
                        @for (
                          step of timelineSteps();
                          track step.label;
                          let i = $index;
                          let last = $last
                        ) {
                          <div class="timeline-step-wrapper">
                            <div
                              class="timeline-step"
                              [class.completed]="step.completed"
                              [class.active]="step.active"
                            >
                              <div class="step-icon">
                                @if (step.active) {
                                  <span class="step-dot"></span>
                                } @else if (step.completed) {
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="3"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                  >
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                } @else {
                                  <span class="step-dot"></span>
                                }
                              </div>
                              <div class="step-content">
                                <span class="step-label">{{ step.label }}</span>
                                @if (step.date) {
                                  <span class="step-date">{{ step.date }}</span>
                                  @if (step.time) {
                                    <span class="step-time-badge" data-testid="step-time">
                                      <svg
                                        width="10"
                                        height="10"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2.5"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                      >
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                      </svg>
                                      {{ step.time }}
                                    </span>
                                  }
                                } @else {
                                  <span class="step-date">Pendiente</span>
                                }
                              </div>
                            </div>
                            @if (!last) {
                              <div
                                class="timeline-connector"
                                [class.completed]="step.completed"
                              ></div>
                            }
                          </div>
                        }
                      </div>
                    </div>
                    <div class="md:hidden" data-testid="order-flow-steps-mobile">
                      <app-order-flow-steps
                        [status]="order.status"
                        [orderId]="order.id"
                        variant="mobile"
                      />
                    </div>
                  </div>

                  <!-- Products -->
                  <div>
                    <h3 class="text-body-sm-strong mb-lg">Productos</h3>
                    <div>
                      @for (item of orderItemsMap().get(order.id) ?? []; track item.id) {
                        <div
                          class="flex items-center gap-lg py-md border-b border-surface-pressed last:border-b-0"
                          data-testid="detail-item"
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
                            <p class="text-body-sm-strong truncate">{{ item.productName }}</p>
                            <p class="text-caption text-body">
                              {{ item.quantity }} × {{ '$' + (item.unitPrice | number: '1.2-2') }}
                            </p>
                          </div>
                          <p
                            class="text-body-sm-strong whitespace-nowrap"
                            data-testid="detail-item-subtotal"
                          >
                            {{ '$' + (item.subtotal | number: '1.2-2') }}
                          </p>
                        </div>
                      }
                    </div>

                    <div class="flex justify-between border-t border-ink pt-lg mt-lg">
                      <p class="text-body-sm-strong">Total</p>
                      <p class="text-body-sm-strong" data-testid="detail-total">
                        {{ '$' + (order.totalAmount | number: '1.2-2') }}
                      </p>
                    </div>
                  </div>

                  @if (deliveryInfoMap().get(order.id)?.assigned) {
                    <div class="mt-2xl" data-testid="order-tracking">
                      <div class="flex items-center justify-between mb-md">
                        <h3 class="text-body-sm-strong">Seguimiento de entrega</h3>
                        @if (deliveryInfoMap().get(order.id)?.delivery; as driver) {
                          <span class="text-caption text-body" data-testid="order-delivery-name">
                            {{ driver?.firstName }} {{ driver?.lastName }}
                          </span>
                        }
                      </div>
                      <app-delivery-map
                        [destLat]="deliveryInfoMap().get(order.id)?.destination?.latitude ?? null"
                        [destLng]="deliveryInfoMap().get(order.id)?.destination?.longitude ?? null"
                        [deliveryLat]="deliveryLat(order.id)"
                        [deliveryLng]="deliveryLng(order.id)"
                      />
                      @if (order.status === 'out_for_delivery') {
                        <p class="text-caption text-body mt-sm">Tu pedido está en camino.</p>
                      }
                    </div>
                  }

                  @if (chatEnabled(order.status)) {
                    <div class="mt-2xl">
                      <app-order-chat
                        [orderId]="order.id"
                        [orderStatus]="order.status"
                        mode="customer"
                      />
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>

        <!-- Features Footer -->
        <div class="mt-3xl border-t border-surface-pressed pt-3xl">
          <div class="grid grid-cols-3 gap-xl text-center">
            <div>
              <div
                class="w-12 h-12 mx-auto mb-md rounded-full bg-canvas-softer flex items-center justify-center"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-accent)"
                  stroke-width="2"
                >
                  <rect x="1" y="3" width="15" height="13"></rect>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
              </div>
              <p class="text-body-sm-strong mb-xxs">Envío Gratis</p>
              <p class="text-caption text-body">Envío gratis para pedidos superiores a $50</p>
            </div>
            <div>
              <div
                class="w-12 h-12 mx-auto mb-md rounded-full bg-canvas-softer flex items-center justify-center"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-primary)"
                  stroke-width="2"
                >
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
              </div>
              <p class="text-body-sm-strong mb-xxs">Pago Flexible</p>
              <p class="text-caption text-body">Múltiples opciones de pago seguras</p>
            </div>
            <div>
              <div
                class="w-12 h-12 mx-auto mb-md rounded-full bg-canvas-softer flex items-center justify-center"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-accent)"
                  stroke-width="2"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <p class="text-body-sm-strong mb-xxs">Soporte 24×7</p>
              <p class="text-caption text-body">Estamos en línea todos los días</p>
            </div>
          </div>
        </div>
      }
    </section>
  `,
  styles: `
    .rotate-90 {
      transform: rotate(90deg);
    }

    .order-rejected {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      padding: 14px 16px;
      border-radius: 12px;
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
    }

    .order-rejected-title {
      font-size: 14px;
      font-weight: 700;
      margin: 0 0 2px;
      color: #991b1b;
    }

    .order-rejected-reason {
      font-size: 13px;
      margin: 0;
      color: #7f1d1d;
    }

    .timeline {
      display: flex;
      align-items: flex-start;
    }

    .timeline-step-wrapper {
      display: flex;
      align-items: flex-start;
      flex: 1;
    }

    .timeline-step-wrapper:last-child {
      flex: 0 0 auto;
    }

    .timeline-connector {
      flex: 1;
      height: 3px;
      background-color: var(--color-surface-pressed);
      border-radius: 2px;
      margin: 14px -4px 0;
    }

    .timeline-connector.completed {
      background-color: var(--color-primary);
    }

    .timeline-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
      min-width: 0;
    }

    .step-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      min-width: 0;
    }

    .step-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: var(--color-canvas);
      border: 2px solid var(--color-surface-pressed);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-mute);
      flex-shrink: 0;
    }

    .timeline-step.completed .step-icon {
      background-color: var(--color-primary);
      border-color: var(--color-primary);
      color: white;
    }

    .timeline-step.active .step-icon {
      background-color: var(--color-canvas);
      border-color: var(--color-primary);
      color: var(--color-primary);
      position: relative;
    }

    .timeline-step.active .step-icon::before,
    .timeline-step.active .step-icon::after {
      content: '';
      position: absolute;
      inset: -3px;
      border-radius: 50%;
      border: 2px solid var(--color-primary);
      animation: ripple 2s ease-out infinite;
    }

    .timeline-step.active .step-icon::after {
      animation-delay: 0.6s;
    }

    @keyframes ripple {
      0% {
        opacity: 0.5;
        transform: scale(1);
      }
      100% {
        opacity: 0;
        transform: scale(1.4);
      }
    }

    .step-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--color-surface-pressed);
    }

    .timeline-step.active .step-dot {
      background-color: var(--color-primary);
    }

    .step-label {
      font-size: 11px;
      font-weight: 500;
      color: var(--color-body);
      text-align: center;
      margin-bottom: 2px;
    }

    .timeline-step.completed .step-label {
      color: var(--color-ink);
      font-weight: 600;
    }

    .step-date {
      font-size: 10px;
      color: var(--color-body);
      text-align: center;
    }

    .timeline-step.completed .step-date {
      color: var(--color-ink);
      font-weight: 500;
    }

    .step-time-badge {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      padding: 1px 6px;
      border-radius: 999px;
      background-color: var(--color-canvas-softer);
      border: 1px solid var(--color-surface-pressed);
      font-size: 10px;
      font-weight: 600;
      color: var(--color-body);
      white-space: nowrap;
      line-height: 1.4;
    }

    .timeline-step.completed .step-time-badge,
    .timeline-step.active .step-time-badge {
      background-color: var(--color-canvas-soft);
      border-color: var(--color-surface-pressed);
      color: var(--color-ink);
    }
  `,
})
export class Orders implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly chat = inject(ChatService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly joinedOrderIds = new Set<string>();

  readonly auth = inject(AuthService);
  readonly authModal = inject(AuthModalService);
  readonly orders = signal<Order[]>([]);
  readonly orderItemsMap = signal<Map<string, OrderItem[]>>(new Map());
  readonly deliveryInfoMap = signal<Map<string, OrderDeliveryInfo>>(new Map());
  readonly deliveryPositions = signal<Map<string, { lat: number; lng: number }>>(new Map());
  readonly expandedOrderId = signal<string | null>(null);
  readonly loading = signal(true);

  readonly expandedOrder = computed(() => {
    const id = this.expandedOrderId();
    return this.orders().find((o) => o.id === id) ?? null;
  });

  readonly timelineSteps = computed<TimelineStep[]>(() => {
    const order = this.expandedOrder();
    if (!order) return [];

    const status = order.status.toLowerCase();
    const created = this.splitDateTime(order.createdAt);
    const prep = this.getExpectedDateTime(1);
    const onWay = this.getExpectedDateTime(3);
    const delivered =
      status === 'delivered' ? this.splitDateTime(order.createdAt) : this.getExpectedDateTime(5);
    const accepted = ['processing', 'paid', 'shipped', 'out_for_delivery', 'delivered'].includes(
      status,
    );

    return [
      {
        label: 'Pedido Realizado',
        completed: true,
        active: false,
        date: created.date,
        time: created.time,
      },
      {
        label: 'Aceptado',
        completed: accepted,
        active: status === 'pending',
        date: accepted ? created.date : null,
        time: accepted ? created.time : null,
      },
      {
        label: 'En Preparación',
        completed: ['shipped', 'out_for_delivery', 'delivered'].includes(status),
        active: ['processing', 'paid'].includes(status),
        date: prep.date,
        time: prep.time,
      },
      {
        label: 'En Camino',
        completed: status === 'delivered',
        active: ['shipped', 'out_for_delivery'].includes(status),
        date: onWay.date,
        time: onWay.time,
      },
      {
        label: 'Entregado',
        completed: status === 'delivered',
        active: false,
        date: delivered.date,
        time: delivered.time,
      },
    ];
  });

  ngOnInit(): void {
    if (!this.auth.isAuthed()) {
      this.loading.set(false);
      return;
    }

    this.chat.orderStatus$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.applyOrderStatus(event));

    this.chat.deliveryLocation$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) =>
        this.setDeliveryPosition(event.orderId, event.latitude, event.longitude),
      );

    this.destroyRef.onDestroy(() => this.leaveAllOrders());

    this.orderService.getMine().subscribe({
      next: (orders) => {
        this.orders.set(orders);
        orders.forEach((order) => this.joinOrder(order.id));
        this.loading.set(false);
        this.expandFromQuery();
      },
      error: () => this.loading.set(false),
    });
  }

  private expandFromQuery(): void {
    const orderId = this.route.snapshot.queryParamMap.get('order');
    if (!orderId) return;
    const order = this.orders().find((o) => o.id === orderId);
    if (!order) return;
    this.expandedOrderId.set(orderId);
    this.loadItems(orderId);
    if (order.deliveryId) this.loadDelivery(orderId);
  }

  private loadItems(orderId: string): void {
    if (this.orderItemsMap().has(orderId)) return;
    this.orderService.getItems(orderId).subscribe({
      next: (items) => {
        this.orderItemsMap.update((map) => {
          const newMap = new Map(map);
          newMap.set(orderId, items);
          return newMap;
        });
      },
    });
  }

  private applyOrderStatus(event: OrderStatusEvent): void {
    this.orders.update((orders) =>
      orders.map((order) =>
        order.id === event.orderId
          ? {
              ...order,
              status: event.status,
              rejectionReason: event.rejectionReason ?? order.rejectionReason,
            }
          : order,
      ),
    );
  }

  private joinOrder(orderId: string): void {
    if (this.joinedOrderIds.has(orderId)) return;
    this.joinedOrderIds.add(orderId);
    this.chat.joinOrder(orderId);
  }

  private leaveAllOrders(): void {
    this.joinedOrderIds.forEach((orderId) => this.chat.leaveOrder(orderId));
    this.joinedOrderIds.clear();
  }

  toggleOrder(order: Order): void {
    if (this.expandedOrderId() === order.id) {
      this.expandedOrderId.set(null);
      return;
    }

    this.expandedOrderId.set(order.id);
    this.loadItems(order.id);
    if (order.deliveryId) {
      this.loadDelivery(order.id);
    }
  }

  private loadDelivery(orderId: string): void {
    if (this.deliveryInfoMap().has(orderId)) return;
    this.orderService.getDeliveryInfo(orderId).subscribe((info) => {
      this.deliveryInfoMap.update((map) => {
        const next = new Map(map);
        next.set(orderId, info);
        return next;
      });
      if (info.position) {
        this.setDeliveryPosition(orderId, info.position.latitude, info.position.longitude);
      }
    });
  }

  private setDeliveryPosition(orderId: string, lat: number, lng: number): void {
    this.deliveryPositions.update((map) => {
      const next = new Map(map);
      next.set(orderId, { lat, lng });
      return next;
    });
  }

  protected deliveryLat(orderId: string): number | null {
    return (
      this.deliveryPositions().get(orderId)?.lat ??
      this.deliveryInfoMap().get(orderId)?.position?.latitude ??
      null
    );
  }

  protected deliveryLng(orderId: string): number | null {
    return (
      this.deliveryPositions().get(orderId)?.lng ??
      this.deliveryInfoMap().get(orderId)?.position?.longitude ??
      null
    );
  }

  chatEnabled(status: string): boolean {
    return ['paid', 'shipped', 'out_for_delivery', 'delivered'].includes(status.toLowerCase());
  }

  private splitDateTime(dateString: string): { date: string; time: string } {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return { date: `${day}/${month}/${year}`, time: `${hours}:${minutes}` };
  }

  private getExpectedDateTime(daysToAdd: number): { date: string; time: string } {
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return { date: `${day}/${month}/${year}`, time: `${hours}:${minutes}` };
  }
}
