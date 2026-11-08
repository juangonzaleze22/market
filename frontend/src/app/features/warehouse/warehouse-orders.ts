import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { finalize } from 'rxjs';
import {
  WarehouseService,
  WarehouseOrder,
  WarehouseOrderDetail,
  WarehouseOrderItem,
} from '../../core/services/warehouse.service';
import { ToastService } from '../../core/services/toast.service';
import { ModalComponent } from '../../shared/ui/modal';
import { OrderStatusBadge } from '../../shared/ui/order-status-badge';
import { environment } from '../../../environments/environment';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'paid', label: 'Pagados' },
  { value: 'processing', label: 'En preparación' },
];

@Component({
  selector: 'app-warehouse-orders',
  imports: [FormsModule, CurrencyPipe, DatePipe, ModalComponent, OrderStatusBadge],
  template: `
    <div data-testid="warehouse-orders">
      <div class="flex flex-col gap-lg mb-2xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-body-2xl font-bold" data-testid="warehouse-orders-title">
            Pedidos para preparar
          </h1>
          <span class="text-body-sm text-body">{{ total() }} pedidos en cola</span>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex flex-col gap-md mb-xl sm:flex-row sm:items-center sm:flex-wrap">
        <div
          class="flex rounded-pill bg-canvas border border-surface-pressed overflow-hidden focus-within:border-primary"
        >
          <input
            type="text"
            placeholder="Buscar por número de pedido..."
            class="flex-1 bg-transparent outline-none border-none px-lg py-sm text-body-md"
            [(ngModel)]="searchTerm"
            (ngModelChange)="onSearch()"
            data-testid="warehouse-order-search"
          />
        </div>
        <select
          [(ngModel)]="filterStatus"
          (ngModelChange)="onSearch()"
          class="filter-input"
          data-testid="warehouse-status-filter"
        >
          @for (opt of statusOptions; track opt.value) {
            <option [value]="opt.value">{{ opt.label }}</option>
          }
        </select>
        <input
          type="date"
          class="filter-input"
          [(ngModel)]="filterDateFrom"
          (ngModelChange)="onSearch()"
          [attr.aria-label]="'Fecha desde'"
          data-testid="warehouse-date-from-filter"
        />
        <input
          type="date"
          class="filter-input"
          [(ngModel)]="filterDateTo"
          (ngModelChange)="onSearch()"
          [attr.aria-label]="'Fecha hasta'"
          data-testid="warehouse-date-to-filter"
        />
        <input
          type="number"
          min="0"
          placeholder="Artículos mín."
          class="filter-input w-32"
          [(ngModel)]="filterMinItems"
          (ngModelChange)="onSearch()"
          [attr.aria-label]="'Artículos mínimo'"
          data-testid="warehouse-min-items-filter"
        />
        <input
          type="number"
          min="0"
          placeholder="Artículos máx."
          class="filter-input w-32"
          [(ngModel)]="filterMaxItems"
          (ngModelChange)="onSearch()"
          [attr.aria-label]="'Artículos máximo'"
          data-testid="warehouse-max-items-filter"
        />
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center py-4xl">
          <div
            class="w-8 h-8 border-2 border-surface-pressed border-t-primary rounded-full animate-spin"
          ></div>
        </div>
      } @else {
        <!-- Desktop table -->
        <div
          class="bg-canvas rounded-xl border border-surface-pressed overflow-hidden max-md:hidden"
        >
          <div
            class="grid grid-cols-12 gap-4 bg-accent text-white rounded-t-xl px-lg py-3 font-semibold text-body-sm"
            data-testid="warehouse-table-header"
          >
            <div class="col-span-2">Pedido</div>
            <div class="col-span-2">Cliente</div>
            <div class="col-span-2">Estado</div>
            <div class="col-span-2">Preparación</div>
            <div class="col-span-2">Fecha</div>
            <div class="col-span-2 text-right">Acciones</div>
          </div>
          <div class="border border-surface-pressed border-t-0 rounded-b-xl">
            @for (order of orders(); track order.id) {
              <div
                class="grid grid-cols-12 gap-4 items-center px-lg py-4 border-b border-surface-pressed last:border-b-0 hover:bg-canvas-soft/50"
                [attr.data-testid]="'warehouse-order-row-' + order.id"
              >
                <div class="col-span-2 text-body-sm font-medium truncate">
                  {{ order.orderNumber }}
                </div>
                <div
                  class="col-span-2 text-body-sm text-body truncate"
                  [attr.data-testid]="'warehouse-customer-' + order.id"
                >
                  {{ order.customerName || '—' }}
                </div>
                <div class="col-span-2">
                  <app-order-status [status]="order.status" size="md" />
                </div>
                <div
                  class="col-span-2 text-body-sm text-body"
                  [attr.data-testid]="'warehouse-progress-text-' + order.id"
                >
                  {{ order.pickedItems }} / {{ order.totalItems }} artículos
                </div>
                <div class="col-span-2 text-body-sm text-body">
                  {{ order.createdAt | date: 'dd/MM/yyyy HH:mm' }}
                </div>
                <div class="col-span-2 flex items-center justify-end">
                  <button
                    type="button"
                    class="btn-primary"
                    (click)="openOrder(order.id)"
                    [disabled]="loadingDetailId() === order.id"
                    [attr.data-testid]="'warehouse-open-' + order.id"
                  >
                    @if (loadingDetailId() === order.id) {
                      <span class="btn-spinner"></span>
                    } @else {
                      {{ order.status === 'processing' ? 'Continuar' : 'Preparar' }}
                    }
                  </button>
                </div>
              </div>
            } @empty {
              <div class="px-xl py-2xl text-center text-body text-body-sm">
                No hay pedidos en cola
              </div>
            }
          </div>
        </div>

        <!-- Mobile cards -->
        <div class="md:hidden flex flex-col gap-md">
          @for (order of orders(); track order.id) {
            <div
              class="bg-canvas rounded-xl border border-surface-pressed p-lg"
              [attr.data-testid]="'warehouse-order-card-' + order.id"
            >
              <div class="flex items-start justify-between gap-md">
                <div class="min-w-0">
                  <p class="text-body-sm font-medium">{{ order.orderNumber }}</p>
                  <p class="text-body-sm text-body truncate">{{ order.customerName || '—' }}</p>
                  <div class="mt-xxs">
                    <app-order-status [status]="order.status" />
                  </div>
                </div>
                <span class="text-body-sm text-body shrink-0"
                  >{{ order.pickedItems }} / {{ order.totalItems }}</span
                >
              </div>
              <div class="flex items-center justify-between mt-lg">
                <div>
                  <p class="text-body-xs text-mute">Fecha</p>
                  <p class="text-body-sm text-body">{{ order.createdAt | date: 'dd/MM/yyyy' }}</p>
                </div>
                <button
                  type="button"
                  class="btn-primary"
                  (click)="openOrder(order.id)"
                  [disabled]="loadingDetailId() === order.id"
                  [attr.data-testid]="'warehouse-open-card-' + order.id"
                >
                  @if (loadingDetailId() === order.id) {
                    <span class="btn-spinner"></span>
                  } @else {
                    {{ order.status === 'processing' ? 'Continuar' : 'Preparar' }}
                  }
                </button>
              </div>
            </div>
          } @empty {
            <div
              class="px-xl py-2xl text-center text-body text-body-sm bg-canvas rounded-xl border border-surface-pressed"
            >
              No hay pedidos en cola
            </div>
          }
        </div>

        @if (totalPages() > 1) {
          <div class="flex items-center justify-center gap-md mt-xl">
            <button
              type="button"
              (click)="goToPage(page() - 1)"
              [disabled]="page() <= 1"
              class="btn-secondary"
              data-testid="warehouse-prev-page"
            >
              Anterior
            </button>
            <span class="text-body-sm text-body" data-testid="warehouse-page-info"
              >{{ page() }} / {{ totalPages() }}</span
            >
            <button
              type="button"
              (click)="goToPage(page() + 1)"
              [disabled]="page() >= totalPages()"
              class="btn-secondary"
              data-testid="warehouse-next-page"
            >
              Siguiente
            </button>
          </div>
        }
      }

      <!-- Detail modal -->
      <app-modal
        [open]="selectedOrder() !== null"
        [title]="'Pedido ' + (selectedOrder()?.orderNumber ?? '')"
        size="xl"
        testId="warehouse-detail-modal"
        (closed)="closeDetail()"
      >
        @if (selectedOrder(); as order) {
          <div class="warehouse-detail" data-testid="warehouse-detail">
            @if (statusError()) {
              <p class="form-error" data-testid="warehouse-status-error">{{ statusError() }}</p>
            }

            <!-- Progress -->
            <div class="flex items-center justify-between mb-sm">
              <h3 class="text-body-sm-strong">
                Artículos ({{ order.pickedItems }} / {{ order.totalItems }})
              </h3>
              <app-order-status
                [status]="order.status"
                size="md"
                testId="warehouse-detail-status"
              />
            </div>
            <div class="warehouse-progress-track mb-lg" data-testid="warehouse-progress">
              <div class="warehouse-progress-fill" [style.width.%]="progressPercent(order)"></div>
            </div>

            @if (order.status === 'paid') {
              <p class="text-body-sm text-body mb-lg" data-testid="warehouse-start-hint">
                Iniciá la preparación para comenzar a marcar los artículos.
              </p>
            }

            <!-- Checklist -->
            <div
              class="divide-y divide-surface-pressed border border-surface-pressed rounded-lg mb-xl"
            >
              @for (item of order.items; track item.id) {
                <label
                  class="flex items-center gap-lg px-lg py-md cursor-pointer hover:bg-canvas-soft/50"
                  [class.opacity-60]="order.status !== 'processing' || savingItemIds().has(item.id)"
                  [attr.data-testid]="'warehouse-item-' + item.id"
                >
                  <input
                    type="checkbox"
                    class="warehouse-check"
                    [checked]="item.picked"
                    [disabled]="order.status !== 'processing' || savingItemIds().has(item.id)"
                    (change)="toggleItem(order, item)"
                    [attr.data-testid]="'warehouse-item-check-' + item.id"
                  />
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
                    <p class="text-body-sm font-medium truncate" [class.line-through]="item.picked">
                      {{ item.productName }}
                    </p>
                    <p class="text-body-sm text-body">
                      @if (item.sku) {
                        <span>{{ item.sku }} · </span>
                      }
                      x{{ item.quantity }} @ {{ item.unitPrice | currency }}
                    </p>
                  </div>
                  <span class="text-body-sm font-medium shrink-0">{{
                    item.subtotal | currency
                  }}</span>
                </label>
              } @empty {
                <p class="px-lg py-md text-body-sm text-body text-center">Sin artículos</p>
              }
            </div>

            <!-- Customer -->
            @if (order.user) {
              <div>
                <h3 class="text-body-sm-strong mb-md">Cliente</h3>
                <div class="bg-canvas-soft rounded-xl p-lg">
                  <p class="text-body-sm font-medium">
                    {{ order.user.firstName }} {{ order.user.lastName }}
                  </p>
                  <p class="text-body-sm text-body">{{ order.user.email }}</p>
                  @if (order.user.phone) {
                    <p class="text-body-sm text-body">{{ order.user.phone }}</p>
                  }
                </div>
              </div>
            }
          </div>
        }

        <div modalFooter>
          <button
            type="button"
            class="btn-secondary"
            (click)="closeDetail()"
            [disabled]="isWorking()"
            data-testid="warehouse-detail-close"
          >
            Cerrar
          </button>
          @if (selectedOrder(); as order) {
            @if (order.status === 'paid') {
              <button
                type="button"
                class="btn-primary"
                (click)="startPreparation(order)"
                [disabled]="isWorking()"
                data-testid="warehouse-start"
              >
                @if (isStarting()) {
                  <span class="btn-spinner"></span>
                } @else {
                  Iniciar preparación
                }
              </button>
            } @else if (order.status === 'processing') {
              <button
                type="button"
                class="btn-primary"
                (click)="completeOrder(order)"
                [disabled]="isWorking() || order.pickedItems < order.totalItems"
                data-testid="warehouse-complete"
              >
                @if (isCompleting()) {
                  <span class="btn-spinner"></span>
                } @else {
                  Marcar como enviado
                }
              </button>
            }
          }
        </div>
      </app-modal>
    </div>
  `,
  styles: `
    .warehouse-detail {
      display: flex;
      flex-direction: column;
    }

    .warehouse-progress-track {
      width: 100%;
      height: 6px;
      border-radius: 999px;
      background-color: var(--color-surface-pressed);
      overflow: hidden;
    }

    .warehouse-progress-fill {
      height: 100%;
      background-color: var(--color-primary);
      border-radius: 999px;
      transition: width 0.2s ease;
    }

    .warehouse-check {
      width: 20px;
      height: 20px;
      accent-color: var(--color-primary);
      flex-shrink: 0;
      cursor: pointer;
    }

    .warehouse-check:disabled {
      cursor: not-allowed;
    }
  `,
})
export class WarehouseOrders implements OnInit {
  private readonly warehouseService = inject(WarehouseService);
  private readonly toast = inject(ToastService);

  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly orders = signal<WarehouseOrder[]>([]);
  protected readonly selectedOrder = signal<WarehouseOrderDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadingDetailId = signal<string | null>(null);
  protected readonly page = signal(1);
  protected readonly total = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly statusError = signal('');
  protected readonly isStarting = signal(false);
  protected readonly isCompleting = signal(false);
  protected readonly savingItemIds = signal<Set<string>>(new Set());
  protected searchTerm = '';
  protected filterStatus = '';
  protected filterDateFrom = '';
  protected filterDateTo = '';
  protected filterMinItems: number | null = null;
  protected filterMaxItems: number | null = null;
  private searchTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.loadOrders();
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page.set(1);
      this.loadOrders();
    }, 300);
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.loadOrders();
  }

  isWorking(): boolean {
    return this.isStarting() || this.isCompleting() || this.savingItemIds().size > 0;
  }

  openOrder(id: string): void {
    this.loadingDetailId.set(id);
    this.statusError.set('');
    this.warehouseService
      .getOrder(id)
      .pipe(finalize(() => this.loadingDetailId.set(null)))
      .subscribe({
        next: (order) => this.selectedOrder.set(order),
        error: () => this.toast.error('No se pudo cargar el pedido'),
      });
  }

  closeDetail(): void {
    if (this.isWorking()) return;
    this.selectedOrder.set(null);
    this.statusError.set('');
  }

  startPreparation(order: WarehouseOrderDetail): void {
    this.isStarting.set(true);
    this.statusError.set('');
    this.warehouseService
      .startOrder(order.id)
      .pipe(finalize(() => this.isStarting.set(false)))
      .subscribe({
        next: (updated) => {
          this.selectedOrder.update((o) => (o ? { ...o, status: updated.status } : o));
          this.updateListStatus(updated.id, updated.status);
          this.toast.success('Preparación iniciada');
        },
        error: (err) => this.handleError(err, 'No se pudo iniciar la preparación'),
      });
  }

  toggleItem(order: WarehouseOrderDetail, item: WarehouseOrderItem): void {
    const next = !item.picked;
    this.savingItemIds.update((set) => new Set(set).add(item.id));
    this.statusError.set('');
    this.warehouseService
      .setItemPicked(order.id, item.id, next)
      .pipe(
        finalize(() =>
          this.savingItemIds.update((set) => {
            const clone = new Set(set);
            clone.delete(item.id);
            return clone;
          }),
        ),
      )
      .subscribe({
        next: (res) => {
          this.selectedOrder.update((o) => {
            if (!o) return o;
            return {
              ...o,
              pickedItems: res.pickedItems,
              items: o.items.map((it) =>
                it.id === item.id
                  ? {
                      ...it,
                      picked: res.picked,
                      pickedAt: res.pickedAt,
                      pickedById: res.pickedById,
                    }
                  : it,
              ),
            };
          });
          this.updateListProgress(order.id, res.pickedItems);
        },
        error: (err) => this.handleError(err, 'No se pudo actualizar el artículo'),
      });
  }

  completeOrder(order: WarehouseOrderDetail): void {
    if (order.pickedItems < order.totalItems) return;
    this.isCompleting.set(true);
    this.statusError.set('');
    this.warehouseService
      .completeOrder(order.id)
      .pipe(finalize(() => this.isCompleting.set(false)))
      .subscribe({
        next: (updated) => {
          this.selectedOrder.set(null);
          this.toast.success(`Pedido ${updated.orderNumber} marcado como enviado`);
          this.loadOrders();
        },
        error: (err) => this.handleError(err, 'No se pudo completar el pedido'),
      });
  }

  progressPercent(order: WarehouseOrderDetail): number {
    if (order.totalItems === 0) return 0;
    return Math.round((order.pickedItems / order.totalItems) * 100);
  }


  private handleError(err: unknown, fallback: string): void {
    const message = (err as { error?: { message?: string | string[] } })?.error?.message;
    const msg = Array.isArray(message) ? message.join(', ') : (message ?? fallback);
    this.statusError.set(msg);
    this.toast.error(msg);
  }

  private updateListStatus(id: string, status: string): void {
    this.orders.update((list) => list.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  private updateListProgress(id: string, pickedItems: number): void {
    this.orders.update((list) => list.map((o) => (o.id === id ? { ...o, pickedItems } : o)));
  }

  private loadOrders(): void {
    this.loading.set(true);
    this.warehouseService
      .getOrders({
        page: this.page(),
        limit: environment.pageSize,
        search: this.searchTerm,
        status: this.filterStatus,
        dateFrom: this.filterDateFrom,
        dateTo: this.filterDateTo,
        minItems: this.filterMinItems,
        maxItems: this.filterMaxItems,
      })
      .subscribe({
        next: (res) => {
          this.orders.set(res.data);
          this.total.set(res.total);
          this.totalPages.set(res.totalPages);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
