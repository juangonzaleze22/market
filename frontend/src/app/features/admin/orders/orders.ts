import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { BranchService } from '../../../core/services/branch.service';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, DecimalPipe, SlicePipe } from '@angular/common';
import { finalize } from 'rxjs';
import { AdminService, AdminOrder, AdminOrderDetail } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { NotificationsService } from '../../../core/services/notifications.service';
import { ChatService, OrderStatusEvent } from '../../../core/services/chat.service';
import { ModalComponent } from '../../../shared/ui/modal';
import { ConfirmDialogComponent } from '../../../shared/ui/confirm-dialog';
import { MapViewComponent } from '../../../shared/ui/map-view';
import { OrderChat } from '../../../shared/ui/order-chat';
import { DeliveryMapComponent } from '../../../shared/ui/delivery-map';
import { OrderFlowSteps } from '../../../shared/ui/order-flow-steps';
import { OrderStatusBadge } from '../../../shared/ui/order-status-badge';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'paid', label: 'Pagado' },
  { value: 'processing', label: 'En preparación' },
  { value: 'shipped', label: 'Listo' },
  { value: 'out_for_delivery', label: 'En camino' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'rejected', label: 'Rechazado' },
  { value: 'cancelled', label: 'Cancelado' },
];

interface ModalStep {
  label: string;
  status: string;
  completed: boolean;
  active: boolean;
  clickable: boolean;
}

@Component({
  selector: 'app-admin-orders',
  imports: [
    FormsModule,
    RouterLink,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    SlicePipe,
    ModalComponent,
    ConfirmDialogComponent,
    MapViewComponent,
    OrderChat,
    DeliveryMapComponent,
    OrderFlowSteps,
    OrderStatusBadge,
  ],
  template: `
    <div data-testid="admin-orders">
      <div class="flex flex-col gap-lg mb-2xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-body-2xl font-bold" data-testid="orders-title">Pedidos</h1>
          <span class="text-body-sm text-body">{{ total() }} pedidos</span>
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
            data-testid="order-search"
          />
        </div>
        <select
          [(ngModel)]="filterStatus"
          (ngModelChange)="onSearch()"
          class="filter-input"
          data-testid="status-filter"
        >
          <option value="">Todos los estados</option>
          @for (opt of statusOptions; track opt.value) {
            <option [value]="opt.value">{{ opt.label }}</option>
          }
        </select>
        <select
          [(ngModel)]="filterBranch"
          (ngModelChange)="onSearch()"
          class="filter-input"
          data-testid="branch-filter"
        >
          <option value="">Todas las sucursales</option>
          @for (branch of branchService.branches(); track branch.id) {
            <option [value]="branch.id">{{ branch.name }}</option>
          }
        </select>
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
            data-testid="orders-table-header"
          >
            <div
              class="col-span-2 cursor-pointer select-none hover:bg-white/10 rounded px-sm py-xxs -mx-sm"
              (click)="onSort('orderNumber')"
              data-testid="sort-orderNumber"
            >
              Pedido{{ sortIcon('orderNumber') }}
            </div>
            <div
              class="col-span-2 cursor-pointer select-none hover:bg-white/10 rounded px-sm py-xxs -mx-sm"
              (click)="onSort('status')"
              data-testid="sort-status"
            >
              Estado{{ sortIcon('status') }}
            </div>
            <div class="col-span-3">Flujo</div>
            <div
              class="col-span-2 cursor-pointer select-none hover:bg-white/10 rounded px-sm py-xxs -mx-sm"
              (click)="onSort('totalAmount')"
              data-testid="sort-totalAmount"
            >
              Total{{ sortIcon('totalAmount') }}
            </div>
            <div
              class="col-span-2 cursor-pointer select-none hover:bg-white/10 rounded px-sm py-xxs -mx-sm"
              (click)="onSort('createdAt')"
              data-testid="sort-createdAt"
            >
              Fecha{{ sortIcon('createdAt') }}
            </div>
            <div class="col-span-1 text-right">Acciones</div>
          </div>
          <div class="border border-surface-pressed border-t-0 rounded-b-xl">
            @for (order of orders(); track order.id) {
              <div
                class="grid grid-cols-12 gap-4 items-center px-lg py-4 border-b border-surface-pressed last:border-b-0 hover:bg-canvas-soft/50"
                [attr.data-testid]="'order-row-' + order.id"
              >
                <div class="col-span-2 text-body-sm font-medium">{{ order.orderNumber }}</div>
                <div class="col-span-2">
                  <app-order-status [status]="order.status" size="md" />
                </div>
                <div class="col-span-3">
                  <app-order-flow-steps [status]="order.status" [orderId]="order.id" />
                </div>
                <div class="col-span-2 text-body-sm">{{ order.totalAmount | currency }}</div>
                <div class="col-span-2 text-body-sm text-body">
                  {{ order.createdAt | date: 'dd/MM/yyyy HH:mm' }}
                </div>
                <div class="col-span-1 flex items-center justify-end">
                  <button
                    type="button"
                    class="admin-icon-btn"
                    (click)="viewOrder(order.id)"
                    [disabled]="loadingDetailId() === order.id"
                    title="Ver detalle"
                    [attr.aria-label]="'Ver detalle del pedido ' + order.orderNumber"
                    [attr.data-testid]="'view-order-' + order.id"
                  >
                    @if (loadingDetailId() === order.id) {
                      <span class="btn-spinner"></span>
                    } @else {
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                        <path
                          fill-rule="evenodd"
                          d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM10 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    }
                  </button>
                </div>
              </div>
            } @empty {
              <div class="px-xl py-2xl text-center text-body text-body-sm">
                No se encontraron pedidos
              </div>
            }
          </div>
        </div>

        <!-- Mobile card list -->
        <div class="md:hidden flex flex-col gap-md">
          @for (order of orders(); track order.id) {
            <div
              class="bg-canvas rounded-xl border border-surface-pressed p-lg"
              (click)="openDropdown.set(null)"
              [attr.data-testid]="'order-card-' + order.id"
            >
              <div class="flex items-start justify-between gap-md">
                <div class="min-w-0">
                  <p class="text-body-sm font-medium">{{ order.orderNumber }}</p>
                  <div class="mt-xxs">
                    <app-order-status [status]="order.status" />
                  </div>
                </div>
                <div class="relative shrink-0">
                  <button
                    type="button"
                    (click)="toggleDropdown($event, order.id)"
                    class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-canvas-soft transition-colors text-body"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                      <path
                        d="M6 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm6 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                      />
                    </svg>
                  </button>
                  @if (openDropdown() === order.id) {
                    <div
                      class="absolute right-0 top-full mt-xs w-44 bg-canvas rounded-xl border border-surface-pressed shadow-lg z-10 py-xs"
                      (click)="$event.stopPropagation()"
                    >
                      <button
                        type="button"
                        (click)="openDropdown.set(null); viewOrder(order.id)"
                        [disabled]="loadingDetailId() === order.id"
                        [attr.data-testid]="'mobile-view-order-' + order.id"
                        class="flex items-center gap-md w-full px-lg py-md text-body-sm text-body hover:bg-canvas-soft transition-colors text-left"
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 shrink-0">
                          <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                          <path
                            fill-rule="evenodd"
                            d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM10 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                            clip-rule="evenodd"
                          />
                        </svg>
                        Ver detalle
                      </button>
                    </div>
                  }
                </div>
              </div>
              <div class="mt-md">
                <app-order-flow-steps
                  [status]="order.status"
                  [orderId]="order.id"
                  variant="mobile"
                />
              </div>
              <div class="flex items-center justify-between mt-lg">
                <div>
                  <p class="text-body-xs text-mute">Total</p>
                  <p class="text-body-sm font-medium">{{ order.totalAmount | currency }}</p>
                </div>
                <div class="text-right">
                  <p class="text-body-xs text-mute">Fecha</p>
                  <p class="text-body-sm text-body">{{ order.createdAt | date: 'dd/MM/yyyy' }}</p>
                </div>
              </div>
            </div>
          } @empty {
            <div
              class="px-xl py-2xl text-center text-body text-body-sm bg-canvas rounded-xl border border-surface-pressed"
            >
              No se encontraron pedidos
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
              data-testid="prev-page"
            >
              Anterior
            </button>
            <span class="text-body-sm text-body" data-testid="page-info"
              >{{ page() }} / {{ totalPages() }}</span
            >
            <button
              type="button"
              (click)="goToPage(page() + 1)"
              [disabled]="page() >= totalPages()"
              class="btn-secondary"
              data-testid="next-page"
            >
              Siguiente
            </button>
          </div>
        }
      }

      <!-- Order detail modal -->
      <app-modal
        [open]="selectedOrder() !== null"
        [title]="'Pedido ' + (selectedOrder()?.orderNumber ?? '')"
        size="xl"
        testId="order-detail-modal"
        (closed)="closeDetail()"
      >
        @if (selectedOrder(); as order) {
          <div class="order-detail-layout" data-testid="order-detail">
            @if (statusError()) {
              <p class="form-error col-span-full" data-testid="status-error">{{ statusError() }}</p>
            }

            @if (order.status === 'rejected') {
              <div class="order-rejected-banner col-span-full" data-testid="order-rejected-banner">
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
                  <p class="order-rejected-banner-title">Pago rechazado</p>
                  <p class="order-rejected-banner-reason" data-testid="order-rejected-reason">
                    {{ order.rejectionReason || 'Sin motivo especificado' }}
                  </p>
                  @if (order.rejectedAt) {
                    <p class="order-rejected-banner-date">
                      {{ order.rejectedAt | date: 'dd/MM/yyyy HH:mm' }}
                    </p>
                  }
                </div>
              </div>
            }

            <!-- Columna izquierda -->
            <div class="order-detail-left">
              <!-- Timeline de Estado -->
              <div>
                <div class="flex items-center justify-between mb-xl">
                  <h3 class="text-body-sm-strong">Estado del Pedido</h3>
                  @if (isSavingStatus()) {
                    <span class="btn-spinner text-primary" data-testid="status-spinner"></span>
                  }
                </div>
                <div class="modal-timeline">
                  @for (
                    step of modalTimelineSteps(order.status);
                    track step.status;
                    let i = $index;
                    let last = $last
                  ) {
                    <div class="modal-timeline-step-wrapper">
                      <button
                        type="button"
                        class="modal-timeline-step"
                        [class.completed]="step.completed"
                        [class.active]="step.active"
                        [class.clickable]="step.clickable && !isSavingStatus()"
                        [disabled]="!step.clickable || isSavingStatus()"
                        (click)="
                          step.clickable && requestStatusChange(order.id, step.status, step.label)
                        "
                        [attr.data-testid]="'timeline-step-' + step.status"
                      >
                        <div class="modal-step-icon">
                          @if (step.active) {
                            <span class="modal-step-dot"></span>
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
                            <span class="modal-step-dot"></span>
                          }
                        </div>
                        <span class="modal-step-label">{{ step.label }}</span>
                      </button>
                      @if (!last) {
                        <div
                          class="modal-timeline-connector"
                          [class.completed]="step.completed"
                        ></div>
                      }
                    </div>
                  }
                </div>
              </div>

              @if (canReject(order.status)) {
                <div class="order-reject-action">
                  <button
                    type="button"
                    class="btn-reject"
                    (click)="openRejectDialog()"
                    [disabled]="isSavingStatus() || isRejecting()"
                    data-testid="reject-payment"
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                    Rechazar pago
                  </button>
                </div>
              }

              <!-- Info del Pedido -->
              <div class="order-info-grid">
                <div class="order-info-item">
                  <span class="order-info-label">Total</span>
                  <span
                    class="order-info-value order-info-value--bold"
                    data-testid="detail-total"
                    >{{ order.totalAmount | currency }}</span
                  >
                </div>
                <div class="order-info-item">
                  <span class="order-info-label">Método de pago</span>
                  <span class="order-info-value" data-testid="detail-payment">{{
                    order.paymentMethod || '—'
                  }}</span>
                </div>
                <div class="order-info-item">
                  <span class="order-info-label">Creado</span>
                  <span class="order-info-value" data-testid="detail-created">{{
                    order.createdAt | date: 'dd/MM/yyyy HH:mm'
                  }}</span>
                </div>
                <div class="order-info-item">
                  <span class="order-info-label">Actualizado</span>
                  <span class="order-info-value" data-testid="detail-updated">{{
                    order.updatedAt | date: 'dd/MM/yyyy HH:mm'
                  }}</span>
                </div>
                <div class="order-info-item order-info-item--full">
                  <span class="order-info-label">Comprobante</span>
                  @if (order.receiptUrl) {
                    <a
                      [href]="order.receiptUrl"
                      target="_blank"
                      rel="noopener"
                      class="order-info-value order-info-link"
                      data-testid="detail-receipt"
                      >Ver comprobante</a
                    >
                  } @else {
                    <span class="order-info-value">—</span>
                  }
                </div>
              </div>

              <!-- Items -->
              <div>
                <h3 class="text-body-sm-strong mb-md">Productos ({{ order.items.length }})</h3>
                <div
                  class="divide-y divide-surface-pressed border border-surface-pressed rounded-lg"
                >
                  @for (item of order.items; track item.id) {
                    <div
                      class="px-lg py-md flex items-center gap-lg"
                      [attr.data-testid]="'detail-item-' + item.id"
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
                        <div class="flex items-center gap-sm flex-wrap">
                          <p class="text-body-sm truncate">{{ item.productName }}</p>
                          @if (item.hasFlashDiscount) {
                            <a
                              [routerLink]="'/admin/flash-sales'"
                              class="inline-flex items-center px-xs py-xxs rounded-pill text-body-xs font-medium bg-orange-50 text-orange-700 shrink-0 hover:bg-orange-100 transition-colors cursor-pointer"
                              [attr.data-testid]="'flash-sale-link-' + item.id"
                            >
                              <svg
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                width="12"
                                height="12"
                                class="mr-xxs"
                              >
                                <path
                                  fill-rule="evenodd"
                                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                                  clip-rule="evenodd"
                                />
                              </svg>
                              Flash · {{ item.flashSaleId | slice: 0 : 8 }}
                            </a>
                          }
                        </div>
                        <p class="text-body-sm text-body">
                          x{{ item.quantity }} @ {{ item.unitPrice | currency }}
                          @if (item.originalPrice) {
                            <span class="text-mute line-through ml-sm">{{
                              item.originalPrice | currency
                            }}</span>
                          }
                        </p>
                      </div>
                      <span class="text-body-sm font-medium shrink-0">{{
                        item.subtotal | currency
                      }}</span>
                    </div>
                  } @empty {
                    <p class="px-lg py-md text-body-sm text-body text-center">Sin items</p>
                  }
                </div>
              </div>

              @if (chatEnabled(order.status)) {
                <app-order-chat
                  [orderId]="order.id"
                  [orderStatus]="order.status"
                  mode="admin"
                />
              }
            </div>

            <!-- Columna derecha -->
            <div class="order-detail-right">
              <!-- Info del Cliente -->
              @if (order.user) {
                <div class="mb-xl">
                  <h3 class="text-body-sm-strong mb-md">Cliente</h3>
                  <div class="bg-canvas-soft rounded-xl p-lg">
                    <p class="text-body-sm font-medium">
                      {{ order.user.firstName }} {{ order.user.lastName }}
                    </p>
                    <p class="text-body-sm text-body">{{ order.user.email }}</p>
                    @if (order.user.phone) {
                      <div class="flex items-center gap-sm mt-xs">
                        <span class="text-body-sm text-body">{{ order.user.phone }}</span>
                        <a
                          [href]="'https://wa.me/' + cleanPhone(order.user.phone)"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="whatsapp-link"
                          title="Enviar WhatsApp"
                          [attr.data-testid]="'whatsapp-' + order.user.id"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366">
                            <path
                              d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
                            />
                          </svg>
                        </a>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Dirección de envío -->
              @if (order.shippingAddress) {
                <div>
                  <h3 class="text-body-sm-strong mb-md">Dirección de envío</h3>
                  <div class="bg-canvas-soft rounded-xl p-lg">
                    <p class="text-body-sm font-medium">{{ order.shippingAddress.street }}</p>
                    <p class="text-body-sm text-body">
                      {{ order.shippingAddress.city }}, {{ order.shippingAddress.state }}
                    </p>
                    <p class="text-body-sm text-body">
                      {{ order.shippingAddress.zipCode }}, {{ order.shippingAddress.country }}
                    </p>
                    @if (order.shippingAddress.latitude && order.shippingAddress.longitude) {
                      <p class="text-caption text-mute mt-sm">
                        {{ order.shippingAddress.latitude | number: '1.6-6' }},
                        {{ order.shippingAddress.longitude | number: '1.6-6' }}
                      </p>
                    }
                  </div>
                  @if (order.shippingAddress.latitude && order.shippingAddress.longitude) {
                    <div class="mt-lg">
                      <app-map-view
                        [latitude]="order.shippingAddress.latitude"
                        [longitude]="order.shippingAddress.longitude"
                      />
                    </div>
                  }
                </div>
              }

              <!-- Delivery -->
              @if (order.deliveryId) {
                <div class="mt-xl" data-testid="admin-delivery">
                  <h3 class="text-body-sm-strong mb-md">Delivery</h3>
                  <div class="bg-canvas-soft rounded-xl p-lg">
                    @if (order.delivery) {
                      <p class="text-body-sm font-medium" data-testid="admin-delivery-name">
                        {{ order.delivery.firstName }} {{ order.delivery.lastName }}
                      </p>
                      @if (order.delivery.phone) {
                        <a
                          [href]="'https://wa.me/' + cleanPhone(order.delivery.phone)"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="text-body-sm text-link"
                        >
                          {{ order.delivery.phone }}
                        </a>
                      }
                    } @else {
                      <p class="text-body-sm text-body">Repartidor asignado</p>
                    }
                  </div>
                  <div class="mt-lg">
                    <app-delivery-map
                      [destLat]="order.shippingAddress?.latitude ?? null"
                      [destLng]="order.shippingAddress?.longitude ?? null"
                      [deliveryLat]="order.deliveryPosition?.latitude ?? null"
                      [deliveryLng]="order.deliveryPosition?.longitude ?? null"
                    />
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <div modalFooter>
          <button
            type="button"
            class="btn-secondary"
            (click)="closeDetail()"
            [disabled]="isSavingStatus()"
            data-testid="close-detail"
          >
            Cerrar
          </button>
        </div>
      </app-modal>

      <!-- Confirmación de cambio de estado -->
      <app-confirm-dialog
        [open]="confirmData() !== null"
        [title]="'Cambiar estado del pedido'"
        [message]="
          '¿Estás seguro de que deseas cambiar el estado a <strong>' +
          (confirmData()?.label ?? '') +
          '</strong>?'
        "
        [loading]="isSavingStatus()"
        [variant]="'warning'"
        testId="status-confirm-dialog"
        (confirmed)="confirmStatusChange()"
        (cancelled)="cancelStatusChange()"
      />

      <!-- Rechazo de pago -->
      <app-modal
        [open]="rejectDialogOpen()"
        title="Rechazar pago"
        size="form"
        testId="reject-dialog"
        (closed)="closeRejectDialog()"
      >
        <div class="flex flex-col gap-sm">
          <p class="text-body-sm text-body">
            Indicá el motivo por el cual rechazás el comprobante de pago. El cliente verá este
            motivo en el detalle de su pedido.
          </p>
          <label class="form-label" for="reject-reason">Motivo de rechazo *</label>
          <textarea
            id="reject-reason"
            class="form-input"
            rows="3"
            placeholder="Ej. El comprobante no coincide con el monto, la imagen es ilegible..."
            [(ngModel)]="rejectReason"
            (ngModelChange)="rejectError.set('')"
            data-testid="reject-reason"
          ></textarea>
          @if (rejectError()) {
            <p class="form-error" data-testid="reject-error">{{ rejectError() }}</p>
          }
        </div>

        <div modalFooter>
          <button
            type="button"
            class="btn-secondary"
            (click)="closeRejectDialog()"
            [disabled]="isRejecting()"
            data-testid="reject-cancel"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="btn-reject-fill"
            (click)="confirmReject()"
            [disabled]="isRejecting()"
            data-testid="reject-confirm"
          >
            @if (isRejecting()) {
              <span class="btn-spinner"></span>
            } @else {
              Rechazar pago
            }
          </button>
        </div>
      </app-modal>
    </div>
  `,
  styles: `
    .order-detail-layout {
      display: grid;
      grid-template-columns: 1fr 280px;
      gap: 24px;
    }

    .order-detail-left {
      display: flex;
      flex-direction: column;
      gap: 24px;
      min-width: 0;
    }

    .order-detail-right {
      display: flex;
      flex-direction: column;
    }

    @media (max-width: 768px) {
      .order-detail-layout {
        grid-template-columns: 1fr;
      }
    }

    :host ::ng-deep .modal-timeline {
      display: flex;
      align-items: flex-start;
    }

    :host ::ng-deep .modal-timeline-step-wrapper {
      display: flex;
      align-items: center;
      flex: 1;
    }

    :host ::ng-deep .modal-timeline-step-wrapper:last-child {
      flex: 0 0 auto;
    }

    :host ::ng-deep .modal-timeline-connector {
      flex: 1;
      height: 3px;
      background-color: var(--color-surface-pressed);
      border-radius: 2px;
      margin: -22px -4px 0;
    }

    :host ::ng-deep .modal-timeline-connector.completed {
      background-color: var(--color-primary);
    }

    :host ::ng-deep .modal-timeline-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      background: none;
      border: none;
      padding: 0;
      cursor: default;
      flex-shrink: 0;
    }

    :host ::ng-deep .modal-timeline-step.clickable {
      cursor: pointer;
    }

    :host ::ng-deep .modal-timeline-step.clickable:hover .modal-step-icon {
      transform: scale(1.1);
      box-shadow: 0 0 0 4px rgba(28, 128, 87, 0.12);
    }

    :host ::ng-deep .modal-timeline-step.clickable:disabled {
      cursor: default;
    }

    :host ::ng-deep .modal-timeline-step.clickable:disabled:hover .modal-step-icon {
      transform: none;
      box-shadow: none;
    }

    :host ::ng-deep .modal-step-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: var(--color-canvas);
      border: 2px solid var(--color-surface-pressed);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-mute);
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    :host ::ng-deep .modal-timeline-step.completed .modal-step-icon {
      background-color: var(--color-primary);
      border-color: var(--color-primary);
      color: #ffffff;
    }

    :host ::ng-deep .modal-timeline-step.active .modal-step-icon {
      background-color: var(--color-canvas);
      border-color: var(--color-primary);
      color: var(--color-primary);
      position: relative;
    }

    :host ::ng-deep .modal-timeline-step.active .modal-step-icon::before,
    :host ::ng-deep .modal-timeline-step.active .modal-step-icon::after {
      content: '';
      position: absolute;
      inset: -3px;
      border-radius: 50%;
      border: 2px solid var(--color-primary);
      animation: ripple 2s ease-out infinite;
    }

    :host ::ng-deep .modal-timeline-step.active .modal-step-icon::after {
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

    :host ::ng-deep .modal-step-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--color-surface-pressed);
    }

    :host ::ng-deep .modal-timeline-step.active .modal-step-dot {
      background-color: var(--color-primary);
    }

    :host ::ng-deep .modal-step-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--color-body);
      text-align: center;
      line-height: 1.2;
    }

    :host ::ng-deep .modal-timeline-step.completed .modal-step-label {
      color: var(--color-ink);
      font-weight: 600;
    }

    :host ::ng-deep .modal-timeline-step.clickable:hover .modal-step-label {
      color: var(--color-primary);
    }

    .order-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .order-info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .order-info-item--full {
      grid-column: 1 / -1;
    }

    .order-info-label {
      font-size: 12px;
      line-height: 18px;
      color: var(--color-body);
    }

    .order-info-value {
      font-size: 13px;
      line-height: 18px;
      color: var(--color-ink);
    }

    .order-info-value--bold {
      font-size: 16px;
      line-height: 24px;
      font-weight: 700;
    }

    .order-info-link {
      color: var(--color-link);
      text-decoration: none;
    }

    .order-info-link:hover {
      text-decoration: underline;
    }

    .order-reject-action {
      display: flex;
      justify-content: flex-start;
    }

    .btn-reject {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 999px;
      border: 1px solid #fecaca;
      background-color: #fef2f2;
      color: #b91c1c;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition:
        background-color 0.15s ease,
        border-color 0.15s ease;
    }

    .btn-reject:hover:not(:disabled) {
      background-color: #fee2e2;
      border-color: #fca5a5;
    }

    .btn-reject:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-reject-fill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 8px 16px;
      border-radius: 999px;
      border: none;
      background-color: #dc2626;
      color: #ffffff;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.15s ease;
    }

    .btn-reject-fill:hover:not(:disabled) {
      background-color: #b91c1c;
    }

    .btn-reject-fill:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .order-rejected-banner {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      padding: 14px 16px;
      border-radius: 12px;
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
    }

    .order-rejected-banner-title {
      font-size: 14px;
      font-weight: 700;
      margin: 0 0 2px;
      color: #991b1b;
    }

    .order-rejected-banner-reason {
      font-size: 13px;
      margin: 0;
      color: #7f1d1d;
    }

    .order-rejected-banner-date {
      font-size: 12px;
      margin: 4px 0 0;
      color: #b91c1c;
      opacity: 0.8;
    }
  `,
})
export class AdminOrders implements OnInit, OnDestroy {
  private readonly adminService = inject(AdminService);
  protected readonly branchService = inject(BranchService);
  private readonly toast = inject(ToastService);
  private readonly notifications = inject(NotificationsService);
  private readonly chat = inject(ChatService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private newOrderSub?: { unsubscribe(): void };
  private orderStatusSub?: { unsubscribe(): void };
  private querySub?: { unsubscribe(): void };

  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly orders = signal<AdminOrder[]>([]);
  protected readonly selectedOrder = signal<AdminOrderDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadingDetailId = signal<string | null>(null);
  protected readonly openDropdown = signal<string | null>(null);
  protected readonly isSavingStatus = signal(false);
  protected readonly statusError = signal('');
  protected readonly rejectDialogOpen = signal(false);
  protected readonly rejectError = signal('');
  protected readonly isRejecting = signal(false);
  protected rejectReason = '';
  protected readonly page = signal(1);
  protected readonly total = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly confirmData = signal<{
    orderId: string;
    status: string;
    label: string;
  } | null>(null);
  protected sortField = '';
  protected sortOrder: 'ASC' | 'DESC' = 'DESC';
  protected searchTerm = '';
  protected filterStatus = '';
  protected filterBranch = '';
  private searchTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.branchService.load();
    this.loadOrders();
    this.notifications.markAllRead();
    this.newOrderSub = this.chat.newOrder$.subscribe(() => {
      this.loadOrders();
      this.notifications.markAllRead();
    });
    this.orderStatusSub = this.chat.orderStatus$.subscribe((event) => this.applyOrderStatus(event));

    this.querySub = this.route.queryParamMap.subscribe((params) => {
      const orderId = params.get('order');
      if (orderId) {
        this.viewOrder(orderId);
        this.router.navigate([], { queryParams: {}, replaceUrl: true });
      }
    });
  }

  ngOnDestroy(): void {
    this.newOrderSub?.unsubscribe();
    this.orderStatusSub?.unsubscribe();
    this.querySub?.unsubscribe();
  }

  private applyOrderStatus(event: OrderStatusEvent): void {
    if (this.selectedOrder()?.id === event.orderId) {
      this.adminService.getOrder(event.orderId).subscribe({
        next: (order) => {
          if (this.selectedOrder()?.id === event.orderId) {
            this.selectedOrder.set(order);
          }
        },
        error: () => undefined,
      });
    }

    const inList = this.orders().some((o) => o.id === event.orderId);
    if (!inList) return;

    if (this.filterStatus && this.filterStatus !== event.status) {
      this.loadOrders();
      return;
    }

    this.orders.update((list) =>
      list.map((o) => (o.id === event.orderId ? { ...o, status: event.status } : o)),
    );
  }

  chatEnabled(status: string): boolean {
    return ['paid', 'processing', 'shipped', 'out_for_delivery', 'delivered'].includes(
      status.toLowerCase(),
    );
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page.set(1);
      this.loadOrders();
    }, 300);
  }

  onSort(field: string): void {
    if (this.sortField === field) {
      this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortField = field;
      this.sortOrder = 'DESC';
    }
    this.page.set(1);
    this.loadOrders();
  }

  sortIcon(field: string): string {
    if (this.sortField !== field) return '';
    return this.sortOrder === 'ASC' ? ' ↑' : ' ↓';
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.loadOrders();
  }

  viewOrder(id: string): void {
    this.loadingDetailId.set(id);
    this.statusError.set('');
    this.openDropdown.set(null);
    this.adminService
      .getOrder(id)
      .pipe(finalize(() => this.loadingDetailId.set(null)))
      .subscribe({
        next: (order) => this.selectedOrder.set(order),
      });
  }

  closeDetail(): void {
    if (this.isSavingStatus()) return;
    this.selectedOrder.set(null);
    this.statusError.set('');
  }

  protected toggleDropdown(event: Event, id: string): void {
    event.stopPropagation();
    this.openDropdown.set(this.openDropdown() === id ? null : id);
  }

  onStatusChange(orderId: string, status: string): void {
    this.isSavingStatus.set(true);
    this.statusError.set('');
    this.adminService
      .updateOrderStatus(orderId, status)
      .pipe(finalize(() => this.isSavingStatus.set(false)))
      .subscribe({
        next: (updated) => {
          this.orders.update((list) =>
            list.map((o) => (o.id === updated.id ? { ...o, status: updated.status } : o)),
          );
          this.selectedOrder.update((o) =>
            o && o.id === updated.id ? { ...o, status: updated.status } : o,
          );
          this.toast.success('Estado del pedido actualizado');
        },
        error: (err) => {
          const message = err?.error?.message;
          const msg = Array.isArray(message)
            ? message.join(', ')
            : (message ?? 'No se pudo actualizar el estado');
          this.statusError.set(msg);
          this.toast.error(msg);
          const order = this.selectedOrder();
          if (order) this.viewOrder(order.id);
        },
      });
  }

  requestStatusChange(orderId: string, status: string, label: string): void {
    this.confirmData.set({ orderId, status, label });
  }

  confirmStatusChange(): void {
    const data = this.confirmData();
    if (!data) return;
    this.onStatusChange(data.orderId, data.status);
    this.confirmData.set(null);
  }

  cancelStatusChange(): void {
    this.confirmData.set(null);
  }

  canReject(status: string): boolean {
    return status === 'pending' || status === 'paid';
  }

  openRejectDialog(): void {
    this.rejectReason = '';
    this.rejectError.set('');
    this.rejectDialogOpen.set(true);
  }

  closeRejectDialog(): void {
    if (this.isRejecting()) return;
    this.rejectDialogOpen.set(false);
  }

  confirmReject(): void {
    const order = this.selectedOrder();
    if (!order) return;

    const reason = this.rejectReason.trim();
    if (!reason) {
      this.rejectError.set('El motivo de rechazo es obligatorio');
      return;
    }

    this.isRejecting.set(true);
    this.rejectError.set('');
    this.adminService
      .rejectOrder(order.id, reason)
      .pipe(finalize(() => this.isRejecting.set(false)))
      .subscribe({
        next: (updated) => {
          this.orders.update((list) =>
            list.map((o) => (o.id === updated.id ? { ...o, status: updated.status } : o)),
          );
          this.selectedOrder.update((o) =>
            o && o.id === updated.id
              ? {
                  ...o,
                  status: updated.status,
                  rejectionReason: reason,
                  rejectedAt: new Date().toISOString(),
                }
              : o,
          );
          this.rejectDialogOpen.set(false);
          this.toast.success('Pago rechazado');
        },
        error: (err) => {
          const message = err?.error?.message;
          const msg = Array.isArray(message)
            ? message.join(', ')
            : (message ?? 'No se pudo rechazar el pago');
          this.rejectError.set(msg);
          this.toast.error(msg);
        },
      });
  }

  cleanPhone(phone: string): string {
    return phone.replace(/[^0-9+]/g, '');
  }

  modalTimelineSteps(currentStatus: string): ModalStep[] {
    const statusOrder = [
      'pending',
      'paid',
      'processing',
      'shipped',
      'out_for_delivery',
      'delivered',
    ];
    const currentIdx = statusOrder.indexOf(currentStatus);
    const isTerminal = currentStatus === 'cancelled' || currentStatus === 'rejected';

    const labels: Record<string, string> = {
      pending: 'Pendiente',
      paid: 'Pagado',
      processing: 'En preparación',
      shipped: 'Listo',
      out_for_delivery: 'En camino',
      delivered: 'Entregado',
    };

    return statusOrder.map((s, i) => {
      const completed = !isTerminal && currentIdx >= i;
      const active = !isTerminal && currentIdx === i;
      const clickable = !isTerminal && (i === currentIdx + 1 || i === currentIdx - 1);

      return {
        label: labels[s],
        status: s,
        completed,
        active,
        clickable,
      };
    });
  }

  private loadOrders(): void {
    this.loading.set(true);
    this.adminService
      .getOrders(
        this.page(),
        10,
        this.searchTerm,
        this.filterStatus,
        this.sortField,
        this.sortOrder,
        this.filterBranch,
      )
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
