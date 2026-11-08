import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { AdminService, AdminProduct, AdminCategory } from '../../../core/services/admin.service';
import { Tag } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  StockSubscription,
  StockSubscriptionService,
} from '../../../core/services/stock-subscription.service';
import { ModalComponent } from '../../../shared/ui/modal';
import { ImageCropperModalComponent } from '../../../shared/ui/image-cropper-modal';
import { ConfirmDialogComponent } from '../../../shared/ui/confirm-dialog';

interface ProductForm {
  name: string;
  slug: string;
  sku: string;
  price: number;
  costPrice: number | null;
  stock: number;
  categoryId: string;
  tagIds: string[];
  description: string;
  images: string[];
  featuredIndex: number;
  isActive: boolean;
  hasDiscount: boolean;
  discountMode: 'percent' | 'fixed';
  discountPercent: number | null;
  discountPrice: number | null;
}

const EMPTY_FORM: ProductForm = {
  name: '',
  slug: '',
  sku: '',
  price: 0,
  costPrice: null,
  stock: 0,
  categoryId: '',
  tagIds: [],
  description: '',
  images: [],
  featuredIndex: 0,
  isActive: true,
  hasDiscount: false,
  discountMode: 'percent',
  discountPercent: null,
  discountPrice: null,
};

const MARGIN_PRESETS = [10, 15, 30, 50, 100];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

@Component({
  selector: 'app-admin-products',
  imports: [
    FormsModule,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    ModalComponent,
    ImageCropperModalComponent,
    ConfirmDialogComponent,
  ],
  styles: `
    .image-gallery-grid {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-md);
      padding: var(--spacing-lg);
      border: 1px dashed var(--color-surface-pressed);
      border-radius: var(--radius-lg);
      background-color: var(--color-canvas-softer);
      min-height: 80px;
    }

    .image-thumb-wrapper {
      position: relative;
      width: 80px;
      height: 80px;
      border-radius: var(--radius-lg);
      overflow: hidden;
      border: 2px solid var(--color-surface-pressed);
      cursor: pointer;
      transition: border-color 0.2s ease;
    }

    .image-thumb-wrapper:hover {
      border-color: var(--color-mute);
    }

    .image-thumb-wrapper.featured {
      border-color: var(--color-primary);
    }

    .image-thumb {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .image-thumb-actions {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: flex-start;
      justify-content: flex-end;
      gap: 2px;
      padding: 2px;
      background: linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0.3) 0%,
        transparent 40%,
        transparent 60%,
        rgba(0, 0, 0, 0.3) 100%
      );
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .image-thumb-wrapper:hover .image-thumb-actions {
      opacity: 1;
    }

    .thumb-action-btn {
      width: 22px;
      height: 22px;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      cursor: pointer;
      transition: background-color 0.15s ease;
      color: white;
      padding: 0;
    }

    .thumb-action-btn.featured-btn {
      background-color: rgba(255, 255, 255, 0.3);
    }

    .thumb-action-btn.featured-btn:hover {
      background-color: var(--color-accent);
      color: var(--color-ink);
    }

    .thumb-action-btn.remove-btn {
      background-color: rgba(255, 255, 255, 0.3);
    }

    .thumb-action-btn.remove-btn:hover {
      background-color: #dc2626;
    }

    .featured-badge {
      position: absolute;
      bottom: 2px;
      left: 2px;
      right: 2px;
      font-size: 9px;
      font-weight: 600;
      text-align: center;
      background-color: var(--color-primary);
      color: var(--color-on-primary);
      border-radius: var(--radius-md);
      padding: 1px 4px;
      line-height: 14px;
    }

    .image-add-btn {
      width: 80px;
      height: 80px;
      border-radius: var(--radius-lg);
      border: 2px dashed var(--color-surface-pressed);
      background-color: var(--color-canvas);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      cursor: pointer;
      color: var(--color-mute);
      transition:
        border-color 0.2s ease,
        color 0.2s ease;
    }

    .image-add-btn:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }

    .pricing-card {
      background-color: var(--color-canvas);
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-lg);
      padding: var(--spacing-xl);
    }

    .pricing-helper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) var(--spacing-md);
      background-color: var(--color-canvas-softer);
      border-radius: var(--radius-md);
    }

    .final-price-hero {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
      background-color: color-mix(in srgb, var(--color-primary) 7%, transparent);
      border: 1px solid color-mix(in srgb, var(--color-primary) 25%, transparent);
      border-radius: var(--radius-lg);
      padding: var(--spacing-md) var(--spacing-lg);
    }

    .final-price-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--color-primary);
      line-height: 1.2;
    }

    .unprofitable-warning {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-sm);
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: var(--radius-lg);
      padding: var(--spacing-md) var(--spacing-lg);
      color: #991b1b;
    }

    .segmented-control {
      display: inline-flex;
      border-radius: var(--radius-pill);
      border: 1px solid var(--color-surface-pressed);
      overflow: hidden;
      background-color: var(--color-canvas);
    }

    .segmented-btn {
      padding: var(--spacing-xs) var(--spacing-lg);
      font-size: 13px;
      font-weight: 500;
      border: none;
      cursor: pointer;
      background-color: transparent;
      color: var(--color-body);
      transition: all 0.15s ease;
    }

    .segmented-btn.active {
      background-color: var(--color-primary);
      color: var(--color-on-primary);
      border-radius: var(--radius-pill);
    }

    .segmented-btn:not(.active):hover {
      background-color: var(--color-canvas-soft);
    }

    .margin-presets {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      flex-wrap: wrap;
    }

    .margin-preset-btn {
      padding: var(--spacing-xxs) var(--spacing-sm);
      border-radius: var(--radius-pill);
      font-size: 12px;
      font-weight: 500;
      border: 1px solid var(--color-surface-pressed);
      background-color: var(--color-canvas);
      color: var(--color-body);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .margin-preset-btn:hover:not(:disabled) {
      border-color: var(--color-primary);
      color: var(--color-primary);
      background-color: var(--color-canvas-soft);
    }

    .margin-preset-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  `,
  template: `
    <div data-testid="admin-products">
      <!-- Header -->
      <div class="flex flex-col gap-lg mb-2xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-body-2xl font-bold" data-testid="products-title">Productos</h1>
          <span class="text-body-sm text-body">{{ total() }} productos</span>
        </div>
        <button
          type="button"
          (click)="openCreate()"
          class="btn-primary sm:self-auto"
          data-testid="add-product-btn"
        >
          + Nuevo producto
        </button>
      </div>

      <!-- Filters -->
      <div class="flex flex-col gap-md mb-xl sm:flex-row sm:items-center sm:flex-wrap">
        <div
          class="flex rounded-pill bg-canvas border border-surface-pressed overflow-hidden focus-within:border-primary"
        >
          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            class="flex-1 bg-transparent outline-none border-none px-lg py-sm text-body-md"
            [(ngModel)]="searchTerm"
            (ngModelChange)="onSearch()"
            data-testid="product-search"
          />
        </div>
        <select
          [(ngModel)]="filterCategory"
          (ngModelChange)="onFilterChange()"
          class="filter-input"
          data-testid="category-filter"
        >
          <option value="">Todas las categorías</option>
          @for (cat of allCategories(); track cat.id) {
            <option [value]="cat.id">{{ cat.name }}</option>
          }
        </select>
        <select
          [(ngModel)]="filterTag"
          (ngModelChange)="onFilterChange()"
          class="filter-input"
          data-testid="tag-filter"
        >
          <option value="">Todos los tags</option>
          @for (tag of allTags(); track tag.id) {
            <option [value]="tag.id">{{ tag.name }}</option>
          }
        </select>
        <select
          [(ngModel)]="filterActive"
          (ngModelChange)="onFilterChange()"
          class="filter-input"
          data-testid="active-filter"
        >
          <option value="">Todos los estados</option>
          <option value="true">Activo</option>
          <option value="false">Inactivo</option>
        </select>
        <select
          [(ngModel)]="filterStock"
          (ngModelChange)="onFilterChange()"
          class="filter-input"
          data-testid="stock-filter"
        >
          <option value="">Todo el stock</option>
          <option value="in">En stock (&gt;5)</option>
          <option value="low">Bajo stock (1-5)</option>
          <option value="out">Agotados (≤0)</option>
        </select>
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center py-4xl">
          <div
            class="w-8 h-8 border-2 border-surface-pressed border-t-primary rounded-full animate-spin"
          ></div>
        </div>
      } @else {
        <div data-testid="products-table">
        <!-- Desktop table -->
        <div
          class="bg-canvas rounded-xl border border-surface-pressed overflow-hidden max-md:hidden"
        >
          <!-- Table Header -->
          <div
            class="grid grid-cols-12 gap-4 bg-accent text-white rounded-t-xl px-lg py-3 font-semibold text-body-sm"
            data-testid="products-table-header"
          >
            <div class="col-span-3">Producto</div>
            <div
              class="col-span-1 cursor-pointer select-none hover:bg-white/10 rounded px-sm py-xxs -mx-sm"
              (click)="onSort('sku')"
              data-testid="sort-sku"
            >
              SKU{{ sortIcon('sku') }}
            </div>
            <div
              class="col-span-1 cursor-pointer select-none hover:bg-white/10 rounded px-sm py-xxs -mx-sm"
              (click)="onSort('costPrice')"
              data-testid="sort-costPrice"
            >
              Costo{{ sortIcon('costPrice') }}
            </div>
            <div
              class="col-span-1 cursor-pointer select-none hover:bg-white/10 rounded px-sm py-xxs -mx-sm"
              (click)="onSort('price')"
              data-testid="sort-price"
            >
              Venta{{ sortIcon('price') }}
            </div>
            <div class="col-span-1">Margen</div>
            <div
              class="col-span-1 cursor-pointer select-none hover:bg-white/10 rounded px-sm py-xxs -mx-sm"
              (click)="onSort('stock')"
              data-testid="sort-stock"
            >
              Stock{{ sortIcon('stock') }}
            </div>
            <div class="col-span-1">Categoría</div>
            <div class="col-span-1">Tags</div>
            <div
              class="col-span-1 cursor-pointer select-none hover:bg-white/10 rounded px-sm py-xxs -mx-sm text-center"
              (click)="onSort('isActive')"
              data-testid="sort-isActive"
            >
              Activo{{ sortIcon('isActive') }}
            </div>
            <div class="col-span-1 text-right">Acciones</div>
          </div>

          <!-- Table Body -->
          <div class="border border-surface-pressed border-t-0 rounded-b-xl">
            @for (product of products(); track product.id) {
              <div
                class="grid grid-cols-12 gap-4 items-center px-lg py-4 border-b border-surface-pressed last:border-b-0 hover:bg-canvas-soft/50"
                [attr.data-testid]="'product-row-' + product.id"
              >
                <div class="col-span-3 flex items-center gap-md min-w-0">
                  @if (product.images?.length) {
                    <img
                      [src]="firstImage(product)"
                      [alt]="product.name"
                      class="w-10 h-10 rounded-lg object-cover bg-canvas-soft shrink-0"
                      loading="lazy"
                      decoding="async"
                    />
                  } @else {
                    <span
                      class="w-10 h-10 rounded-lg bg-canvas-soft flex items-center justify-center text-mute text-body-xs shrink-0"
                      >—</span
                    >
                  }
                  <span class="text-body-sm truncate">{{ product.name }}</span>
                </div>
                <div class="col-span-1 text-body-sm text-body font-mono">{{ product.sku }}</div>
                <div class="col-span-1 text-body-sm">
                  {{ product.costPrice != null ? (product.costPrice | currency) : '—' }}
                </div>
                <div class="col-span-1 text-body-sm font-medium">
                  {{ product.price | currency }}
                </div>
                <div class="col-span-1 text-body-sm">
                  @if (product.costPrice != null && product.costPrice > 0) {
                    <span
                      class="font-medium"
                      [class]="
                        calcMargin(product.price, product.costPrice) >= 0
                          ? 'text-green-700'
                          : 'text-red-600'
                      "
                    >
                      {{ calcMargin(product.price, product.costPrice) | number: '1.0-1' }}%
                    </span>
                  } @else {
                    <span class="text-mute">—</span>
                  }
                </div>
                <div class="col-span-1">
                  <span
                    class="text-body-sm"
                    [class]="
                      product.stock <= 5
                        ? 'text-red-600 font-bold'
                        : product.stock <= 15
                          ? 'text-amber-600'
                          : 'text-body'
                    "
                    >{{ product.stock }}</span
                  >
                </div>
                <div class="col-span-1 text-body-sm text-body">
                  {{ product.category?.name ?? '—' }}
                </div>
                <div class="col-span-1">
                  <div class="flex flex-wrap gap-xxs">
                    @for (tag of product.tags ?? []; track tag.id) {
                      <span
                        class="inline-flex items-center px-sm py-xxs rounded-pill text-body-xs font-medium"
                        [style.background-color]="tag.color ? tag.color + '20' : '#f3f3f3'"
                        [style.color]="tag.color ?? '#5e5e5e'"
                      >
                        {{ tag.name }}
                      </span>
                    }
                  </div>
                </div>
                <div class="col-span-1 flex justify-center">
                  <label class="toggle" [attr.data-testid]="'active-toggle-' + product.id">
                    <input
                      type="checkbox"
                      [checked]="product.isActive"
                      (change)="toggleActive(product)"
                      [disabled]="togglingId() === product.id"
                      [attr.aria-label]="'Activar o desactivar ' + product.name"
                    />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                <div class="col-span-1 flex items-center justify-end gap-sm">
                  <button
                    type="button"
                    class="admin-icon-btn"
                    (click)="openDetail(product)"
                    title="Ver detalle"
                    aria-label="Ver detalle"
                    [attr.data-testid]="'detail-product-' + product.id"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                      <path
                        fill-rule="evenodd"
                        d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM10 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="admin-icon-btn"
                    (click)="openEdit(product)"
                    title="Editar"
                    aria-label="Editar"
                    [attr.data-testid]="'edit-product-' + product.id"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path
                        d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z"
                      />
                      <path
                        d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="admin-icon-btn danger"
                    (click)="deleteProduct(product.id)"
                    [disabled]="deletingId() === product.id"
                    title="Eliminar"
                    aria-label="Eliminar"
                    [attr.data-testid]="'delete-product-' + product.id"
                  >
                    @if (deletingId() === product.id) {
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
                No se encontraron productos
              </div>
            }
          </div>
        </div>

        <!-- Mobile card list -->
        <div class="md:hidden flex flex-col gap-md">
          @for (product of products(); track product.id) {
            <div
              class="bg-canvas rounded-xl border border-surface-pressed p-lg"
              (click)="openDropdown.set(null)"
              [attr.data-testid]="'product-card-' + product.id"
            >
              <div class="flex items-start gap-md">
                @if (product.images?.length) {
                  <img
                    [src]="firstImage(product)"
                    [alt]="product.name"
                    class="w-14 h-14 rounded-lg object-cover bg-canvas-soft shrink-0"
                    loading="lazy"
                    decoding="async"
                  />
                } @else {
                  <span
                    class="w-14 h-14 rounded-lg bg-canvas-soft flex items-center justify-center text-mute text-body-xs shrink-0"
                    >—</span
                  >
                }
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-sm">
                    <p class="text-body-sm font-medium truncate">{{ product.name }}</p>
                    <div class="relative shrink-0">
                      <button
                        type="button"
                        (click)="toggleDropdown($event, product.id)"
                        class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-canvas-soft transition-colors text-body"
                        [attr.data-testid]="'product-actions-' + product.id"
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                          <path
                            d="M6 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm6 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                          />
                        </svg>
                      </button>
                      @if (openDropdown() === product.id) {
                        <div
                          class="absolute right-0 top-full mt-xs w-44 bg-canvas rounded-xl border border-surface-pressed shadow-lg z-10 py-xs"
                          (click)="$event.stopPropagation()"
                        >
                          <button
                            type="button"
                            (click)="openDropdown.set(null); openDetail(product)"
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
                            (click)="openDropdown.set(null); openEdit(product)"
                            class="flex items-center gap-md w-full px-lg py-md text-body-sm text-body hover:bg-canvas-soft transition-colors text-left"
                          >
                            <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 shrink-0">
                              <path
                                d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z"
                              />
                              <path
                                d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z"
                              />
                            </svg>
                            Editar
                          </button>
                          <div class="border-t border-surface-pressed my-xs"></div>
                          <button
                            type="button"
                            (click)="openDropdown.set(null); deleteProduct(product.id)"
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
                  <p class="text-body-xs text-mute font-mono mt-xxs">{{ product.sku }}</p>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-md mt-lg">
                <div>
                  <p class="text-body-xs text-mute">Precio</p>
                  <p class="text-body-sm font-medium">{{ product.price | currency }}</p>
                </div>
                <div>
                  <p class="text-body-xs text-mute">Stock</p>
                  <p
                    class="text-body-sm"
                    [class]="
                      product.stock <= 5
                        ? 'text-red-600 font-bold'
                        : product.stock <= 15
                          ? 'text-amber-600'
                          : 'text-body'
                    "
                  >
                    {{ product.stock }}
                  </p>
                </div>
                @if (product.costPrice != null && product.costPrice > 0) {
                  <div>
                    <p class="text-body-xs text-mute">Margen</p>
                    <p
                      class="text-body-sm font-medium"
                      [class]="
                        calcMargin(product.price, product.costPrice) >= 0
                          ? 'text-green-700'
                          : 'text-red-600'
                      "
                    >
                      {{ calcMargin(product.price, product.costPrice) | number: '1.0-1' }}%
                    </p>
                  </div>
                }
                <div>
                  <p class="text-body-xs text-mute">Categoría</p>
                  <p class="text-body-sm text-body">{{ product.category?.name ?? '—' }}</p>
                </div>
              </div>
              <div
                class="flex items-center justify-between mt-lg pt-lg border-t border-surface-pressed"
              >
                <label class="toggle" [attr.data-testid]="'active-toggle-card-' + product.id">
                  <input
                    type="checkbox"
                    [checked]="product.isActive"
                    (change)="toggleActive(product); $event.stopPropagation()"
                    [disabled]="togglingId() === product.id"
                  />
                  <span class="toggle-slider"></span>
                </label>
                <span
                  class="text-body-xs font-medium px-md py-xxs rounded-pill"
                  [class]="
                    product.isActive ? 'bg-green-50 text-green-700' : 'bg-canvas-soft text-body'
                  "
                  >{{ product.isActive ? 'Activo' : 'Inactivo' }}</span
                >
              </div>
            </div>
          } @empty {
            <div
              class="px-xl py-2xl text-center text-body text-body-sm bg-canvas rounded-xl border border-surface-pressed"
            >
              No se encontraron productos
            </div>
          }
        </div>
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

      @if (formError()) {
        <p class="mt-lg form-error" data-testid="product-form-error">{{ formError() }}</p>
      }

      <!-- Create / Edit modal -->
      <app-modal
        [open]="formOpen()"
        [title]="editingId() ? 'Editar producto' : 'Nuevo producto'"
        size="form"
        testId="product-form-modal"
        [closeOnBackdrop]="false"
        (closed)="closeForm()"
      >
        <div class="grid grid-cols-2 gap-lg">
          <div class="col-span-2">
            <label class="form-label" for="pf-name"
              >Nombre <span class="text-red-500">*</span></label
            >
            <input
              id="pf-name"
              type="text"
              [ngModel]="form().name"
              (ngModelChange)="patch({ name: $event })"
              class="form-input"
              required
              data-testid="form-name"
            />
          </div>
          <div>
            <label class="form-label" for="pf-slug">Slug <span class="text-red-500">*</span></label>
            <input
              id="pf-slug"
              type="text"
              [ngModel]="form().slug"
              (ngModelChange)="patch({ slug: $event })"
              class="form-input"
              required
              data-testid="form-slug"
            />
          </div>
          <div>
            <label class="form-label" for="pf-sku">SKU <span class="text-red-500">*</span></label>
            <input
              id="pf-sku"
              type="text"
              [ngModel]="form().sku"
              (ngModelChange)="patch({ sku: $event })"
              class="form-input"
              required
              data-testid="form-sku"
            />
          </div>
          <!-- Pricing card -->
          <div class="col-span-2">
            <div class="pricing-card" data-testid="pricing-card">
              <p class="text-body-md font-semibold mb-lg">Precios</p>

              <div class="grid grid-cols-2 gap-lg">
                <div>
                  <label class="form-label" for="pf-costPrice">Costo proveedor</label>
                  <input
                    id="pf-costPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    [ngModel]="form().costPrice ?? ''"
                    (ngModelChange)="patch({ costPrice: $event ? +$event : null })"
                    class="form-input"
                    placeholder="$0.00"
                    data-testid="form-cost-price"
                  />
                </div>
                <div>
                  <label class="form-label" for="pf-price"
                    >Precio de venta <span class="text-red-500">*</span></label
                  >
                  <input
                    id="pf-price"
                    type="number"
                    min="0"
                    step="0.01"
                    [ngModel]="form().price"
                    (ngModelChange)="patch({ price: +$event })"
                    class="form-input"
                    required
                    data-testid="form-price"
                  />
                </div>
              </div>

              @if (form().costPrice && form().costPrice! > 0 && form().price > 0) {
                <div class="pricing-helper mt-md" data-testid="margin-display">
                  <span class="text-body-sm text-body">
                    Ganancia: <strong class="text-ink">{{ getProfit() | currency }}</strong> ·
                    Margen:
                    <strong [class]="getMargin() >= 0 ? 'text-green-700' : 'text-red-600'"
                      >{{ getMargin() | number: '1.0-1' }}%</strong
                    >
                  </span>
                  <div class="margin-presets">
                    <span class="text-body-sm text-mute">Aplicar:</span>
                    @for (pct of marginPresets; track pct) {
                      <button
                        type="button"
                        (click)="applyMargin(pct)"
                        class="margin-preset-btn"
                        [attr.data-testid]="'margin-' + pct"
                      >
                        +{{ pct }}%
                      </button>
                    }
                  </div>
                </div>
              }

              <div class="border-t border-surface-pressed mt-lg pt-lg">
                <label class="flex items-center gap-md text-body-md cursor-pointer">
                  <span class="toggle">
                    <input
                      type="checkbox"
                      [checked]="form().hasDiscount"
                      (change)="patch({ hasDiscount: !form().hasDiscount })"
                      data-testid="form-has-discount"
                    />
                    <span class="toggle-slider"></span>
                  </span>
                  Aplicar descuento
                </label>

                @if (form().hasDiscount) {
                  <div class="mt-lg flex flex-col gap-md">
                    <div class="flex items-center gap-md flex-wrap">
                      <div class="segmented-control" data-testid="discount-mode-selector">
                        <button
                          type="button"
                          class="segmented-btn"
                          [class.active]="form().discountMode === 'percent'"
                          (click)="patch({ discountMode: 'percent', discountPrice: null })"
                          data-testid="discount-mode-percent"
                        >
                          % Porcentaje
                        </button>
                        <button
                          type="button"
                          class="segmented-btn"
                          [class.active]="form().discountMode === 'fixed'"
                          (click)="patch({ discountMode: 'fixed', discountPercent: null })"
                          data-testid="discount-mode-fixed"
                        >
                          $ Precio fijo
                        </button>
                      </div>
                      @if (form().discountMode === 'percent') {
                        <div class="flex items-center gap-sm" style="width: 160px">
                          <input
                            id="pf-discountPercent"
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            [ngModel]="form().discountPercent ?? ''"
                            (ngModelChange)="patch({ discountPercent: $event ? +$event : null })"
                            class="form-input"
                            placeholder="0"
                            data-testid="form-discount-percent"
                          />
                          <span class="text-body-sm text-body font-medium">%</span>
                        </div>
                      } @else {
                        <div style="width: 160px">
                          <input
                            id="pf-discountPrice"
                            type="number"
                            min="0"
                            step="0.01"
                            [ngModel]="form().discountPrice ?? ''"
                            (ngModelChange)="patch({ discountPrice: $event ? +$event : null })"
                            class="form-input"
                            placeholder="$0.00"
                            data-testid="form-discount-price"
                          />
                        </div>
                      }
                    </div>

                    @if (form().price > 0 && getFinalPrice() < form().price) {
                      <div class="final-price-hero" data-testid="final-price">
                        <div>
                          <p class="text-body-md font-medium">Precio final al cliente</p>
                          <p class="text-body-xs text-body">
                            El cliente ahorra {{ getSavings() | currency }} ({{
                              getDiscountPercentDisplay()
                            }}% OFF)
                          </p>
                        </div>
                        <span class="final-price-value">{{ getFinalPrice() | currency }}</span>
                      </div>
                      @if (isUnprofitable()) {
                        <div class="unprofitable-warning" data-testid="unprofitable-warning">
                          <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 shrink-0">
                            <path
                              fill-rule="evenodd"
                              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                              clip-rule="evenodd"
                            />
                          </svg>
                          <div>
                            <p class="text-body-xs font-semibold">El producto no es rentable</p>
                            <p class="text-caption">
                              El precio final ({{ getFinalPrice() | currency }}) está por debajo del
                              costo ({{ form().costPrice! | currency }}). Perderías
                              {{ getLossAmount() | currency }} por unidad.
                            </p>
                          </div>
                        </div>
                      }
                    } @else {
                      <p class="text-body-xs text-mute" data-testid="discount-empty-hint">
                        Ingresá un descuento para ver el precio final
                      </p>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
          <div>
            <label class="form-label" for="pf-stock">Stock</label>
            <input
              id="pf-stock"
              type="number"
              min="0"
              [ngModel]="form().stock"
              (ngModelChange)="patch({ stock: $event })"
              class="form-input"
              data-testid="form-stock"
            />
          </div>
          <div>
            <label class="form-label" for="pf-category"
              >Categoría <span class="text-red-500">*</span></label
            >
            <select
              id="pf-category"
              [ngModel]="form().categoryId"
              (ngModelChange)="patch({ categoryId: $event })"
              class="form-input"
              required
              data-testid="form-category"
            >
              <option value="">Seleccionar...</option>
              @for (cat of allCategories(); track cat.id) {
                <option [value]="cat.id">{{ cat.name }}</option>
              }
            </select>
          </div>
          <div>
            <label class="form-label" for="pf-tags">Tags</label>
            <div class="flex flex-wrap gap-sm mb-sm">
              @for (tagId of form().tagIds; track tagId) {
                @for (tag of allTags(); track tag.id) {
                  @if (tag.id === tagId) {
                    <span
                      class="inline-flex items-center gap-xxs px-md py-xxs rounded-pill text-body-xs font-medium bg-canvas-soft border border-surface-pressed"
                    >
                      <span
                        [style.background-color]="tag.color ?? '#5e5e5e'"
                        class="w-2 h-2 rounded-full shrink-0"
                      ></span>
                      {{ tag.name }}
                      <button
                        type="button"
                        (click)="removeTag(tagId)"
                        class="ml-xxs text-mute hover:text-ink"
                        data-testid="remove-tag"
                      >
                        <svg viewBox="0 0 12 12" fill="currentColor" class="w-3 h-3">
                          <path
                            d="M6 0a6 6 0 100 12A6 6 0 006 0zm2.121 3.879a.75.75 0 010 1.06L7.061 6l1.06 1.06a.75.75 0 01-1.06 1.06L6 7.061l-1.06 1.06a.75.75 0 01-1.06-1.06L4.939 6 3.879 4.939a.75.75 0 011.06-1.06L6 4.939l1.06-1.06a.75.75 0 011.06 0z"
                          />
                        </svg>
                      </button>
                    </span>
                  }
                }
              }
            </div>
            <select
              id="pf-tags"
              (change)="addTag($event)"
              class="form-input"
              data-testid="form-tags"
            >
              <option value="">Agregar tag...</option>
              @for (tag of availableTags(); track tag.id) {
                <option [value]="tag.id">{{ tag.name }}</option>
              }
            </select>
          </div>
          <div class="flex items-end pb-md">
            <label class="flex items-center gap-md text-body-md cursor-pointer">
              <span class="toggle">
                <input
                  type="checkbox"
                  [checked]="form().isActive"
                  (change)="patch({ isActive: !form().isActive })"
                  data-testid="form-is-active"
                />
                <span class="toggle-slider"></span>
              </span>
              Producto activo
            </label>
          </div>
          <div class="col-span-2">
            <label class="form-label" for="pf-description">Descripción</label>
            <textarea
              id="pf-description"
              [ngModel]="form().description"
              (ngModelChange)="patch({ description: $event })"
              rows="3"
              class="form-input resize-none"
              data-testid="form-description"
            ></textarea>
          </div>
          <div class="col-span-2">
            <span class="form-label">Imágenes del producto</span>
            <div class="image-gallery-grid">
              @for (img of form().images; track img; let i = $index) {
                <div class="image-thumb-wrapper" [class.featured]="i === form().featuredIndex">
                  <img
                    [src]="img"
                    alt="Imagen {{ i + 1 }}"
                    class="image-thumb"
                    loading="lazy"
                    decoding="async"
                  />
                  <div class="image-thumb-actions">
                    <button
                      type="button"
                      class="thumb-action-btn featured-btn"
                      (click)="patch({ featuredIndex: i })"
                      [title]="
                        i === form().featuredIndex
                          ? 'Imagen destacada (se muestra en cards)'
                          : 'Marcar como destacada'
                      "
                      [attr.data-testid]="'featured-image-' + i"
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                        <path
                          fill-rule="evenodd"
                          d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102 1.106 4.637c.194.813.691 1.456 1.405 1.456.714 0 1.211-.643 1.406-1.456l1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      class="thumb-action-btn remove-btn"
                      (click)="removeImage(i)"
                      title="Eliminar imagen"
                      [attr.data-testid]="'remove-image-' + i"
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                        <path
                          d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"
                        />
                      </svg>
                    </button>
                  </div>
                  @if (i === form().featuredIndex) {
                    <span class="featured-badge">Destacada</span>
                  }
                </div>
              }
              <button
                type="button"
                class="image-add-btn"
                (click)="fileInput.click()"
                data-testid="form-image-choose"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" class="w-6 h-6">
                  <path
                    fill-rule="evenodd"
                    d="M1 5.25A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25v9.5A2.25 2.25 0 0 1 16.75 17H3.25A2.25 2.25 0 0 1 1 14.75v-9.5Zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 0 0 .75-.75v-2.69l-2.22-2.219a.75.75 0 0 0-1.06 0l-1.91 1.909.47.47a.75.75 0 1 1-1.06 1.06L6.53 8.091a.75.75 0 0 0-1.06 0l-2.97 2.97ZM12 7a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="text-body-md text-body">Agregar</span>
              </button>
            </div>
            <p class="mt-sm form-hint">
              La imagen destacada se muestra en las cards del catálogo. Haz clic en la estrella para
              cambiarla.
            </p>
            <input
              #fileInput
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              class="hidden"
              (change)="onFileSelected($event)"
              data-testid="form-image-input"
            />
            @if (imageError()) {
              <p class="mt-sm form-error" data-testid="form-image-error">{{ imageError() }}</p>
            }
          </div>
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
            (click)="saveProduct()"
            [disabled]="isSaving() || isUploading()"
            data-testid="save-product"
          >
            @if (isSaving()) {
              <span class="inline-flex items-center gap-sm"
                ><span class="btn-spinner"></span>Guardando...</span
              >
            } @else {
              Guardar
            }
          </button>
        </div>
      </app-modal>

      <!-- Detail modal -->
      <app-modal
        [open]="detail() !== null"
        title="Detalle del producto"
        size="md"
        testId="product-detail-modal"
        (closed)="detail.set(null)"
      >
        @if (detail(); as p) {
          <div class="flex flex-col gap-lg">
            <div class="flex items-start gap-md">
              @if (p.images?.length) {
                <img
                  [src]="firstImage(p)"
                  [alt]="p.name"
                  class="w-16 h-16 rounded-lg object-cover border border-surface-pressed bg-canvas-soft"
                  loading="lazy"
                  decoding="async"
                  data-testid="detail-image"
                />
              } @else {
                <span
                  class="w-16 h-16 rounded-lg bg-canvas-soft border border-surface-pressed flex items-center justify-center text-mute text-body-xs"
                  >Sin imagen</span
                >
              }
              <div class="min-w-0">
                <p class="text-body-md font-bold truncate" data-testid="detail-name">
                  {{ p.name }}
                </p>
                <p class="text-body-xs text-body font-mono" data-testid="detail-sku">{{ p.sku }}</p>
                <span
                  class="inline-flex items-center mt-xxs px-md py-xxs rounded-pill text-body-xs font-medium"
                  [class]="p.isActive ? 'bg-green-50 text-green-700' : 'bg-canvas-soft text-body'"
                  data-testid="detail-status"
                >
                  {{ p.isActive ? 'Activo' : 'Inactivo' }}
                </span>
              </div>
            </div>

            <dl class="grid grid-cols-2 gap-md">
              <div>
                <dt class="detail-label">Slug</dt>
                <dd class="detail-value font-mono" data-testid="detail-slug">{{ p.slug }}</dd>
              </div>
              <div>
                <dt class="detail-label">Categoría</dt>
                <dd class="detail-value" data-testid="detail-category">
                  {{ p.category?.name ?? '—' }}
                </dd>
              </div>
              <div class="col-span-2">
                <dt class="detail-label">Tags</dt>
                <dd class="detail-value" data-testid="detail-tags">
                  <div class="flex flex-wrap gap-sm">
                    @for (tag of p.tags ?? []; track tag.id) {
                      <span
                        class="inline-flex items-center gap-xxs px-md py-xxs rounded-pill text-body-xs font-medium"
                        [style.background-color]="tag.color ? tag.color + '20' : '#f3f3f3'"
                        [style.color]="tag.color ?? '#5e5e5e'"
                      >
                        {{ tag.name }}
                      </span>
                    } @empty {
                      <span class="text-mute">Sin tags</span>
                    }
                  </div>
                </dd>
              </div>
              <div>
                <dt class="detail-label">Costo proveedor</dt>
                <dd class="detail-value" data-testid="detail-cost">
                  {{ p.costPrice != null ? (p.costPrice | currency) : '—' }}
                </dd>
              </div>
              <div>
                <dt class="detail-label">Precio de venta</dt>
                <dd class="detail-value font-medium" data-testid="detail-price">
                  {{ p.price | currency }}
                </dd>
              </div>
              <div>
                <dt class="detail-label">Margen de ganancia</dt>
                <dd class="detail-value font-medium" data-testid="detail-margin">
                  @if (p.costPrice != null && p.costPrice > 0) {
                    <span
                      [class]="
                        calcMargin(p.price, p.costPrice) >= 0 ? 'text-green-700' : 'text-red-600'
                      "
                    >
                      {{ calcMargin(p.price, p.costPrice) | number: '1.0-1' }}%
                    </span>
                  } @else {
                    <span class="text-mute">Sin costo registrado</span>
                  }
                </dd>
              </div>
              <div>
                <dt class="detail-label">Stock</dt>
                <dd class="detail-value" data-testid="detail-stock">{{ p.stock }}</dd>
              </div>
              <div>
                <dt class="detail-label">Creado</dt>
                <dd class="detail-value" data-testid="detail-created">
                  {{ p.createdAt | date: 'dd/MM/yyyy HH:mm' }}
                </dd>
              </div>
              <div>
                <dt class="detail-label">ID</dt>
                <dd class="detail-value font-mono truncate" data-testid="detail-id">{{ p.id }}</dd>
              </div>
            </dl>

            <div>
              <p class="detail-label">Descripción</p>
              <p class="detail-value whitespace-pre-line" data-testid="detail-description">
                {{ p.description || 'Sin descripción' }}
              </p>
            </div>

            <div data-testid="detail-restock-subscriptions">
              <p class="detail-label">
                Suscripciones de reposición ({{ restockSubscriptions().length }})
              </p>
              @if (restockSubscriptions().length > 0) {
                <ul class="flex flex-col gap-xxs mt-xxs">
                  @for (subscription of restockSubscriptions(); track subscription.id) {
                    <li class="detail-value truncate">{{ subscription.email }}</li>
                  }
                </ul>
              } @else {
                <p class="detail-value text-mute">Sin suscripciones</p>
              }
            </div>
          </div>
        }

        <div modalFooter>
          <button
            type="button"
            class="btn-secondary"
            (click)="detail.set(null)"
            data-testid="detail-close"
          >
            Cerrar
          </button>
          <button
            type="button"
            class="btn-primary"
            (click)="editFromDetail()"
            data-testid="detail-edit"
          >
            Editar
          </button>
        </div>
      </app-modal>

      <!-- Image cropper modal -->
      <app-image-cropper-modal
        [open]="cropperOpen()"
        [file]="cropperFile()"
        [uploading]="isUploading()"
        [aspectRatio]="1"
        [resizeToWidth]="1200"
        title="Recortar imagen del producto"
        testId="product-cropper"
        (cancelled)="closeCropper()"
        (confirmed)="onImageCropped($event)"
      />

      <!-- Confirm delete dialog -->
      <app-confirm-dialog
        [open]="deleteProductId() !== null"
        [title]="'Eliminar producto'"
        [message]="'¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.'"
        [loading]="deletingId() === deleteProductId()"
        [variant]="'danger'"
        testId="delete-confirm-dialog"
        (confirmed)="confirmDelete()"
        (cancelled)="deleteProductId.set(null)"
      />
    </div>
  `,
})
export class AdminProducts implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly stockSubscriptions = inject(StockSubscriptionService);

  protected readonly products = signal<AdminProduct[]>([]);
  protected readonly allCategories = signal<AdminCategory[]>([]);
  protected readonly allTags = signal<Tag[]>([]);
  protected readonly loading = signal(true);
  protected readonly page = signal(1);
  protected readonly total = signal(0);
  protected readonly totalPages = signal(0);

  protected readonly form = signal<ProductForm>({ ...EMPTY_FORM });
  protected readonly formOpen = signal(false);
  protected readonly formError = signal('');
  protected readonly editingId = signal<string | null>(null);
  protected readonly isSaving = signal(false);
  protected readonly deletingId = signal<string | null>(null);
  protected readonly deleteProductId = signal<string | null>(null);
  protected readonly togglingId = signal<string | null>(null);
  protected readonly detail = signal<AdminProduct | null>(null);
  protected readonly restockSubscriptions = signal<StockSubscription[]>([]);
  protected readonly marginPresets = MARGIN_PRESETS;

  protected readonly cropperOpen = signal(false);
  protected readonly cropperFile = signal<File | null>(null);
  protected readonly isUploading = signal(false);
  protected readonly imageError = signal('');
  protected readonly openDropdown = signal<string | null>(null);

  protected readonly availableTags = computed(() => {
    const selected = this.form().tagIds;
    return this.allTags().filter((t) => !selected.includes(t.id));
  });

  protected sortField = '';
  protected sortOrder: 'ASC' | 'DESC' = 'DESC';
  protected searchTerm = '';
  protected filterCategory = '';
  protected filterTag = '';
  protected filterActive = '';
  protected filterStock = '';
  private searchTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    const stock = this.route.snapshot.queryParamMap.get('stock');
    if (stock === 'low' || stock === 'out' || stock === 'in') {
      this.filterStock = stock;
    }
    this.loadProducts();
    this.loadCategories();
    this.loadTags();
  }

  protected patch(values: Partial<ProductForm>): void {
    this.form.update((f) => ({ ...f, ...values }));
  }

  protected addTag(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const tagId = select.value;
    if (tagId && !this.form().tagIds.includes(tagId)) {
      this.patch({ tagIds: [...this.form().tagIds, tagId] });
    }
    select.value = '';
  }

  protected removeTag(tagId: string): void {
    this.patch({ tagIds: this.form().tagIds.filter((id) => id !== tagId) });
  }

  protected applyMargin(pct: number): void {
    const cost = this.form().costPrice;
    if (!cost || cost <= 0) return;
    const sale = Math.round(cost * (1 + pct / 100) * 100) / 100;
    this.patch({ price: sale });
  }

  protected getMargin(): number {
    const { costPrice, price } = this.form();
    if (!costPrice || costPrice <= 0 || !price) return 0;
    return ((price - costPrice) / costPrice) * 100;
  }

  protected getFinalPrice(): number {
    const { price, hasDiscount, discountMode, discountPercent, discountPrice } = this.form();
    if (!hasDiscount) return price;
    if (discountMode === 'fixed' && discountPrice && discountPrice > 0) return discountPrice;
    if (discountMode === 'percent' && discountPercent && discountPercent > 0) {
      return Math.round(price * (1 - discountPercent / 100) * 100) / 100;
    }
    return price;
  }

  protected getProfit(): number {
    const { costPrice, price } = this.form();
    if (!costPrice || costPrice <= 0) return 0;
    return Math.round((price - costPrice) * 100) / 100;
  }

  protected getSavings(): number {
    const { price } = this.form();
    const finalPrice = this.getFinalPrice();
    return Math.round((price - finalPrice) * 100) / 100;
  }

  protected getDiscountPercentDisplay(): number {
    const { price } = this.form();
    if (!price || price <= 0) return 0;
    const finalPrice = this.getFinalPrice();
    return Math.round((1 - finalPrice / price) * 100);
  }

  protected isUnprofitable(): boolean {
    const { costPrice } = this.form();
    if (!costPrice || costPrice <= 0) return false;
    return this.getFinalPrice() < costPrice;
  }

  protected getLossAmount(): number {
    const { costPrice } = this.form();
    if (!costPrice || costPrice <= 0) return 0;
    return Math.round((costPrice - this.getFinalPrice()) * 100) / 100;
  }

  protected calcMargin(price: number, costPrice: number | null | undefined): number {
    if (!costPrice || costPrice <= 0 || !price) return 0;
    return ((price - costPrice) / costPrice) * 100;
  }

  protected firstImage(product: AdminProduct): string {
    return product.images?.[0] ?? '';
  }

  protected onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page.set(1);
      this.loadProducts();
    }, 300);
  }

  protected onFilterChange(): void {
    this.page.set(1);
    this.loadProducts();
  }

  protected onSort(field: string): void {
    if (this.sortField === field) {
      this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortField = field;
      this.sortOrder = 'ASC';
    }
    this.page.set(1);
    this.loadProducts();
  }

  protected sortIcon(field: string): string {
    if (this.sortField !== field) return '';
    return this.sortOrder === 'ASC' ? ' ↑' : ' ↓';
  }

  protected goToPage(p: number): void {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.loadProducts();
  }

  protected openCreate(): void {
    this.form.set({ ...EMPTY_FORM });
    this.editingId.set(null);
    this.formError.set('');
    this.formOpen.set(true);
  }

  protected openEdit(product: AdminProduct): void {
    this.editingId.set(product.id);
    const images = product.images ?? [];
    const featuredIndex = product.featuredImage
      ? Math.max(0, images.indexOf(product.featuredImage))
      : 0;
    this.form.set({
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      price: Number(product.price),
      costPrice: product.costPrice != null ? Number(product.costPrice) : null,
      stock: product.stock,
      categoryId: product.categoryId,
      tagIds: product.tags?.map((t) => t.id) ?? [],
      description: product.description ?? '',
      images,
      featuredIndex,
      isActive: product.isActive,
      hasDiscount: product.hasDiscount ?? false,
      discountMode:
        product.discountPrice != null && Number(product.discountPrice) > 0 ? 'fixed' : 'percent',
      discountPercent: product.discountPercent != null ? Number(product.discountPercent) : null,
      discountPrice: product.discountPrice != null ? Number(product.discountPrice) : null,
    });
    this.formError.set('');
    this.formOpen.set(true);
  }

  protected openDetail(product: AdminProduct): void {
    this.detail.set(product);
    this.restockSubscriptions.set([]);
    this.stockSubscriptions
      .getByProduct(product.id)
      .subscribe((subscriptions) => this.restockSubscriptions.set(subscriptions));
  }

  protected editFromDetail(): void {
    const product = this.detail();
    this.detail.set(null);
    if (product) this.openEdit(product);
  }

  protected closeForm(): void {
    if (this.isSaving() || this.isUploading()) return;
    this.formOpen.set(false);
    this.editingId.set(null);
    this.form.set({ ...EMPTY_FORM });
    this.formError.set('');
    this.imageError.set('');
    this.openDropdown.set(null);
  }

  protected toggleDropdown(event: Event, id: string): void {
    event.stopPropagation();
    this.openDropdown.set(this.openDropdown() === id ? null : id);
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.imageError.set('El archivo debe ser una imagen');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      this.imageError.set('La imagen no puede superar los 5MB');
      return;
    }

    this.imageError.set('');
    this.cropperFile.set(file);
    this.cropperOpen.set(true);
  }

  protected closeCropper(): void {
    if (this.isUploading()) return;
    this.cropperOpen.set(false);
    this.cropperFile.set(null);
  }

  protected onImageCropped(blob: Blob): void {
    this.isUploading.set(true);
    this.imageError.set('');
    this.adminService
      .uploadImage('products', blob)
      .pipe(finalize(() => this.isUploading.set(false)))
      .subscribe({
        next: (res) => {
          const images = [...this.form().images, res.url];
          this.patch({
            images,
            featuredIndex: images.length === 1 ? 0 : this.form().featuredIndex,
          });
          this.cropperOpen.set(false);
          this.cropperFile.set(null);
        },
        error: (err) => {
          this.imageError.set(
            err?.error?.message ?? 'No se pudo subir la imagen. Intenta de nuevo',
          );
        },
      });
  }

  protected removeImage(index: number): void {
    const images = this.form().images.filter((_, i) => i !== index);
    let featuredIndex = this.form().featuredIndex;
    if (index === featuredIndex) {
      featuredIndex = 0;
    } else if (index < featuredIndex) {
      featuredIndex--;
    }
    this.patch({ images, featuredIndex });
  }

  protected toggleActive(product: AdminProduct): void {
    const next = !product.isActive;
    this.togglingId.set(product.id);
    this.adminService
      .updateProduct(product.id, { isActive: next })
      .pipe(finalize(() => this.togglingId.set(null)))
      .subscribe({
        next: (updated) => {
          this.products.update((list) =>
            list.map((p) => (p.id === updated.id ? { ...p, isActive: updated.isActive } : p)),
          );
          this.toast.success(next ? 'Producto activado' : 'Producto desactivado');
        },
        error: () => {
          this.toast.error('No se pudo cambiar el estado del producto');
          this.loadProducts();
        },
      });
  }

  protected saveProduct(): void {
    const data = this.form();
    if (!data.name.trim() || !data.slug.trim() || !data.sku.trim() || !data.categoryId) {
      this.formError.set('Nombre, slug, SKU y categoría son obligatorios');
      return;
    }

    this.formError.set('');
    this.isSaving.set(true);

    const payload: Partial<AdminProduct> & { tagIds?: string[] } = {
      name: data.name.trim(),
      slug: data.slug.trim(),
      sku: data.sku.trim(),
      price: Number(data.price),
      costPrice: data.costPrice,
      stock: Number(data.stock),
      categoryId: data.categoryId,
      tagIds: data.tagIds,
      description: data.description,
      images: data.images,
      featuredImage:
        data.images.length > 0 ? (data.images[data.featuredIndex] ?? data.images[0]) : undefined,
      isActive: data.isActive,
      hasDiscount: data.hasDiscount,
      discountPercent:
        data.hasDiscount && data.discountMode === 'percent' && data.discountPercent
          ? data.discountPercent
          : undefined,
      discountPrice:
        data.hasDiscount && data.discountMode === 'fixed' && data.discountPrice
          ? data.discountPrice
          : undefined,
    };

    const id = this.editingId();
    const request = id
      ? this.adminService.updateProduct(id, payload)
      : this.adminService.createProduct(payload);

    request.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.formOpen.set(false);
        this.editingId.set(null);
        this.form.set({ ...EMPTY_FORM });
        this.loadProducts();
        this.toast.success(id ? 'Producto actualizado' : 'Producto creado');
      },
      error: (err) => {
        const message = err?.error?.message;
        const msg = Array.isArray(message)
          ? message.join(', ')
          : (message ?? 'No se pudo guardar el producto');
        this.formError.set(msg);
        this.toast.error(msg);
      },
    });
  }

  protected deleteProduct(id: string): void {
    this.deleteProductId.set(id);
  }

  protected confirmDelete(): void {
    const id = this.deleteProductId();
    if (!id) return;
    this.deletingId.set(id);
    this.deleteProductId.set(null);
    this.adminService
      .deleteProduct(id)
      .pipe(finalize(() => this.deletingId.set(null)))
      .subscribe({
        next: () => {
          this.products.update((list) => list.filter((p) => p.id !== id));
          this.total.update((t) => t - 1);
          this.toast.success('Producto eliminado');
        },
        error: () => {
          this.toast.error('No se pudo eliminar el producto');
        },
      });
  }

  private loadProducts(): void {
    this.loading.set(true);
    this.adminService
      .getProducts(
        this.page(),
        10,
        this.searchTerm,
        this.filterCategory,
        this.filterActive,
        this.filterStock,
        this.sortField,
        this.sortOrder,
        this.filterTag,
      )
      .subscribe({
        next: (res) => {
          this.products.set(res.data);
          this.total.set(res.total);
          this.totalPages.set(res.totalPages);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  private loadCategories(): void {
    this.adminService.getCategories(1, 100).subscribe({
      next: (res) => this.allCategories.set(res.data),
    });
  }

  private loadTags(): void {
    this.adminService.getTags(1, 100).subscribe({
      next: (res) => this.allTags.set(res.data),
    });
  }
}
