import { Component, ElementRef, HostListener, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { finalize } from 'rxjs';
import {
  AdminService,
  AdminFlashSale,
  AdminProduct,
  AdminCategory,
} from '../../../core/services/admin.service';
import { Tag } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalComponent } from '../../../shared/ui/modal';
import { ConfirmDialogComponent } from '../../../shared/ui/confirm-dialog';

interface ProductSelection {
  productId: string;
  quantity: number;
}

interface FlashSaleForm {
  title: string;
  discountPercent: number;
  startTime: string;
  endTime: string;
  maxItems: number;
  isActive: boolean;
  selectedProducts: ProductSelection[];
}

const EMPTY_FORM: FlashSaleForm = {
  title: '',
  discountPercent: 10,
  startTime: '',
  endTime: '',
  maxItems: 6,
  isActive: true,
  selectedProducts: [],
};

@Component({
  selector: 'app-admin-flash-sales',
  imports: [FormsModule, CurrencyPipe, DatePipe, ModalComponent, ConfirmDialogComponent],
  template: `
    <div data-testid="admin-flash-sales">
      <div class="flex flex-col gap-lg mb-2xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-body-2xl font-bold" data-testid="flash-sales-title">Ofertas Flash</h1>
          <span class="text-body-sm text-body">{{ total() }} ofertas</span>
        </div>
        <button
          type="button"
          class="btn-primary"
          (click)="openCreate()"
          data-testid="create-flash-sale-btn"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
            <path
              d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"
            />
          </svg>
          Nueva oferta flash
        </button>
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
            data-testid="flash-sales-table-header"
          >
            <div class="col-span-3">Título</div>
            <div class="col-span-2">Descuento</div>
            <div class="col-span-2">Inicio</div>
            <div class="col-span-2">Fin</div>
            <div class="col-span-1">Estado</div>
            <div class="col-span-1">Items</div>
            <div class="col-span-1 text-right">Acciones</div>
          </div>
          <div class="border border-surface-pressed border-t-0 rounded-b-xl">
            @for (sale of flashSales(); track sale.id) {
              <div
                class="grid grid-cols-12 gap-4 items-center px-lg py-4 border-b border-surface-pressed last:border-b-0 hover:bg-canvas-soft/50"
                [attr.data-testid]="'flash-sale-row-' + sale.id"
              >
                <div class="col-span-3 text-body-sm font-medium truncate">{{ sale.title }}</div>
                <div class="col-span-2">
                  <span
                    class="inline-flex items-center px-md py-xxs rounded-pill text-body-sm font-medium bg-orange-50 text-orange-700"
                  >
                    {{ sale.discountPercent }}% OFF
                  </span>
                </div>
                <div class="col-span-2 text-body-sm text-body">
                  {{ sale.startTime | date: 'dd/MM/yyyy HH:mm' }}
                </div>
                <div class="col-span-2 text-body-sm text-body">
                  {{ sale.endTime | date: 'dd/MM/yyyy HH:mm' }}
                </div>
                <div class="col-span-1">
                  @if (isExpired(sale)) {
                    <span
                      class="inline-flex items-center px-md py-xxs rounded-pill text-body-xs font-medium bg-gray-100 text-gray-600"
                      >Finalizada</span
                    >
                  } @else if (sale.isActive) {
                    <span
                      class="inline-flex items-center px-md py-xxs rounded-pill text-body-xs font-medium bg-green-50 text-green-700"
                      >Activa</span
                    >
                  } @else {
                    <span
                      class="inline-flex items-center px-md py-xxs rounded-pill text-body-xs font-medium bg-canvas-soft text-body"
                      >Inactiva</span
                    >
                  }
                </div>
                <div class="col-span-1 text-body-sm">{{ sale.itemCount }}</div>
                <div class="col-span-1 flex items-center justify-end gap-sm">
                  <button
                    type="button"
                    class="admin-icon-btn"
                    (click)="openEdit(sale)"
                    title="Editar"
                    [attr.data-testid]="'edit-flash-sale-' + sale.id"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                      <path
                        d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="admin-icon-btn text-red-500 hover:text-red-700"
                    (click)="confirmDelete(sale)"
                    title="Eliminar"
                    [attr.data-testid]="'delete-flash-sale-' + sale.id"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                      <path
                        fill-rule="evenodd"
                        d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            } @empty {
              <div class="px-xl py-2xl text-center text-body text-body-sm">
                No hay ofertas flash creadas
              </div>
            }
          </div>
        </div>

        <!-- Mobile card list -->
        <div class="md:hidden flex flex-col gap-md">
          @for (sale of flashSales(); track sale.id) {
            <div
              class="bg-canvas rounded-xl border border-surface-pressed p-lg"
              [attr.data-testid]="'flash-sale-card-' + sale.id"
            >
              <div class="flex items-start justify-between gap-md">
                <div class="min-w-0">
                  <p class="text-body-sm font-medium">{{ sale.title }}</p>
                  <span
                    class="inline-flex items-center px-md py-xxs rounded-pill text-body-xs font-medium mt-xxs bg-orange-50 text-orange-700"
                  >
                    {{ sale.discountPercent }}% OFF
                  </span>
                </div>
                <div class="flex gap-sm shrink-0">
                  <button
                    type="button"
                    class="admin-icon-btn"
                    (click)="openEdit(sale)"
                    title="Editar"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                      <path
                        d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="admin-icon-btn text-red-500"
                    (click)="confirmDelete(sale)"
                    title="Eliminar"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                      <path
                        fill-rule="evenodd"
                        d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div class="flex items-center justify-between mt-lg">
                <div>
                  <p class="text-body-xs text-mute">Items</p>
                  <p class="text-body-sm font-medium">{{ sale.itemCount }}</p>
                </div>
                <div class="text-right">
                  <p class="text-body-xs text-mute">Fin</p>
                  <p class="text-body-sm text-body">{{ sale.endTime | date: 'dd/MM/yyyy' }}</p>
                </div>
                <div class="text-right">
                  @if (isExpired(sale)) {
                    <span class="text-body-xs text-mute">Finalizada</span>
                  } @else if (sale.isActive) {
                    <span class="text-body-xs text-green-600">Activa</span>
                  } @else {
                    <span class="text-body-xs text-mute">Inactiva</span>
                  }
                </div>
              </div>
            </div>
          } @empty {
            <div
              class="px-xl py-2xl text-center text-body text-body-sm bg-canvas rounded-xl border border-surface-pressed"
            >
              No hay ofertas flash creadas
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

      <!-- Create/Edit Modal -->
      <app-modal
        [open]="formOpen()"
        [title]="editingId() ? 'Editar oferta flash' : 'Nueva oferta flash'"
        size="lg"
        testId="flash-sale-form-modal"
        (closed)="closeForm()"
      >
        <div class="flash-sale-form" data-testid="flash-sale-form">
          <div class="form-group">
            <label class="form-label" for="flash-title">Título</label>
            <input
              id="flash-title"
              type="text"
              class="form-input"
              [ngModel]="form().title"
              (ngModelChange)="patch({ title: $event })"
              placeholder="Ej: Ofertas de fin de semana"
              data-testid="flash-title-input"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="flash-discount">Descuento (%)</label>
              <input
                id="flash-discount"
                type="number"
                class="form-input"
                [ngModel]="form().discountPercent"
                (ngModelChange)="patch({ discountPercent: +$event })"
                min="1"
                max="100"
                data-testid="flash-discount-input"
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="flash-max-items">Máx. productos a mostrar</label>
              <input
                id="flash-max-items"
                type="number"
                class="form-input"
                [ngModel]="form().maxItems"
                (ngModelChange)="patch({ maxItems: +$event })"
                min="1"
                max="20"
                data-testid="flash-max-items-input"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="flash-start">Fecha/hora inicio</label>
              <input
                id="flash-start"
                type="datetime-local"
                class="form-input"
                [ngModel]="form().startTime"
                (ngModelChange)="patch({ startTime: $event })"
                data-testid="flash-start-input"
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="flash-end">Fecha/hora fin</label>
              <input
                id="flash-end"
                type="datetime-local"
                class="form-input"
                [ngModel]="form().endTime"
                (ngModelChange)="patch({ endTime: $event })"
                data-testid="flash-end-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Estado</label>
            <div class="flex items-center gap-md">
              <button
                type="button"
                class="toggle-btn"
                [class.toggle-active]="form().isActive"
                (click)="patch({ isActive: !form().isActive })"
                data-testid="flash-active-toggle"
              >
                <div class="toggle-dot"></div>
              </button>
              <span class="text-body-sm text-body">{{
                form().isActive ? 'Activa' : 'Inactiva'
              }}</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label"
              >Productos ({{ form().selectedProducts.length }} seleccionados)</label
            >
            <div class="product-search-row">
              <input
                type="text"
                class="form-input product-filter-input"
                placeholder="Buscar productos..."
                [(ngModel)]="productSearch"
                (ngModelChange)="filterProducts()"
                data-testid="product-search-input"
              />
              <div class="filter-dropdown-wrap">
                <button
                  type="button"
                  class="btn-filter"
                  [class.active]="filterCategoryId || filterTagId"
                  (click)="filtersOpen = !filtersOpen"
                  data-testid="open-filters-btn"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                    <path
                      fill-rule="evenodd"
                      d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  Filtros
                  @if (filterCategoryId || filterTagId) {
                    <span class="filter-badge"></span>
                  }
                </button>
                @if (filtersOpen) {
                  <div class="filter-dropdown" data-testid="filter-dropdown">
                    <div class="filter-dropdown-field">
                      <label class="filter-dropdown-label">Categoría</label>
                      <select
                        class="form-input"
                        [(ngModel)]="filterCategoryId"
                        (ngModelChange)="filterProducts()"
                        data-testid="filter-category-select"
                      >
                        <option value="">Todas</option>
                        @for (cat of categories(); track cat.id) {
                          <option [value]="cat.id">{{ cat.name }}</option>
                        }
                      </select>
                    </div>
                    <div class="filter-dropdown-field">
                      <label class="filter-dropdown-label">Tag</label>
                      <select
                        class="form-input"
                        [(ngModel)]="filterTagId"
                        (ngModelChange)="filterProducts()"
                        data-testid="filter-tag-select"
                      >
                        <option value="">Todos</option>
                        @for (tag of tags(); track tag.id) {
                          <option [value]="tag.id">{{ tag.name }}</option>
                        }
                      </select>
                    </div>
                    @if (filterCategoryId || filterTagId) {
                      <button
                        type="button"
                        class="btn-clear-filter"
                        (click)="clearFilters()"
                        data-testid="clear-filters-btn"
                      >
                        Limpiar filtros
                      </button>
                    }
                  </div>
                }
              </div>
            </div>
            <div class="product-select-grid" data-testid="product-select-grid">
              @for (product of filteredProducts(); track product.id) {
                <div
                  class="product-select-item"
                  [class.selected]="isProductSelected(product.id)"
                  [attr.data-testid]="'product-option-' + product.id"
                >
                  <div class="product-select-main" (click)="toggleProduct(product.id)">
                    <div class="product-select-img">
                      @if (product.featuredImage || product.images?.[0]) {
                        <img
                          [src]="product.featuredImage || product.images?.[0]"
                          [alt]="product.name"
                          loading="lazy"
                          decoding="async"
                        />
                      } @else {
                        <div class="img-placeholder">{{ product.name.charAt(0) }}</div>
                      }
                    </div>
                    <div class="product-select-info">
                      <p class="text-body-sm truncate">{{ product.name }}</p>
                      <p class="text-body-xs text-body">
                        {{ product.price | currency }} · Stock: {{ product.stock }}
                      </p>
                    </div>
                    @if (isProductSelected(product.id)) {
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        class="w-5 h-5 text-primary shrink-0"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    }
                  </div>
                  @if (isProductSelected(product.id)) {
                    <div class="product-qty-row">
                      <label class="text-body-xs text-body">Cantidad en oferta:</label>
                      <input
                        type="number"
                        class="form-input qty-input"
                        [ngModel]="getProductQuantity(product.id)"
                        (ngModelChange)="setProductQuantity(product.id, +$event)"
                        [max]="product.stock"
                        min="1"
                        [attr.data-testid]="'product-qty-' + product.id"
                      />
                      <span class="text-body-xs text-mute">/ {{ product.stock }}</span>
                    </div>
                  }
                </div>
              } @empty {
                <p class="text-body-sm text-body text-center py-xl col-span-full">
                  No se encontraron productos
                </p>
              }
            </div>
          </div>

          @if (formError()) {
            <p class="form-error" data-testid="form-error">{{ formError() }}</p>
          }
        </div>

        <div modalFooter>
          <button
            type="button"
            class="btn-secondary"
            (click)="closeForm()"
            data-testid="cancel-form"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="btn-primary"
            (click)="saveFlashSale()"
            [disabled]="isSaving()"
            data-testid="save-flash-sale"
          >
            @if (isSaving()) {
              <span class="btn-spinner"></span> Guardando...
            } @else {
              Guardar
            }
          </button>
        </div>
      </app-modal>

      <!-- Delete Confirmation -->
      <app-confirm-dialog
        [open]="deleteId() !== null"
        [title]="'Eliminar oferta flash'"
        [message]="'¿Estás seguro de que deseas eliminar esta oferta flash? Esta acción no se puede deshacer.'"
        [loading]="isDeleting()"
        [variant]="'danger'"
        testId="delete-confirm-dialog"
        (confirmed)="confirmDeleteAction()"
        (cancelled)="deleteId.set(null)"
      />
    </div>
  `,
  styles: `
    .flash-sale-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    @media (max-width: 640px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }

    .toggle-btn {
      width: 44px;
      height: 24px;
      border-radius: 12px;
      background-color: var(--color-surface-pressed);
      border: none;
      cursor: pointer;
      position: relative;
      transition: background-color 0.2s ease;
      padding: 0;
    }

    .toggle-btn.toggle-active {
      background-color: var(--color-primary);
    }

    .toggle-dot {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: white;
      position: absolute;
      top: 2px;
      left: 2px;
      transition: transform 0.2s ease;
    }

    .toggle-btn.toggle-active .toggle-dot {
      transform: translateX(20px);
    }

    .product-select-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 8px;
      max-height: 350px;
      overflow-y: auto;
      border: 1px solid var(--color-surface-pressed);
      border-radius: 8px;
      padding: 8px;
    }

    .product-select-item {
      border: 2px solid transparent;
      border-radius: 8px;
      transition: all 0.15s ease;
    }

    .product-select-item.selected {
      border-color: var(--color-primary);
      background-color: rgba(28, 128, 87, 0.05);
    }

    .product-select-main {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      cursor: pointer;
    }

    .product-select-main:hover {
      background-color: var(--color-canvas-soft);
      border-radius: 6px;
    }

    .product-select-img {
      width: 40px;
      height: 40px;
      border-radius: 6px;
      overflow: hidden;
      flex-shrink: 0;
      background: var(--color-canvas-softer);
    }

    .product-select-img img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .product-select-info {
      flex: 1;
      min-width: 0;
    }

    .img-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: var(--color-mute);
    }

    .product-qty-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 8px 8px;
    }

    .qty-input {
      width: 70px;
      text-align: center;
      padding: 4px 6px;
      font-size: 13px;
    }

    .product-search-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .product-filter-input {
      flex: 1;
      min-width: 0;
    }

    .filter-dropdown-wrap {
      position: relative;
    }

    .btn-filter {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      font-size: 13px;
      font-weight: 500;
      border: 1px solid var(--color-surface-pressed);
      border-radius: 999px;
      background: var(--color-canvas);
      color: var(--color-body);
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .btn-filter:hover {
      background: var(--color-canvas-soft);
      border-color: var(--color-mute);
    }

    .btn-filter.active {
      border-color: var(--color-primary);
      color: var(--color-primary);
      background: rgba(28, 128, 87, 0.05);
    }

    .filter-badge {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--color-primary);
      flex-shrink: 0;
    }

    .filter-dropdown {
      position: absolute;
      right: 0;
      top: calc(100% + 6px);
      background: var(--color-canvas);
      border: 1px solid var(--color-surface-pressed);
      border-radius: 12px;
      padding: 12px;
      min-width: 220px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      z-index: 50;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .filter-dropdown-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .filter-dropdown-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--color-body);
    }

    .btn-clear-filter {
      font-size: 12px;
      color: var(--color-body);
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px 0;
      text-align: left;
      transition: color 0.15s ease;
    }

    .btn-clear-filter:hover {
      color: var(--color-primary);
    }
  `,
})
export class AdminFlashSales implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);

  protected readonly flashSales = signal<AdminFlashSale[]>([]);
  protected readonly loading = signal(true);
  protected readonly page = signal(1);
  protected readonly total = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly form = signal<FlashSaleForm>({ ...EMPTY_FORM });
  protected readonly formOpen = signal(false);
  protected readonly formError = signal('');
  protected readonly editingId = signal<string | null>(null);
  protected readonly isSaving = signal(false);
  protected readonly isDeleting = signal(false);
  protected readonly deleteId = signal<string | null>(null);

  protected readonly allProducts = signal<AdminProduct[]>([]);
  protected readonly filteredProducts = signal<AdminProduct[]>([]);
  protected readonly categories = signal<AdminCategory[]>([]);
  protected readonly tags = signal<Tag[]>([]);
  protected productSearch = '';
  protected filterCategoryId = '';
  protected filterTagId = '';
  protected filtersOpen = false;

  private readonly elRef = inject(ElementRef);

  ngOnInit(): void {
    this.loadFlashSales();
    this.loadProducts();
    this.loadCategories();
    this.loadTags();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.filtersOpen) {
      const target = event.target as HTMLElement;
      if (!this.elRef.nativeElement.querySelector('.filter-dropdown-wrap')?.contains(target)) {
        this.filtersOpen = false;
      }
    }
  }

  private loadFlashSales(): void {
    this.loading.set(true);
    this.adminService.getFlashSales(this.page(), 10).subscribe({
      next: (res) => {
        this.flashSales.set(res.data);
        this.total.set(res.total);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadProducts(): void {
    this.adminService.getProducts(1, 200).subscribe({
      next: (res) => {
        this.allProducts.set(res.data);
        this.filteredProducts.set(res.data);
      },
    });
  }

  private loadCategories(): void {
    this.adminService.getCategories(1, 100).subscribe({
      next: (res) => this.categories.set(res.data),
    });
  }

  private loadTags(): void {
    this.adminService.getTags(1, 100).subscribe({
      next: (res) => this.tags.set(res.data),
    });
  }

  filterProducts(): void {
    const term = this.productSearch.toLowerCase();
    let result = this.allProducts();

    if (term) {
      result = result.filter(
        (p) => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term),
      );
    }

    if (this.filterCategoryId) {
      result = result.filter((p) => p.categoryId === this.filterCategoryId);
    }

    if (this.filterTagId) {
      result = result.filter((p) => p.tags?.some((t) => t.id === this.filterTagId));
    }

    this.filteredProducts.set(result);
  }

  clearFilters(): void {
    this.productSearch = '';
    this.filterCategoryId = '';
    this.filterTagId = '';
    this.filteredProducts.set(this.allProducts());
  }

  isProductSelected(id: string): boolean {
    return this.form().selectedProducts.some((p) => p.productId === id);
  }

  getProductQuantity(id: string): number {
    return this.form().selectedProducts.find((p) => p.productId === id)?.quantity ?? 1;
  }

  setProductQuantity(id: string, quantity: number): void {
    this.form.update((f) => ({
      ...f,
      selectedProducts: f.selectedProducts.map((p) =>
        p.productId === id ? { ...p, quantity: Math.max(1, quantity) } : p,
      ),
    }));
  }

  toggleProduct(id: string): void {
    const current = this.form().selectedProducts;
    if (current.some((p) => p.productId === id)) {
      this.patch({ selectedProducts: current.filter((p) => p.productId !== id) });
    } else {
      this.patch({ selectedProducts: [...current, { productId: id, quantity: 1 }] });
    }
  }

  patch(values: Partial<FlashSaleForm>): void {
    this.form.update((f) => ({ ...f, ...values }));
  }

  openCreate(): void {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    this.form.set({
      ...EMPTY_FORM,
      startTime: this.toLocalDateTime(now),
      endTime: this.toLocalDateTime(tomorrow),
    });
    this.editingId.set(null);
    this.formError.set('');
    this.filtersOpen = false;
    this.clearFilters();
    this.formOpen.set(true);
  }

  openEdit(sale: AdminFlashSale): void {
    this.editingId.set(sale.id);
    this.form.set({
      title: sale.title,
      discountPercent: sale.discountPercent,
      startTime: this.toLocalDateTime(new Date(sale.startTime)),
      endTime: this.toLocalDateTime(new Date(sale.endTime)),
      maxItems: sale.maxItems,
      isActive: sale.isActive,
      selectedProducts: sale.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    });
    this.formError.set('');
    this.filtersOpen = false;
    this.clearFilters();
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editingId.set(null);
    this.formError.set('');
    this.filtersOpen = false;
    this.clearFilters();
  }

  saveFlashSale(): void {
    const f = this.form();
    if (!f.title.trim()) {
      this.formError.set('El título es requerido');
      return;
    }
    if (!f.startTime || !f.endTime) {
      this.formError.set('Las fechas de inicio y fin son requeridas');
      return;
    }
    if (new Date(f.startTime) >= new Date(f.endTime)) {
      this.formError.set('La fecha de inicio debe ser anterior a la fecha de fin');
      return;
    }
    if (f.selectedProducts.length === 0) {
      this.formError.set('Debe seleccionar al menos un producto');
      return;
    }

    for (const sp of f.selectedProducts) {
      const product = this.allProducts().find((p) => p.id === sp.productId);
      if (product && sp.quantity > product.stock) {
        this.formError.set(
          `La cantidad de "${product.name}" (${sp.quantity}) excede el stock disponible (${product.stock})`,
        );
        return;
      }
      if (sp.quantity < 1) {
        this.formError.set(`La cantidad de "${product?.name ?? 'producto'}" debe ser al menos 1`);
        return;
      }
    }

    this.isSaving.set(true);
    this.formError.set('');

    const payload = {
      title: f.title.trim(),
      discountPercent: f.discountPercent,
      startTime: new Date(f.startTime).toISOString(),
      endTime: new Date(f.endTime).toISOString(),
      maxItems: f.maxItems,
      isActive: f.isActive,
      products: f.selectedProducts.map((sp) => ({
        productId: sp.productId,
        quantity: sp.quantity,
      })),
    };

    const id = this.editingId();
    const request = id
      ? this.adminService.updateFlashSale(id, payload)
      : this.adminService.createFlashSale(payload);

    request.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.formOpen.set(false);
        this.editingId.set(null);
        this.form.set({ ...EMPTY_FORM });
        this.loadFlashSales();
        this.toast.success(id ? 'Oferta flash actualizada' : 'Oferta flash creada');
      },
      error: (err) => {
        const msg = err?.error?.message;
        this.formError.set(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Error al guardar'));
      },
    });
  }

  confirmDelete(sale: AdminFlashSale): void {
    this.deleteId.set(sale.id);
  }

  confirmDeleteAction(): void {
    const id = this.deleteId();
    if (!id) return;
    this.isDeleting.set(true);
    this.adminService
      .deleteFlashSale(id)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: () => {
          this.flashSales.update((list) => list.filter((s) => s.id !== id));
          this.total.update((t) => t - 1);
          this.deleteId.set(null);
          this.toast.success('Oferta flash eliminada');
        },
        error: () => {
          this.toast.error('No se pudo eliminar la oferta flash');
          this.deleteId.set(null);
        },
      });
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.loadFlashSales();
  }

  isExpired(sale: AdminFlashSale): boolean {
    return new Date(sale.endTime) < new Date();
  }

  private toLocalDateTime(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d}T${h}:${min}`;
  }
}
