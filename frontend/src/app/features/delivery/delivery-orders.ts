import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { finalize } from 'rxjs';
import {
  DeliveryOrder,
  DeliveryOrderDetail,
  DeliveryScope,
  DeliveryService,
} from '../../core/services/delivery.service';
import { ChatService } from '../../core/services/chat.service';
import { ToastService } from '../../core/services/toast.service';
import { ModalComponent } from '../../shared/ui/modal';
import { DeliveryMapComponent } from '../../shared/ui/delivery-map';
import { MapPreviewComponent } from '../../shared/ui/map-preview';
import { OrderChat } from '../../shared/ui/order-chat';
import { OrderStatusBadge } from '../../shared/ui/order-status-badge';

@Component({
  selector: 'app-delivery-orders',
  imports: [
    FormsModule,
    CurrencyPipe,
    DatePipe,
    ModalComponent,
    DeliveryMapComponent,
    MapPreviewComponent,
    OrderChat,
    OrderStatusBadge,
  ],
  template: `
    <div data-testid="delivery-orders">
      <div class="flex flex-col gap-lg mb-2xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-body-2xl font-bold" data-testid="delivery-orders-title">Entregas</h1>
          <span class="text-body-sm text-body">{{ total() }} pedidos</span>
        </div>
      </div>

      <div class="flex flex-col gap-md mb-xl sm:flex-row sm:items-center sm:flex-wrap">
        <div class="flex rounded-pill bg-canvas border border-surface-pressed overflow-hidden">
          <button
            type="button"
            class="px-lg py-sm text-body-sm"
            [class.bg-primary]="scope() === 'available'"
            [class.text-white]="scope() === 'available'"
            (click)="setScope('available')"
            data-testid="delivery-scope-available"
          >
            Disponibles
          </button>
          <button
            type="button"
            class="px-lg py-sm text-body-sm"
            [class.bg-primary]="scope() === 'mine'"
            [class.text-white]="scope() === 'mine'"
            (click)="setScope('mine')"
            data-testid="delivery-scope-mine"
          >
            Mis entregas
          </button>
        </div>
        <input
          type="text"
          placeholder="Buscar por número de pedido..."
          class="filter-input"
          [(ngModel)]="searchTerm"
          (ngModelChange)="onSearch()"
          data-testid="delivery-order-search"
        />
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center py-4xl">
          <div
            class="w-8 h-8 border-2 border-surface-pressed border-t-primary rounded-full animate-spin"
          ></div>
        </div>
      } @else {
        <div class="flex flex-col gap-md" data-testid="delivery-list">
          @for (order of orders(); track order.id) {
            <div
              class="bg-canvas rounded-xl border border-surface-pressed overflow-hidden flex flex-col sm:flex-row"
              [attr.data-testid]="'delivery-order-' + order.id"
            >
              <div
                class="w-full sm:w-40 h-32 sm:h-auto shrink-0 border-b sm:border-b-0 sm:border-r border-surface-pressed"
              >
                <app-map-preview
                  [latitude]="order.shippingAddress?.latitude ?? null"
                  [longitude]="order.shippingAddress?.longitude ?? null"
                />
              </div>
              <div
                class="flex-1 p-lg flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between"
              >
                <div class="min-w-0">
                  <p class="text-body-sm font-medium">{{ order.orderNumber }}</p>
                  <p class="text-body-sm text-ink mt-xxs">
                    {{ order.shippingAddress?.street || 'Sin dirección' }}
                  </p>
                  @if (order.shippingAddress) {
                    <p class="text-body-xs text-body">
                      {{ order.shippingAddress.city }}, {{ order.shippingAddress.state }}
                    </p>
                  }
                  <div
                    class="flex flex-wrap items-center gap-x-lg gap-y-xxs mt-sm text-body-xs text-body"
                  >
                    <span>{{ order.totalItems ?? 0 }} productos</span>
                    <span class="capitalize">{{ order.paymentMethod || '—' }}</span>
                    <span class="font-medium text-ink">{{ order.totalAmount | currency }}</span>
                    <span>{{ order.createdAt | date: 'dd/MM/yyyy HH:mm' }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-sm shrink-0">
                  <app-order-status [status]="order.status" />
                  <button
                    type="button"
                    class="btn-secondary"
                    (click)="viewOrder(order.id)"
                    [attr.data-testid]="'delivery-view-' + order.id"
                  >
                    Ver
                  </button>
                  @if (scope() === 'available') {
                    <button
                      type="button"
                      class="btn-primary"
                      [disabled]="acceptingId() === order.id"
                      (click)="accept(order)"
                      [attr.data-testid]="'delivery-accept-' + order.id"
                    >
                      @if (acceptingId() === order.id) {
                        <span class="btn-spinner"></span>
                      } @else {
                        Aceptar
                      }
                    </button>
                  }
                </div>
              </div>
            </div>
          } @empty {
            <div
              class="px-xl py-2xl text-center text-body text-body-sm bg-canvas rounded-xl border border-surface-pressed"
            >
              No hay pedidos {{ scope() === 'available' ? 'disponibles' : 'asignados' }}
            </div>
          }
        </div>

        @if (totalPages() > 1) {
          <div class="flex items-center justify-center gap-md mt-xl">
            <button
              type="button"
              class="btn-secondary"
              (click)="goToPage(page() - 1)"
              [disabled]="page() <= 1"
            >
              Anterior
            </button>
            <span class="text-body-sm text-body">{{ page() }} / {{ totalPages() }}</span>
            <button
              type="button"
              class="btn-secondary"
              (click)="goToPage(page() + 1)"
              [disabled]="page() >= totalPages()"
            >
              Siguiente
            </button>
          </div>
        }
      }

      <app-modal
        [open]="selectedOrder() !== null"
        [title]="'Pedido ' + (selectedOrder()?.orderNumber ?? '')"
        size="xl"
        testId="delivery-detail"
        (closed)="closeDetail()"
      >
        @if (selectedOrder(); as order) {
          <div class="flex flex-col gap-2xl">
            @if (statusError()) {
              <p class="form-error" data-testid="delivery-status-error">{{ statusError() }}</p>
            }

            <div class="grid gap-lg md:grid-cols-2">
              <div class="bg-canvas-soft rounded-xl p-lg">
                <h3 class="text-body-sm-strong mb-sm">Cliente</h3>
                @if (order.customer) {
                  <p class="text-body-sm font-medium">
                    {{ order.customer.firstName }} {{ order.customer.lastName }}
                  </p>
                  <p class="text-body-sm text-body">{{ order.customer.email }}</p>
                  @if (order.customer.phone) {
                    <a
                      [href]="'https://wa.me/' + cleanPhone(order.customer.phone)"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-body-sm text-link"
                    >
                      {{ order.customer.phone }}
                    </a>
                  }
                }
              </div>
              @if (order.shippingAddress) {
                <div class="bg-canvas-soft rounded-xl p-lg">
                  <h3 class="text-body-sm-strong mb-sm">Dirección de entrega</h3>
                  <p class="text-body-sm font-medium">{{ order.shippingAddress.street }}</p>
                  <p class="text-body-sm text-body">
                    {{ order.shippingAddress.city }}, {{ order.shippingAddress.state }}
                  </p>
                  <p class="text-body-sm text-body">
                    {{ order.shippingAddress.zipCode }}, {{ order.shippingAddress.country }}
                  </p>
                </div>
              }
            </div>

            <div>
              <div class="flex items-center justify-between mb-md">
                <h3 class="text-body-sm-strong">Seguimiento</h3>
                @if (order.deliveryId) {
                  <button
                    type="button"
                    class="btn-secondary"
                    (click)="toggleSharing()"
                    data-testid="delivery-share-toggle"
                  >
                    {{ sharing() ? 'Detener ubicación' : 'Compartir ubicación' }}
                  </button>
                }
              </div>
              <app-delivery-map
                [destLat]="order.shippingAddress?.latitude ?? null"
                [destLng]="order.shippingAddress?.longitude ?? null"
                [deliveryLat]="effectiveDeliveryLat(order)"
                [deliveryLng]="effectiveDeliveryLng(order)"
              />
              @if (geoError()) {
                <p class="form-error mt-sm" data-testid="delivery-geo-error">{{ geoError() }}</p>
              }
            </div>

            <div>
              <h3 class="text-body-sm-strong mb-md">Productos ({{ order.items.length }})</h3>
              <div class="divide-y divide-surface-pressed border border-surface-pressed rounded-lg">
                @for (item of order.items; track item.id) {
                  <div class="px-lg py-md flex items-center gap-lg">
                    <div
                      class="w-10 h-10 rounded-lg bg-canvas-softer flex items-center justify-center shrink-0 overflow-hidden"
                    >
                      @if (item.productImage) {
                        <img
                          [src]="item.productImage"
                          [alt]="item.productName"
                          class="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      }
                    </div>
                    <p class="flex-1 min-w-0 text-body-sm truncate">{{ item.productName }}</p>
                    <span class="text-body-sm text-body shrink-0">x{{ item.quantity }}</span>
                  </div>
                }
              </div>
            </div>

            @if (order.deliveryId) {
              <app-order-chat
                [orderId]="order.id"
                [orderStatus]="order.status"
                mode="delivery"
              />
            }
          </div>
        }

        <div modalFooter>
          <button
            type="button"
            class="btn-secondary"
            (click)="closeDetail()"
            data-testid="delivery-detail-close"
          >
            Cerrar
          </button>
          @if (selectedOrder()?.deliveryId && selectedOrder()?.status === 'out_for_delivery') {
            <button
              type="button"
              class="btn-primary"
              [disabled]="completing()"
              (click)="complete()"
              data-testid="delivery-complete"
            >
              @if (completing()) {
                <span class="btn-spinner"></span>
              } @else {
                Marcar como entregado
              }
            </button>
          }
        </div>
      </app-modal>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class DeliveryOrders implements OnInit {
  private readonly deliveryService = inject(DeliveryService);
  private readonly chat = inject(ChatService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly orders = signal<DeliveryOrder[]>([]);
  protected readonly loading = signal(true);
  protected readonly scope = signal<DeliveryScope>('available');
  protected readonly page = signal(1);
  protected readonly total = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly acceptingId = signal<string | null>(null);

  protected readonly selectedOrder = signal<DeliveryOrderDetail | null>(null);
  protected readonly completing = signal(false);
  protected readonly statusError = signal('');

  protected readonly sharing = signal(false);
  protected readonly myPosition = signal<{ lat: number; lng: number } | null>(null);
  protected readonly geoError = signal('');

  protected searchTerm = '';
  private searchTimeout?: ReturnType<typeof setTimeout>;
  private watchId: number | null = null;
  private lastSentAt = 0;
  private lastSentLat = 0;
  private lastSentLng = 0;

  ngOnInit(): void {
    this.loadOrders();

    this.chat.newReadyOrder$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.scope() === 'available') this.loadOrders();
    });

    this.destroyRef.onDestroy(() => this.stopSharing());
  }

  protected setScope(scope: DeliveryScope): void {
    this.scope.set(scope);
    this.page.set(1);
    this.loadOrders();
  }

  protected onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page.set(1);
      this.loadOrders();
    }, 300);
  }

  protected goToPage(p: number): void {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.loadOrders();
  }

  protected accept(order: DeliveryOrder): void {
    this.acceptingId.set(order.id);
    this.statusError.set('');
    this.deliveryService
      .accept(order.id)
      .pipe(finalize(() => this.acceptingId.set(null)))
      .subscribe({
        next: () => {
          this.toast.success('Pedido aceptado');
          this.setScope('mine');
          this.viewOrder(order.id);
        },
        error: (err) => {
          const raw = err?.error?.message;
          const msg = Array.isArray(raw) ? raw.join(', ') : (raw ?? 'No se pudo aceptar');
          this.toast.error(msg);
        },
      });
  }

  protected viewOrder(id: string): void {
    this.statusError.set('');
    this.deliveryService.getOrder(id).subscribe({
      next: (order) => {
        this.selectedOrder.set(order);
        if (order.deliveryPosition) {
          this.myPosition.set({
            lat: order.deliveryPosition.latitude,
            lng: order.deliveryPosition.longitude,
          });
        }
      },
      error: () => this.toast.error('No se pudo cargar el pedido'),
    });
  }

  protected closeDetail(): void {
    this.stopSharing();
    this.selectedOrder.set(null);
    this.statusError.set('');
    this.geoError.set('');
  }

  protected complete(): void {
    const order = this.selectedOrder();
    if (!order) return;
    this.completing.set(true);
    this.statusError.set('');
    this.deliveryService
      .complete(order.id)
      .pipe(finalize(() => this.completing.set(false)))
      .subscribe({
        next: () => {
          this.toast.success('Pedido entregado');
          this.stopSharing();
          this.selectedOrder.set(null);
          this.loadOrders();
        },
        error: (err) => {
          const raw = err?.error?.message;
          this.statusError.set(
            Array.isArray(raw) ? raw.join(', ') : (raw ?? 'No se pudo completar'),
          );
        },
      });
  }

  protected toggleSharing(): void {
    if (this.sharing()) {
      this.stopSharing();
      return;
    }
    const order = this.selectedOrder();
    if (!order) return;

    if (!('geolocation' in navigator)) {
      this.geoError.set('Tu dispositivo no soporta geolocalización');
      return;
    }

    this.geoError.set('');
    this.sharing.set(true);
    this.watchId = navigator.geolocation.watchPosition(
      (pos) => this.onPosition(order.id, pos.coords.latitude, pos.coords.longitude),
      () => {
        this.geoError.set('No se pudo obtener tu ubicación. Revisá los permisos.');
        this.stopSharing();
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
  }

  private onPosition(orderId: string, lat: number, lng: number): void {
    this.myPosition.set({ lat, lng });

    const now = Date.now();
    const moved =
      Math.abs(lat - this.lastSentLat) > 0.0002 || Math.abs(lng - this.lastSentLng) > 0.0002;
    if (now - this.lastSentAt < 8000 && !moved) return;

    this.lastSentAt = now;
    this.lastSentLat = lat;
    this.lastSentLng = lng;
    this.deliveryService.updateLocation(orderId, lat, lng).subscribe({
      error: () => undefined,
    });
  }

  private stopSharing(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.sharing.set(false);
  }

  protected effectiveDeliveryLat(order: DeliveryOrderDetail): number | null {
    const mine = this.myPosition();
    if (this.sharing() && mine) return mine.lat;
    return order.deliveryPosition?.latitude ?? null;
  }

  protected effectiveDeliveryLng(order: DeliveryOrderDetail): number | null {
    const mine = this.myPosition();
    if (this.sharing() && mine) return mine.lng;
    return order.deliveryPosition?.longitude ?? null;
  }

  protected cleanPhone(phone: string): string {
    return phone.replace(/[^0-9+]/g, '');
  }

  private loadOrders(): void {
    this.loading.set(true);
    this.deliveryService
      .getOrders(this.scope(), this.page(), 10, this.searchTerm)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.orders.set(res.data);
          this.total.set(res.total);
          this.totalPages.set(res.totalPages);
        },
        error: () => this.loading.set(false),
      });
  }
}
