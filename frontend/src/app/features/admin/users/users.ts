import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { finalize } from 'rxjs';
import {
  AdminService,
  AdminUser,
  AdminUserDetail,
  AdminOrderDetail,
} from '../../../core/services/admin.service';
import { BranchService } from '../../../core/services/branch.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalComponent } from '../../../shared/ui/modal';
import { OrderStatusBadge } from '../../../shared/ui/order-status-badge';
import { MapViewComponent } from '../../../shared/ui/map-view';

interface ModalStep {
  label: string;
  status: string;
  completed: boolean;
  active: boolean;
  clickable: boolean;
}

@Component({
  selector: 'app-admin-users',
  imports: [FormsModule, DatePipe, CurrencyPipe, DecimalPipe, ModalComponent, MapViewComponent, OrderStatusBadge],
  template: `
    <div data-testid="admin-users">
      <div class="flex flex-col gap-lg mb-2xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-body-2xl font-bold" data-testid="users-title">Usuarios</h1>
          <span class="text-body-sm text-body">{{ total() }} usuarios</span>
        </div>
        <button
          type="button"
          class="btn-primary"
          (click)="openCreate()"
          data-testid="create-user-button"
        >
          Nuevo usuario
        </button>
      </div>

      <!-- Filters -->
      <div class="flex flex-col gap-md mb-xl sm:flex-row sm:items-center sm:flex-wrap">
        <div
          class="flex rounded-pill bg-canvas border border-surface-pressed overflow-hidden focus-within:border-primary"
        >
          <input
            type="text"
            placeholder="Buscar por email o nombre..."
            class="flex-1 bg-transparent outline-none border-none px-lg py-sm text-body-md"
            [(ngModel)]="searchTerm"
            (ngModelChange)="onSearch()"
            data-testid="user-search"
          />
        </div>
        <select
          [(ngModel)]="filterRole"
          (ngModelChange)="onFilterChange()"
          class="filter-input"
          data-testid="role-filter"
        >
          <option value="">Todos los roles</option>
          <option value="customer">Customer</option>
          <option value="admin">Admin</option>
          <option value="warehouse">Warehouse</option>
          <option value="delivery">Delivery</option>
        </select>
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center py-4xl">
          <div
            class="w-8 h-8 border-2 border-surface-pressed border-t-primary rounded-full animate-spin"
          ></div>
        </div>
      } @else {
        <div data-testid="users-table">
        <!-- Desktop table -->
        <div
          class="bg-canvas rounded-xl border border-surface-pressed overflow-hidden max-md:hidden"
        >
          <div
            class="grid grid-cols-12 gap-4 bg-accent text-white rounded-t-xl px-lg py-3 font-semibold text-body-sm"
            data-testid="users-table-header"
          >
            <div class="col-span-3">Usuario</div>
            <div
              class="col-span-3 cursor-pointer select-none hover:bg-white/10 rounded px-sm py-xxs -mx-sm"
              (click)="onSort('email')"
              data-testid="sort-email"
            >
              Email{{ sortIcon('email') }}
            </div>
            <div
              class="col-span-2 cursor-pointer select-none hover:bg-white/10 rounded px-sm py-xxs -mx-sm"
              (click)="onSort('role')"
              data-testid="sort-role"
            >
              Rol{{ sortIcon('role') }}
            </div>
            <div
              class="col-span-2 cursor-pointer select-none hover:bg-white/10 rounded px-sm py-xxs -mx-sm"
              (click)="onSort('createdAt')"
              data-testid="sort-createdAt"
            >
              Creado{{ sortIcon('createdAt') }}
            </div>
            <div class="col-span-2 text-right">Acciones</div>
          </div>
          <div class="border border-surface-pressed border-t-0 rounded-b-xl">
            @for (user of users(); track user.id) {
              <div
                class="grid grid-cols-12 gap-4 items-center px-lg py-4 border-b border-surface-pressed last:border-b-0 hover:bg-canvas-soft/50"
                [attr.data-testid]="'user-row-' + user.id"
              >
                <div class="col-span-3 flex items-center gap-md min-w-0">
                  <div
                    class="w-9 h-9 rounded-full bg-canvas-soft flex items-center justify-center text-body-sm font-medium text-body shrink-0"
                  >
                    {{ getInitials(user) }}
                  </div>
                  <span class="text-body-sm font-medium truncate"
                    >{{ user.firstName }} {{ user.lastName }}</span
                  >
                </div>
                <div class="col-span-3 text-body-sm text-body truncate">{{ user.email }}</div>
                <div class="col-span-2">
                  <select
                    class="filter-input"
                    [ngModel]="user.role"
                    (ngModelChange)="onRoleChange(user.id, $event)"
                    [disabled]="user.id === currentUserId || savingRoleId() === user.id"
                    [attr.data-testid]="'role-select-' + user.id"
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                    <option value="warehouse">Warehouse</option>
                    <option value="delivery">Delivery</option>
                  </select>
                </div>
                <div class="col-span-2 text-body-sm text-body">
                  {{ user.createdAt | date: 'dd/MM/yyyy HH:mm' }}
                </div>
                <div class="col-span-2 flex items-center justify-end gap-sm">
                  <button
                    type="button"
                    class="admin-icon-btn"
                    (click)="viewUser(user.id)"
                    [disabled]="loadingDetailId() === user.id"
                    title="Ver detalle"
                    [attr.aria-label]="'Ver detalle de ' + user.email"
                    [attr.data-testid]="'view-user-' + user.id"
                  >
                    @if (loadingDetailId() === user.id) {
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
                  <button
                    type="button"
                    class="admin-icon-btn danger"
                    (click)="deleteUser(user.id)"
                    [disabled]="user.id === currentUserId || deletingId() === user.id"
                    title="Eliminar"
                    [attr.aria-label]="'Eliminar ' + user.email"
                    [attr.data-testid]="'delete-user-' + user.id"
                  >
                    @if (deletingId() === user.id) {
                      <span class="btn-spinner"></span>
                    } @else {
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fill-rule="evenodd"
                          d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482 41.03 41.03 0 0 0-2.365-.298V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    }
                  </button>
                </div>
              </div>
            } @empty {
              <div class="px-xl py-2xl text-center text-body text-body-sm">
                No se encontraron usuarios
              </div>
            }
          </div>
        </div>

        <!-- Mobile card list -->
        <div class="md:hidden flex flex-col gap-md">
          @for (user of users(); track user.id) {
            <div
              class="bg-canvas rounded-xl border border-surface-pressed p-lg"
              (click)="openDropdown.set(null)"
              [attr.data-testid]="'user-card-' + user.id"
            >
              <div class="flex items-start gap-md">
                <div
                  class="w-11 h-11 rounded-full bg-canvas-soft flex items-center justify-center text-body-sm font-medium text-body shrink-0"
                >
                  {{ getInitials(user) }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-sm">
                    <p class="text-body-sm font-medium truncate">
                      {{ user.firstName }} {{ user.lastName }}
                    </p>
                    <div class="relative shrink-0">
                      <button
                        type="button"
                        (click)="toggleDropdown($event, user.id)"
                        class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-canvas-soft transition-colors text-body"
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                          <path
                            d="M6 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm6 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                          />
                        </svg>
                      </button>
                      @if (openDropdown() === user.id) {
                        <div
                          class="absolute right-0 top-full mt-xs w-44 bg-canvas rounded-xl border border-surface-pressed shadow-lg z-10 py-xs"
                          (click)="$event.stopPropagation()"
                        >
                          <button
                            type="button"
                            (click)="openDropdown.set(null); viewUser(user.id)"
                            [disabled]="loadingDetailId() === user.id"
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
                          <button
                            type="button"
                            (click)="openDropdown.set(null); deleteUser(user.id)"
                            [disabled]="user.id === currentUserId || deletingId() === user.id"
                            class="flex items-center gap-md w-full px-lg py-md text-body-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                          >
                            <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 shrink-0">
                              <path
                                fill-rule="evenodd"
                                d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482 41.03 41.03 0 0 0-2.365-.298V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                                clip-rule="evenodd"
                              />
                            </svg>
                            Eliminar
                          </button>
                        </div>
                      }
                    </div>
                  </div>
                  <p class="text-body-xs text-body truncate mt-xxs">{{ user.email }}</p>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-md mt-lg">
                <div>
                  <p class="text-body-xs text-mute">Rol</p>
                  <select
                    class="filter-input mt-xxs"
                    [ngModel]="user.role"
                    (ngModelChange)="onRoleChange(user.id, $event); $event.stopPropagation()"
                    [disabled]="user.id === currentUserId || savingRoleId() === user.id"
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                    <option value="warehouse">Warehouse</option>
                    <option value="delivery">Delivery</option>
                  </select>
                </div>
                <div>
                  <p class="text-body-xs text-mute">Creado</p>
                  <p class="text-body-sm text-body">{{ user.createdAt | date: 'dd/MM/yyyy' }}</p>
                </div>
              </div>
            </div>
          } @empty {
            <div
              class="px-xl py-2xl text-center text-body text-body-sm bg-canvas rounded-xl border border-surface-pressed"
            >
              No se encontraron usuarios
            </div>
          }
        </div>
        </div>

        <!-- Pagination -->
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

      <!-- Create user modal -->
      <app-modal
        [open]="createOpen()"
        title="Nuevo usuario"
        size="form"
        testId="create-user-modal"
        (closed)="closeCreate()"
      >
        <div class="flex flex-col gap-md">
          @if (createError()) {
            <p class="form-error" data-testid="create-user-error">{{ createError() }}</p>
          }
          <div>
            <label class="form-label" for="create-first-name">Nombre *</label>
            <input
              id="create-first-name"
              class="form-input"
              [(ngModel)]="createFirstName"
              data-testid="create-user-firstname"
            />
          </div>
          <div>
            <label class="form-label" for="create-last-name">Apellido *</label>
            <input
              id="create-last-name"
              class="form-input"
              [(ngModel)]="createLastName"
              data-testid="create-user-lastname"
            />
          </div>
          <div>
            <label class="form-label" for="create-email">Email *</label>
            <input
              id="create-email"
              type="email"
              class="form-input"
              [(ngModel)]="createEmail"
              data-testid="create-user-email"
            />
          </div>
          <div>
            <label class="form-label" for="create-phone">Teléfono</label>
            <input
              id="create-phone"
              class="form-input"
              [(ngModel)]="createPhone"
              data-testid="create-user-phone"
            />
          </div>
          <div>
            <label class="form-label" for="create-password">Contraseña *</label>
            <input
              id="create-password"
              type="password"
              class="form-input"
              [(ngModel)]="createPassword"
              data-testid="create-user-password"
            />
            <p class="form-hint">
              Mínimo 8 caracteres, con al menos una letra y un número.
            </p>
          </div>
          <div>
            <label class="form-label" for="create-role">Rol *</label>
            <select
              id="create-role"
              class="form-input"
              [(ngModel)]="createRole"
              data-testid="create-user-role"
            >
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
              <option value="warehouse">Warehouse</option>
              <option value="delivery">Delivery</option>
            </select>
          </div>
          <div>
            <label class="form-label" for="create-branch">Sucursal (staff)</label>
            <select
              id="create-branch"
              class="form-input"
              [(ngModel)]="createBranchId"
              data-testid="create-user-branch"
            >
              <option value="">Global (sin sucursal)</option>
              @for (branch of branchService.branches(); track branch.id) {
                <option [value]="branch.id">{{ branch.name }}</option>
              }
            </select>
            <p class="form-hint">Aplica a usuarios de bodega y delivery.</p>
          </div>
        </div>

        <div modalFooter>
          <button
            type="button"
            class="btn-secondary"
            (click)="closeCreate()"
            [disabled]="isCreating()"
            data-testid="create-user-cancel"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="btn-primary"
            (click)="submitCreate()"
            [disabled]="isCreating()"
            data-testid="create-user-submit"
          >
            @if (isCreating()) {
              <span class="btn-spinner"></span>
            } @else {
              Crear usuario
            }
          </button>
        </div>
      </app-modal>

      <!-- User detail modal -->
      <app-modal
        [open]="selectedUser() !== null"
        [title]="
          selectedUser()?.user
            ? selectedUser()!.user.firstName + ' ' + selectedUser()!.user.lastName
            : 'Detalle de Usuario'
        "
        size="xl"
        testId="user-detail-modal"
        (closed)="closeDetail()"
      >
        @if (selectedUser(); as detail) {
          <div class="user-detail-layout" data-testid="user-detail">
            <!-- Left column -->
            <div class="user-detail-left">
              <!-- Profile -->
              <div class="flex items-center gap-xl mb-xl">
                <div
                  class="w-14 h-14 rounded-full bg-canvas-soft flex items-center justify-center text-display-sm font-bold text-body shrink-0"
                >
                  {{ detail.user.firstName.charAt(0) }}{{ detail.user.lastName.charAt(0) }}
                </div>
                <div>
                  <p class="text-body-lg font-bold">
                    {{ detail.user.firstName }} {{ detail.user.lastName }}
                  </p>
                  <p class="text-body-sm text-body">{{ detail.user.email }}</p>
                  @if (detail.user.phone) {
                    <p class="text-caption text-mute">{{ detail.user.phone }}</p>
                  }
                </div>
              </div>

              <!-- KPIs -->
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-md mb-xl">
                <div class="bg-canvas-soft rounded-xl p-lg text-center">
                  <p class="text-body-xl font-bold text-ink" data-testid="user-stat-total">
                    {{ detail.stats.totalOrders }}
                  </p>
                  <p class="text-caption text-body">Pedidos</p>
                </div>
                <div class="bg-canvas-soft rounded-xl p-lg text-center">
                  <p
                    class="text-body-xl font-bold"
                    style="color: var(--color-primary)"
                    data-testid="user-stat-spent"
                  >
                    {{ detail.stats.totalSpent | currency }}
                  </p>
                  <p class="text-caption text-body">Gastado</p>
                </div>
                <div class="bg-canvas-soft rounded-xl p-lg text-center">
                  <p
                    class="text-body-xl font-bold"
                    style="color: var(--color-accent)"
                    data-testid="user-stat-pending"
                  >
                    {{ detail.stats.pendingOrders }}
                  </p>
                  <p class="text-caption text-body">Pendientes</p>
                </div>
                <div class="bg-canvas-soft rounded-xl p-lg text-center">
                  <p
                    class="text-body-xl font-bold"
                    style="color: #22c55e"
                    data-testid="user-stat-delivered"
                  >
                    {{ detail.stats.deliveredOrders }}
                  </p>
                  <p class="text-caption text-body">Entregados</p>
                </div>
                <div class="bg-canvas-soft rounded-xl p-lg text-center">
                  <p class="text-body-xl font-bold text-red-500" data-testid="user-stat-cancelled">
                    {{ detail.stats.cancelledOrders }}
                  </p>
                  <p class="text-caption text-body">Cancelados</p>
                </div>
                <div class="bg-canvas-soft rounded-xl p-lg text-center">
                  <p class="text-body-xl font-bold text-body">
                    {{ detail.user.createdAt | date: 'dd/MM/yy' }}
                  </p>
                  <p class="text-caption text-body">Registro</p>
                </div>
              </div>
            </div>

            <!-- Orders list -->
            <div>
              <h3 class="text-body-sm-strong mb-md">Pedidos ({{ detail.orders.length }})</h3>
              @if (detail.orders.length === 0) {
                <p class="text-body-sm text-body text-center py-xl">Sin pedidos</p>
              } @else {
                <div
                  class="divide-y divide-surface-pressed border border-surface-pressed rounded-lg"
                >
                  @for (order of detail.orders; track order.id) {
                    <button
                      type="button"
                      class="w-full px-lg py-md flex items-center justify-between hover:bg-canvas-soft/50 transition-colors text-left cursor-pointer"
                      (click)="viewOrder(order.id)"
                      [disabled]="loadingOrderId() === order.id"
                      [attr.data-testid]="'user-order-' + order.id"
                    >
                      <div class="min-w-0">
                        <p class="text-body-sm font-medium">{{ order.orderNumber }}</p>
                        <p class="text-caption text-mute">
                          {{ order.createdAt | date: 'dd/MM/yyyy HH:mm' }}
                        </p>
                      </div>
                      <div class="flex items-center gap-md shrink-0">
                        <app-order-status [status]="order.status" />
                        <span class="text-body-sm font-medium">{{
                          order.totalAmount | currency
                        }}</span>
                      </div>
                    </button>
                  }
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
            data-testid="close-user-detail"
          >
            Cerrar
          </button>
        </div>
      </app-modal>

      <!-- Order detail modal (reused from admin/orders) -->
      <app-modal
        [open]="selectedOrder() !== null"
        [title]="'Pedido ' + (selectedOrder()?.orderNumber ?? '')"
        size="xl"
        testId="order-detail-modal"
        (closed)="closeOrderDetail()"
      >
        @if (selectedOrder(); as order) {
          <div class="order-detail-layout" data-testid="order-detail">
            <!-- Timeline -->
            <div class="order-detail-left">
              <div>
                <h3 class="text-body-sm-strong mb-lg">Estado del Pedido</h3>
                <div class="modal-timeline">
                  @for (
                    step of modalTimelineSteps(order.status);
                    track step.status;
                    let i = $index;
                    let last = $last
                  ) {
                    <div class="modal-timeline-step-wrapper">
                      <div
                        class="modal-timeline-step"
                        [class.completed]="step.completed"
                        [class.active]="step.active"
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
                      </div>
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

              <!-- Info -->
              <div class="order-info-grid">
                <div class="order-info-item">
                  <span class="order-info-label">Total</span>
                  <span class="order-info-value order-info-value--bold">{{
                    order.totalAmount | currency
                  }}</span>
                </div>
                <div class="order-info-item">
                  <span class="order-info-label">Método de pago</span>
                  <span class="order-info-value">{{ order.paymentMethod || '—' }}</span>
                </div>
                <div class="order-info-item">
                  <span class="order-info-label">Creado</span>
                  <span class="order-info-value">{{
                    order.createdAt | date: 'dd/MM/yyyy HH:mm'
                  }}</span>
                </div>
                <div class="order-info-item">
                  <span class="order-info-label">Actualizado</span>
                  <span class="order-info-value">{{
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
                    <div class="px-lg py-md flex items-center gap-lg">
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
                        <p class="text-body-sm truncate">{{ item.productName }}</p>
                        <p class="text-body-sm text-body">
                          x{{ item.quantity }} @ {{ item.unitPrice | currency }}
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
            </div>

            <!-- Right column -->
            <div class="order-detail-right">
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
            </div>
          </div>
        }

        <div modalFooter>
          <button
            type="button"
            class="btn-secondary"
            (click)="closeOrderDetail()"
            data-testid="close-order-detail"
          >
            Cerrar
          </button>
        </div>
      </app-modal>
    </div>
  `,
  styles: `
    .user-detail-layout {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .user-detail-left {
      display: flex;
      flex-direction: column;
    }
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
  `,
})
export class AdminUsers implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);

  protected readonly users = signal<AdminUser[]>([]);
  protected readonly loading = signal(true);
  protected readonly page = signal(1);
  protected readonly total = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly savingRoleId = signal<string | null>(null);
  protected readonly deletingId = signal<string | null>(null);
  protected readonly openDropdown = signal<string | null>(null);
  protected readonly selectedUser = signal<AdminUserDetail | null>(null);
  protected readonly selectedOrder = signal<AdminOrderDetail | null>(null);
  protected readonly loadingDetailId = signal<string | null>(null);
  protected readonly loadingOrderId = signal<string | null>(null);
  protected readonly createOpen = signal(false);
  protected readonly isCreating = signal(false);
  protected readonly createError = signal('');
  protected createFirstName = '';
  protected createLastName = '';
  protected createEmail = '';
  protected createPhone = '';
  protected createPassword = '';
  protected createRole = 'customer';
  protected createBranchId = '';
  protected readonly branchService = inject(BranchService);
  protected sortField = '';
  protected sortOrder: 'ASC' | 'DESC' = 'DESC';
  protected searchTerm = '';
  protected filterRole = '';
  protected readonly currentUserId = this.readCurrentUserId();
  private searchTimeout?: ReturnType<typeof setTimeout>;
  ngOnInit(): void {
    this.branchService.load();
    this.loadUsers();
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page.set(1);
      this.loadUsers();
    }, 300);
  }

  onFilterChange(): void {
    this.page.set(1);
    this.loadUsers();
  }

  onSort(field: string): void {
    if (this.sortField === field) {
      this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortField = field;
      this.sortOrder = 'DESC';
    }
    this.page.set(1);
    this.loadUsers();
  }

  sortIcon(field: string): string {
    if (this.sortField !== field) return '';
    return this.sortOrder === 'ASC' ? ' ↑' : ' ↓';
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.loadUsers();
  }

  openCreate(): void {
    this.createFirstName = '';
    this.createLastName = '';
    this.createEmail = '';
    this.createPhone = '';
    this.createPassword = '';
    this.createRole = 'customer';
    this.createBranchId = '';
    this.createError.set('');
    this.createOpen.set(true);
  }

  closeCreate(): void {
    if (this.isCreating()) return;
    this.createOpen.set(false);
  }

  submitCreate(): void {
    const firstName = this.createFirstName.trim();
    const lastName = this.createLastName.trim();
    const email = this.createEmail.trim();
    const password = this.createPassword;

    if (!firstName || !lastName || !email || !password) {
      this.createError.set('Completá nombre, apellido, email y contraseña');
      return;
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,72}$/.test(password)) {
      this.createError.set(
        'La contraseña debe tener entre 8 y 72 caracteres, con al menos una letra y un número',
      );
      return;
    }

    this.isCreating.set(true);
    this.createError.set('');
    this.adminService
      .createUser({
        email,
        password,
        firstName,
        lastName,
        phone: this.createPhone.trim() || undefined,
        role: this.createRole,
        branchId: this.createBranchId || undefined,
      })
      .pipe(finalize(() => this.isCreating.set(false)))
      .subscribe({
        next: () => {
          this.createOpen.set(false);
          this.toast.success('Usuario creado');
          this.page.set(1);
          this.loadUsers();
        },
        error: (err) => {
          const message = err?.error?.message;
          const msg = Array.isArray(message)
            ? message.join(', ')
            : (message ?? 'No se pudo crear el usuario');
          this.createError.set(msg);
          this.toast.error(msg);
        },
      });
  }

  onRoleChange(userId: string, role: string): void {
    this.savingRoleId.set(userId);
    this.adminService
      .updateUserRole(userId, role)
      .pipe(finalize(() => this.savingRoleId.set(null)))
      .subscribe({
        next: (updated) => {
          this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u)));
          this.toast.success('Rol actualizado');
        },
        error: () => {
          this.toast.error('No se pudo actualizar el rol');
          this.loadUsers();
        },
      });
  }

  deleteUser(userId: string): void {
    this.deletingId.set(userId);
    this.openDropdown.set(null);
    this.adminService
      .deleteUser(userId)
      .pipe(finalize(() => this.deletingId.set(null)))
      .subscribe({
        next: () => {
          this.users.update((list) => list.filter((u) => u.id !== userId));
          this.total.update((t) => t - 1);
          this.toast.success('Usuario eliminado');
        },
        error: () => {
          this.toast.error('No se pudo eliminar el usuario');
        },
      });
  }

  getInitials(user: AdminUser): string {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }

  toggleDropdown(event: Event, id: string): void {
    event.stopPropagation();
    this.openDropdown.set(this.openDropdown() === id ? null : id);
  }

  viewUser(userId: string): void {
    this.openDropdown.set(null);
    this.loadingDetailId.set(userId);
    this.adminService
      .getFullUser(userId)
      .pipe(finalize(() => this.loadingDetailId.set(null)))
      .subscribe({
        next: (detail) => this.selectedUser.set(detail),
        error: () => this.toast.error('No se pudo cargar el detalle del usuario'),
      });
  }

  closeDetail(): void {
    this.selectedUser.set(null);
  }

  viewOrder(orderId: string): void {
    this.loadingOrderId.set(orderId);
    this.adminService
      .getOrder(orderId)
      .pipe(finalize(() => this.loadingOrderId.set(null)))
      .subscribe({
        next: (detail) => this.selectedOrder.set(detail),
        error: () => this.toast.error('No se pudo cargar el detalle del pedido'),
      });
  }

  closeOrderDetail(): void {
    this.selectedOrder.set(null);
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      processing: 'En preparación',
      shipped: 'Listo',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
      refunded: 'Reembolsado',
    };
    return map[status] ?? status;
  }

  modalTimelineSteps(currentStatus: string): ModalStep[] {
    const order = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentIdx = order.indexOf(currentStatus);
    if (currentIdx === -1) {
      return [
        {
          label: this.getStatusLabel(currentStatus),
          status: currentStatus,
          completed: false,
          active: true,
          clickable: false,
        },
      ];
    }
    return order.map((s, i) => ({
      label: this.getStatusLabel(s),
      status: s,
      completed: i < currentIdx,
      active: i === currentIdx,
      clickable: i <= currentIdx,
    }));
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.adminService
      .getUsers(this.page(), 10, this.searchTerm, this.filterRole, this.sortField, this.sortOrder)
      .subscribe({
        next: (res) => {
          this.users.set(res.data);
          this.total.set(res.total);
          this.totalPages.set(res.totalPages);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  private readCurrentUserId(): string {
    try {
      const raw = localStorage.getItem('market_user');
      return raw ? JSON.parse(raw).id : '';
    } catch {
      return '';
    }
  }
}
