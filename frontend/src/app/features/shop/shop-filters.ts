import { Component, effect, input, output, signal, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, Subscription } from 'rxjs';
import { Category } from '../../core/services/category.service';
import { Tag } from '../../core/services/product.service';

export interface ShopFilterState {
  selectedCategorySlugs: string[];
  selectedTagSlugs: string[];
  minPrice: number;
  maxPrice: number;
  includeOutOfStock: boolean;
}

@Component({
  selector: 'app-shop-filters',
  imports: [FormsModule],
  template: `
    <aside class="filter-sidebar" data-testid="shop-filters">
      <h3 class="filter-title">Opciones de filtro</h3>

      <!-- Category -->
      <div class="filter-group">
        <h4 class="filter-group-title">Categoría</h4>
        <div class="filter-options">
          @for (category of categories(); track category.id) {
            <label class="filter-checkbox">
              <input
                type="checkbox"
                [checked]="isCategorySelected(category.slug)"
                (change)="toggleCategory(category.slug)"
                class="filter-checkbox-input"
                [attr.data-testid]="'filter-category-' + category.slug"
              />
              <span class="filter-checkbox-custom"></span>
              <span class="filter-checkbox-label">{{ category.name }}</span>
            </label>
          }
        </div>
      </div>

      <!-- Price Range -->
      <div class="filter-group">
        <h4 class="filter-group-title">Precio</h4>
        <div class="price-range-inputs">
          <div class="price-input-group">
            <label for="price-min" class="price-input-label">Desde</label>
            <input
              id="price-min"
              type="number"
              [ngModel]="localMinPrice()"
              (ngModelChange)="onMinPriceChange($event)"
              [min]="0"
              [max]="localMaxPrice()"
              [placeholder]="priceBounds().min"
              class="price-input"
              data-testid="filter-price-min"
            />
          </div>
          <span class="price-separator">-</span>
          <div class="price-input-group">
            <label for="price-max" class="price-input-label">Hasta</label>
            <input
              id="price-max"
              type="number"
              [ngModel]="localMaxPrice()"
              (ngModelChange)="onMaxPriceChange($event)"
              [min]="localMinPrice()"
              [placeholder]="priceBounds().max"
              class="price-input"
              data-testid="filter-price-max"
            />
          </div>
        </div>
      </div>

      <!-- Tags -->
      @if (tags().length > 0) {
        <div class="filter-group">
          <h4 class="filter-group-title">Tags</h4>
          <div class="filter-options">
            @for (tag of tags(); track tag.id) {
              <label class="filter-checkbox">
                <input
                  type="checkbox"
                  [checked]="isTagSelected(tag.slug)"
                  (change)="toggleTag(tag.slug)"
                  class="filter-checkbox-input"
                  [attr.data-testid]="'filter-tag-' + tag.slug"
                />
                <span class="filter-checkbox-custom"></span>
                <span class="filter-checkbox-label">
                  @if (tag.color) {
                    <span class="inline-block w-2 h-2 rounded-full mr-xs" [style.background-color]="tag.color"></span>
                  }
                  {{ tag.name }}
                </span>
              </label>
            }
          </div>
        </div>
      }

      <!-- Availability -->
      <div class="filter-group">
        <h4 class="filter-group-title">Disponibilidad</h4>
        <div class="filter-options">
          <label class="filter-checkbox">
            <input
              type="checkbox"
              [checked]="includeOutOfStock()"
              (change)="toggleIncludeOutOfStock()"
              class="filter-checkbox-input"
              data-testid="filter-include-out-of-stock"
            />
            <span class="filter-checkbox-custom"></span>
            <span class="filter-checkbox-label">Incluir productos agotados</span>
          </label>
        </div>
      </div>

      <!-- Clear filters -->
      <button
        type="button"
        class="btn-clear-filters"
        (click)="clearAll.emit()"
        data-testid="sidebar-clear-filters"
      >
        Limpiar filtros
      </button>
    </aside>
  `,
  styles: `
    .filter-sidebar {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2xl);
      background-color: var(--color-canvas);
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-xl);
      padding: var(--spacing-2xl);
      min-width: 260px;
      max-width: 280px;
      height: fit-content;
    }

    .filter-title {
      font-size: var(--text-display-sm);
      font-weight: 700;
      color: var(--color-ink);
      margin: 0;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      padding-top: var(--spacing-lg);
      border-top: 1px solid var(--color-surface-pressed);
    }

    .filter-group:first-of-type {
      border-top: none;
      padding-top: 0;
    }

    .filter-group-title {
      font-size: var(--text-body-md-strong);
      font-weight: 600;
      color: var(--color-ink);
      margin: 0;
    }

    .filter-options {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .filter-checkbox {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      cursor: pointer;
      user-select: none;
    }

    .filter-checkbox-input {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
    }

    .filter-checkbox-custom {
      width: 18px;
      height: 18px;
      border: 2px solid var(--color-surface-pressed);
      border-radius: 4px;
      display: grid;
      place-items: center;
      flex-shrink: 0;
      transition: all 0.2s ease;
    }

    .filter-checkbox-input:checked + .filter-checkbox-custom {
      background-color: var(--color-primary);
      border-color: var(--color-primary);
    }

    .filter-checkbox-input:checked + .filter-checkbox-custom::after {
      content: '';
      display: block;
      width: 5px;
      height: 9px;
      border: solid var(--color-on-primary);
      border-width: 0 2px 2px 0;
      transform: rotate(45deg) translateY(-1px);
    }

    .filter-checkbox-label {
      font-size: var(--text-body-sm);
      color: var(--color-body);
      line-height: 18px;
    }

    .filter-checkbox:hover .filter-checkbox-label {
      color: var(--color-ink);
    }

    .btn-clear-filters {
      width: 100%;
      padding: var(--spacing-md) var(--spacing-lg);
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-pill);
      background-color: var(--color-canvas);
      color: var(--color-body);
      font-size: var(--text-body-sm);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: var(--spacing-lg);
    }

    .btn-clear-filters:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
      background-color: color-mix(in srgb, var(--color-primary) 5%, var(--color-canvas));
    }

    .price-range-inputs {
      display: flex;
      align-items: flex-end;
      gap: var(--spacing-sm);
    }

    .price-input-group {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xxs);
    }

    .price-input-label {
      font-size: var(--text-caption);
      color: var(--color-body);
      font-weight: 500;
    }

    .price-input {
      width: 100%;
      padding: var(--spacing-sm) var(--spacing-md);
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-md);
      font-size: var(--text-body-sm);
      color: var(--color-ink);
      background-color: var(--color-canvas);
      outline: none;
      transition: border-color 0.2s ease;
    }

    .price-input:focus {
      border-color: var(--color-primary);
    }

    .price-input::placeholder {
      color: var(--color-mute);
    }

    .price-separator {
      color: var(--color-mute);
      padding-bottom: var(--spacing-sm);
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `,
})
export class ShopFilters implements OnInit, OnDestroy {
  readonly categories = input<Category[]>([]);
  readonly tags = input<Tag[]>([]);
  readonly priceBounds = input<{ min: number; max: number }>({ min: 0, max: 500 });
  readonly initialFilters = input<ShopFilterState>({
    selectedCategorySlugs: [],
    selectedTagSlugs: [],
    minPrice: 0,
    maxPrice: 500,
    includeOutOfStock: false,
  });
  readonly filterChange = output<ShopFilterState>();
  readonly clearAll = output<void>();

  protected readonly selectedCategorySlugs = signal<string[]>([]);
  protected readonly selectedTagSlugs = signal<string[]>([]);
  protected readonly localMinPrice = signal(0);
  protected readonly localMaxPrice = signal(500);
  protected readonly includeOutOfStock = signal(false);

  private readonly priceChange$ = new Subject<void>();
  private priceSub?: Subscription;

  constructor() {
    effect(() => {
      const init = this.initialFilters();
      this.selectedCategorySlugs.set([...init.selectedCategorySlugs]);
      this.selectedTagSlugs.set([...init.selectedTagSlugs]);
      this.localMinPrice.set(init.minPrice);
      this.localMaxPrice.set(init.maxPrice);
      this.includeOutOfStock.set(init.includeOutOfStock);
    });
  }

  ngOnInit(): void {
    this.priceSub = this.priceChange$.pipe(debounceTime(400)).subscribe(() => {
      this.emitFilters();
    });
  }

  ngOnDestroy(): void {
    this.priceSub?.unsubscribe();
  }

  protected isCategorySelected(slug: string): boolean {
    return this.selectedCategorySlugs().includes(slug);
  }

  protected toggleCategory(slug: string): void {
    const current = this.selectedCategorySlugs();
    if (current.includes(slug)) {
      this.selectedCategorySlugs.set(current.filter((s) => s !== slug));
    } else {
      this.selectedCategorySlugs.set([...current, slug]);
    }
    this.emitFilters();
  }

  protected isTagSelected(slug: string): boolean {
    return this.selectedTagSlugs().includes(slug);
  }

  protected toggleTag(slug: string): void {
    const current = this.selectedTagSlugs();
    if (current.includes(slug)) {
      this.selectedTagSlugs.set(current.filter((s) => s !== slug));
    } else {
      this.selectedTagSlugs.set([...current, slug]);
    }
    this.emitFilters();
  }

  protected onMinPriceChange(value: number): void {
    this.localMinPrice.set(value);
    this.priceChange$.next();
  }

  protected onMaxPriceChange(value: number): void {
    this.localMaxPrice.set(value);
    this.priceChange$.next();
  }

  protected toggleIncludeOutOfStock(): void {
    this.includeOutOfStock.update((value) => !value);
    this.emitFilters();
  }

  private emitFilters(): void {
    this.filterChange.emit({
      selectedCategorySlugs: this.selectedCategorySlugs(),
      selectedTagSlugs: this.selectedTagSlugs(),
      minPrice: this.localMinPrice(),
      maxPrice: this.localMaxPrice(),
      includeOutOfStock: this.includeOutOfStock(),
    });
  }
}
