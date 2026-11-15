import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { AdminCategory, AdminProduct } from '../../../core/services/admin.service';
import {
  CollectionService,
  SuggestionRule,
} from '../../../core/services/collection.service';
import { Product, Tag } from '../../../core/services/product.service';
import { SelectComponent, SelectOption } from '../../../shared/ui/select';
import { InfiniteScrollDirective } from '../../../shared/ui/infinite-scroll.directive';
import {
  CollectionProductSelection,
  SUGGESTION_RULES,
} from './collection-editor.types';

const RESULTS_PAGE = 24;
const SELECTED_PAGE = 24;

@Component({
  selector: 'app-collection-products',
  imports: [
    FormsModule,
    CurrencyPipe,
    DragDropModule,
    SelectComponent,
    InfiniteScrollDirective,
  ],
  template: `
    <section class="product-manager">
      <div class="panel add-panel">
        <div class="panel-head">
          <div>
            <h3 class="panel-title">Añadir productos</h3>
            <span class="panel-subtitle">Busca, filtra y agrega productos a la sección</span>
          </div>
          @if (hasActiveFilters()) {
            <button
              type="button"
              class="link-btn"
              (click)="clearFilters()"
              data-testid="clear-product-filters"
            >
              Limpiar
            </button>
          }
        </div>

        <input
          type="text"
          class="form-input"
          placeholder="Buscar por nombre o SKU..."
          [ngModel]="productSearch()"
          (ngModelChange)="onSearchChange($event)"
          data-testid="collection-product-search"
        />

        <div class="filter-row">
          <div class="filter-field">
            <label class="form-label" for="cf-category-filter">Categoría</label>
            <app-select
              variant="form"
              controlId="cf-category-filter"
              testId="collection-filter-category"
              [options]="categoryOptions()"
              [ngModel]="filterCategoryId()"
              (ngModelChange)="onCategoryChange($event)"
            />
          </div>
          <div class="filter-field">
            <label class="form-label" for="cf-tag-filter">Tag</label>
            <app-select
              variant="form"
              controlId="cf-tag-filter"
              testId="collection-filter-tag"
              [options]="tagOptions()"
              [ngModel]="filterTagId()"
              (ngModelChange)="onTagChange($event)"
            />
          </div>
        </div>

        <div class="suggestions-row">
          <button
            type="button"
            class="suggestion-chip"
            [class.active]="suggestionRule() === null"
            (click)="clearSuggestion()"
            data-testid="suggestion-ALL"
          >
            Todos
          </button>
          @for (rule of suggestionRules; track rule.value) {
            <button
              type="button"
              class="suggestion-chip"
              [class.active]="suggestionRule() === rule.value"
              (click)="toggleSuggestion(rule.value)"
              [attr.data-testid]="'suggestion-' + rule.value"
            >
              {{ rule.label }}
            </button>
          }
        </div>

        <div class="results-head">
          <span class="results-title">
            Resultados
            @if (filteredResults().length > 0) {
              <span class="results-count"
                >{{ visibleResults().length }} de {{ filteredResults().length }}</span
              >
            }
          </span>
          @if (addableResults().length > 0) {
            <button
              type="button"
              class="link-btn"
              (click)="addAllResults()"
              data-testid="suggestion-add-all"
            >
              Agregar todos ({{ addableResults().length }})
            </button>
          }
        </div>

        <div
          class="product-results"
          [appInfiniteScroll]="hasMoreResults()"
          (load)="loadMoreResults()"
          data-testid="collection-product-results"
        >
          @if (loading() || suggestionsLoading()) {
            <p class="empty-note">Cargando productos...</p>
          } @else if (filteredResults().length === 0) {
            <p class="empty-note">
              No se encontraron productos con los filtros seleccionados.
            </p>
          } @else {
            @for (product of visibleResults(); track product.id) {
              <div
                class="result-row"
                [attr.data-testid]="'collection-product-option-' + product.id"
              >
                <div class="result-thumb">
                  @if (productImage(product)) {
                    <img [src]="productImage(product)" [alt]="product.name" />
                  } @else {
                    <span>{{ product.name.charAt(0) }}</span>
                  }
                </div>
                <div class="result-info">
                  <p class="result-name">{{ product.name }}</p>
                  <span class="result-meta"
                    >{{ categoryName(product) }} · {{ product.price | currency }}</span
                  >
                </div>
                @if (isAdded(product.id)) {
                  <span class="added-pill" data-testid="product-added-pill">Agregado</span>
                } @else {
                  <button
                    type="button"
                    class="btn-add"
                    (click)="addProduct(product.id)"
                    [attr.data-testid]="'add-product-' + product.id"
                  >
                    Agregar
                  </button>
                }
              </div>
            }
          }
        </div>
      </div>

      <aside class="panel selected-panel">
        <div class="collection-preview">
          <div class="preview-media">
            @if (imageUrl()) {
              <img [src]="imageUrl()" [alt]="title() || 'Sección'" />
            } @else {
              <span>{{ (title() || 'S').charAt(0) }}</span>
            }
          </div>
          <div class="preview-info">
            <h4 class="preview-title">{{ title() || 'Nueva sección' }}</h4>
            <p class="preview-subtitle">{{ subtitle() || 'Sin subtítulo' }}</p>
            <span class="preview-badge">{{ placementLabel() }}</span>
          </div>
        </div>

        <div class="selected-head-row">
          <div>
            <h3 class="panel-title">Productos añadidos</h3>
            <span class="panel-subtitle">{{ selected().length }} en esta sección</span>
          </div>
          @if (selected().length > 0) {
            <span class="drag-hint">Arrastra para ordenar</span>
          }
        </div>

        @if (selected().length === 0) {
          <div class="selected-empty" data-testid="collection-selected-empty">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              class="selected-empty-icon"
            >
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
            <p>Aún no has agregado productos a esta sección.</p>
            <span>Usa el buscador de la izquierda para añadirlos.</span>
          </div>
        } @else {
          <div class="selected-head">
            <span></span>
            <span>#</span>
            <span>Producto</span>
            <span class="col-price">Precio</span>
            <span></span>
          </div>
          <div
            class="selected-list"
            cdkDropList
            [appInfiniteScroll]="hasMoreSelected()"
            (load)="loadMoreSelected()"
            (cdkDropListDropped)="dropProduct($event)"
            data-testid="collection-selected-list"
          >
            @for (item of visibleSelected(); track item.productId; let index = $index) {
              <div
                class="selected-row"
                cdkDrag
                [attr.data-testid]="'selected-product-' + item.productId"
              >
                <button
                  type="button"
                  class="drag-handle"
                  cdkDragHandle
                  aria-label="Arrastrar para reordenar"
                  title="Arrastrar para reordenar"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <circle cx="7" cy="5" r="1.4" />
                    <circle cx="13" cy="5" r="1.4" />
                    <circle cx="7" cy="10" r="1.4" />
                    <circle cx="13" cy="10" r="1.4" />
                    <circle cx="7" cy="15" r="1.4" />
                    <circle cx="13" cy="15" r="1.4" />
                  </svg>
                </button>
                <span class="row-index">{{ index + 1 }}</span>
                <div class="row-product">
                  <div class="row-thumb">
                    @if (productImageById(item.productId)) {
                      <img
                        [src]="productImageById(item.productId)"
                        [alt]="productName(item.productId)"
                      />
                    } @else {
                      <span>{{ productName(item.productId).charAt(0) }}</span>
                    }
                  </div>
                  <div class="row-product-text">
                    <p class="row-name">{{ productName(item.productId) }}</p>
                    <span class="row-sku">{{ productCategory(item.productId) }}</span>
                  </div>
                </div>
                <span class="row-price col-price">{{
                  productPrice(item.productId) | currency
                }}</span>
                <button
                  type="button"
                  class="row-remove"
                  (click)="removeProduct(item.productId)"
                  title="Quitar producto"
                  aria-label="Quitar producto"
                  data-testid="remove-selected-product"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path
                      d="M7.5 2.75a.75.75 0 0 0-.75.75V4h-2a.75.75 0 0 0 0 1.5h.53l.72 9.4A2.25 2.25 0 0 0 8.24 17h3.52a2.25 2.25 0 0 0 2.24-2.1l.72-9.4h.53a.75.75 0 0 0 0-1.5h-2v-.5a.75.75 0 0 0-.75-.75h-5ZM8.5 7.75a.75.75 0 0 1 1.5 0v5.5a.75.75 0 0 1-1.5 0v-5.5Zm2.5 0a.75.75 0 0 1 1.5 0v5.5a.75.75 0 0 1-1.5 0v-5.5Z"
                    />
                  </svg>
                </button>
                <div class="drag-placeholder" *cdkDragPlaceholder></div>
              </div>
            }
          </div>
          @if (hasMoreSelected()) {
            <p class="more-hint">
              Desplázate para ver más ({{ visibleSelected().length }} de
              {{ selected().length }})
            </p>
          }
        }
      </aside>
    </section>
  `,
  styles: `
    .product-manager {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 470px;
      gap: var(--spacing-xl);
      align-items: start;
    }

    .panel {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      padding: var(--spacing-lg);
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-lg);
      background-color: var(--color-canvas);
      min-width: 0;
    }

    .panel-head,
    .selected-head-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--spacing-md);
    }

    .panel-title {
      margin: 0;
      font-size: var(--text-body-md);
      font-weight: 700;
      color: var(--color-ink);
    }

    .panel-subtitle {
      font-size: var(--text-body-xs);
      color: var(--color-body);
    }

    .link-btn {
      border: none;
      background: none;
      color: var(--color-primary);
      font-size: var(--text-body-sm);
      font-weight: 600;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: var(--radius-md);
      white-space: nowrap;
    }

    .link-btn:hover {
      background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
    }

    .filter-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--spacing-md);
    }

    .filter-field {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xxs);
    }

    .suggestions-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      flex-wrap: wrap;
    }

    .suggestion-chip {
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-pill);
      padding: 4px 12px;
      font-size: var(--text-body-xs);
      font-weight: 600;
      background-color: var(--color-canvas);
      color: var(--color-body);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .suggestion-chip.active {
      background-color: var(--color-primary);
      border-color: var(--color-primary);
      color: var(--color-on-primary);
    }

    .results-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-sm);
      padding-top: var(--spacing-xs);
      border-top: 1px solid var(--color-surface-pressed);
    }

    .results-title {
      font-size: var(--text-body-xs);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--color-body);
    }

    .results-count {
      margin-left: var(--spacing-xs);
      font-weight: 500;
      letter-spacing: 0;
      text-transform: none;
      color: var(--color-mute);
    }

    .product-results {
      display: flex;
      flex-direction: column;
      max-height: 420px;
      overflow-y: auto;
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-lg);
    }

    .empty-note {
      padding: var(--spacing-xl);
      text-align: center;
      font-size: var(--text-body-sm);
      color: var(--color-body);
    }

    .result-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-sm) var(--spacing-md);
      border-bottom: 1px solid var(--color-surface-pressed);
      background-color: var(--color-canvas);
    }

    .result-row:last-child {
      border-bottom: none;
    }

    .result-row:hover {
      background-color: var(--color-canvas-soft);
    }

    .result-thumb,
    .row-thumb {
      flex-shrink: 0;
      display: grid;
      place-items: center;
      overflow: hidden;
      border-radius: var(--radius-md);
      background-color: var(--color-canvas-softer);
      color: var(--color-mute);
      font-weight: 700;
    }

    .result-thumb {
      width: 44px;
      height: 44px;
      font-size: var(--text-body-md);
    }

    .result-thumb img,
    .row-thumb img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .result-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .result-name {
      margin: 0;
      font-size: var(--text-body-sm);
      font-weight: 600;
      color: var(--color-ink);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .result-meta {
      font-size: var(--text-body-xs);
      color: var(--color-body);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .btn-add {
      flex-shrink: 0;
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-pill);
      padding: 5px 14px;
      font-size: var(--text-body-xs);
      font-weight: 600;
      background-color: var(--color-canvas);
      color: var(--color-ink);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-add:hover {
      background-color: var(--color-primary);
      border-color: var(--color-primary);
      color: var(--color-on-primary);
    }

    .added-pill {
      flex-shrink: 0;
      border-radius: var(--radius-pill);
      padding: 5px 12px;
      font-size: var(--text-body-xs);
      font-weight: 600;
      background-color: color-mix(in srgb, var(--color-primary) 10%, var(--color-canvas));
      color: var(--color-primary);
    }

    .selected-panel {
      background-color: var(--color-canvas-softer);
    }

    .collection-preview {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-lg);
      background-color: var(--color-canvas);
    }

    .preview-media {
      flex-shrink: 0;
      width: 64px;
      height: 48px;
      display: grid;
      place-items: center;
      overflow: hidden;
      border-radius: var(--radius-md);
      background-color: var(--color-canvas-softer);
      color: var(--color-mute);
      font-weight: 700;
    }

    .preview-media img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .preview-info {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .preview-title {
      margin: 0;
      font-size: var(--text-body-md);
      font-weight: 700;
      color: var(--color-ink);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .preview-subtitle {
      margin: 0;
      font-size: var(--text-body-xs);
      color: var(--color-body);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .preview-badge {
      align-self: flex-start;
      margin-top: 2px;
      padding: 1px 8px;
      border-radius: var(--radius-pill);
      background-color: var(--color-canvas-soft);
      color: var(--color-body);
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .drag-hint {
      font-size: var(--text-body-xs);
      color: var(--color-mute);
      white-space: nowrap;
    }

    .selected-head,
    .selected-row {
      display: grid;
      grid-template-columns: 22px 22px minmax(0, 1fr) 58px 30px;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .selected-head {
      padding: 0 var(--spacing-sm);
      font-size: var(--text-body-xs);
      font-weight: 700;
      color: var(--color-mute);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .selected-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      max-height: 420px;
      overflow-y: auto;
      padding-right: 2px;
    }

    .selected-row {
      padding: var(--spacing-sm);
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-md);
      background-color: var(--color-canvas);
    }

    .drag-placeholder {
      height: 52px;
      border: 1px dashed var(--color-mute);
      border-radius: var(--radius-md);
    }

    .drag-handle {
      display: grid;
      place-items: center;
      width: 22px;
      height: 28px;
      padding: 0;
      border: none;
      background: none;
      color: var(--color-mute);
      cursor: grab;
    }

    .drag-handle svg {
      width: 16px;
      height: 16px;
    }

    .row-index {
      font-size: var(--text-body-xs);
      font-weight: 700;
      color: var(--color-mute);
      text-align: center;
    }

    .row-product {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      min-width: 0;
    }

    .row-thumb {
      width: 38px;
      height: 38px;
      font-size: var(--text-body-sm);
    }

    .row-product-text {
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .row-name {
      margin: 0;
      font-size: var(--text-body-sm);
      font-weight: 600;
      color: var(--color-ink);
      line-height: 16px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .row-sku {
      font-size: 11px;
      color: var(--color-mute);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .row-price {
      font-size: var(--text-body-xs);
      font-weight: 600;
      color: var(--color-ink);
      text-align: right;
      white-space: nowrap;
    }

    .row-remove {
      display: grid;
      place-items: center;
      width: 28px;
      height: 28px;
      border: none;
      border-radius: var(--radius-md);
      background: none;
      color: var(--color-mute);
      cursor: pointer;
    }

    .row-remove:hover {
      background-color: color-mix(in srgb, #dc2626 12%, transparent);
      color: #dc2626;
    }

    .row-remove svg {
      width: 16px;
      height: 16px;
    }

    .selected-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-2xl) var(--spacing-lg);
      text-align: center;
      border: 1px dashed var(--color-surface-pressed);
      border-radius: var(--radius-lg);
      background-color: var(--color-canvas);
    }

    .selected-empty-icon {
      width: 28px;
      height: 28px;
      color: var(--color-mute);
    }

    .selected-empty p {
      margin: 0;
      font-size: var(--text-body-sm);
      font-weight: 600;
      color: var(--color-body);
    }

    .selected-empty span {
      font-size: var(--text-body-xs);
      color: var(--color-mute);
    }

    .more-hint {
      margin: 0;
      text-align: center;
      font-size: var(--text-body-xs);
      color: var(--color-mute);
    }

    @media (max-width: 1024px) {
      .product-manager {
        grid-template-columns: minmax(0, 1fr);
      }

      .selected-list {
        max-height: 340px;
      }
    }

    @media (max-width: 768px) {
      .filter-row {
        grid-template-columns: 1fr;
      }

      .selected-head,
      .selected-row {
        grid-template-columns: 22px 22px minmax(0, 1fr) 30px;
      }

      .col-price {
        display: none;
      }
    }
  `,
})
export class CollectionProducts {
  private readonly collectionService = inject(CollectionService);

  readonly selected = input.required<CollectionProductSelection[]>();
  readonly products = input.required<AdminProduct[]>();
  readonly categories = input<AdminCategory[]>([]);
  readonly tags = input<Tag[]>([]);
  readonly loading = input(false);
  readonly title = input('');
  readonly subtitle = input('');
  readonly imageUrl = input('');
  readonly placementLabel = input('');

  readonly selectedChange = output<CollectionProductSelection[]>();

  protected readonly suggestionRules = SUGGESTION_RULES;

  protected readonly productSearch = signal('');
  protected readonly filterCategoryId = signal('');
  protected readonly filterTagId = signal('');
  protected readonly suggestions = signal<Product[]>([]);
  protected readonly suggestionsLoading = signal(false);
  protected readonly suggestionRule = signal<SuggestionRule | null>(null);
  protected readonly resultsLimit = signal(RESULTS_PAGE);
  protected readonly selectedLimit = signal(SELECTED_PAGE);

  protected readonly categoryOptions = computed<SelectOption[]>(() => [
    { value: '', label: 'Todas las categorías' },
    ...this.categories().map((category) => ({
      value: category.id,
      label: category.name,
    })),
  ]);

  protected readonly tagOptions = computed<SelectOption[]>(() => [
    { value: '', label: 'Todos los tags' },
    ...this.tags().map((tag) => ({ value: tag.id, label: tag.name })),
  ]);

  private readonly baseProducts = computed(() =>
    this.suggestionRule() ? this.suggestions() : this.products(),
  );

  protected readonly filteredResults = computed(() => {
    const term = this.productSearch().trim().toLowerCase();
    const categoryId = this.filterCategoryId();
    const tagId = this.filterTagId();

    return this.baseProducts().filter((product) => {
      if (term.length > 0) {
        const haystack = `${product.name} ${product.sku}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (categoryId && product.categoryId !== categoryId) return false;
      if (tagId && !(product.tags ?? []).some((tag) => tag.id === tagId)) {
        return false;
      }
      return true;
    });
  });

  protected readonly visibleResults = computed(() =>
    this.filteredResults().slice(0, this.resultsLimit()),
  );

  protected readonly hasMoreResults = computed(
    () => this.visibleResults().length < this.filteredResults().length,
  );

  protected readonly addableResults = computed(() => {
    const selected = new Set(this.selected().map((item) => item.productId));
    return this.filteredResults().filter((product) => !selected.has(product.id));
  });

  protected readonly visibleSelected = computed(() =>
    this.selected().slice(0, this.selectedLimit()),
  );

  protected readonly hasMoreSelected = computed(
    () => this.visibleSelected().length < this.selected().length,
  );

  protected readonly hasActiveFilters = computed(
    () =>
      this.productSearch().trim().length > 0 ||
      this.filterCategoryId().length > 0 ||
      this.filterTagId().length > 0 ||
      this.suggestionRule() !== null,
  );

  protected isAdded(productId: string): boolean {
    return this.selected().some((item) => item.productId === productId);
  }

  protected onSearchChange(value: string): void {
    this.productSearch.set(value);
    this.resultsLimit.set(RESULTS_PAGE);
  }

  protected onCategoryChange(value: string): void {
    this.filterCategoryId.set(value);
    this.resultsLimit.set(RESULTS_PAGE);
  }

  protected onTagChange(value: string): void {
    this.filterTagId.set(value);
    this.resultsLimit.set(RESULTS_PAGE);
  }

  protected clearFilters(): void {
    this.productSearch.set('');
    this.filterCategoryId.set('');
    this.filterTagId.set('');
    this.suggestionRule.set(null);
    this.suggestions.set([]);
    this.resultsLimit.set(RESULTS_PAGE);
  }

  protected clearSuggestion(): void {
    this.suggestionRule.set(null);
    this.suggestions.set([]);
    this.resultsLimit.set(RESULTS_PAGE);
  }

  protected toggleSuggestion(rule: SuggestionRule): void {
    if (this.suggestionRule() === rule) {
      this.clearSuggestion();
      return;
    }
    this.suggestionRule.set(rule);
    this.suggestionsLoading.set(true);
    this.resultsLimit.set(RESULTS_PAGE);
    this.collectionService
      .getSuggestions(rule, { limit: 50 })
      .pipe(finalize(() => this.suggestionsLoading.set(false)))
      .subscribe((products) => this.suggestions.set(products));
  }

  protected loadMoreResults(): void {
    if (!this.hasMoreResults()) return;
    this.resultsLimit.update((limit) => limit + RESULTS_PAGE);
  }

  protected loadMoreSelected(): void {
    if (!this.hasMoreSelected()) return;
    this.selectedLimit.update((limit) => limit + SELECTED_PAGE);
  }

  protected addProduct(productId: string): void {
    if (this.isAdded(productId)) return;
    const next = [
      ...this.selected(),
      { productId, position: this.selected().length },
    ];
    this.selectedLimit.set(Math.max(this.selectedLimit(), next.length));
    this.selectedChange.emit(next);
  }

  protected addAllResults(): void {
    const products = [...this.selected()];
    const selected = new Set(products.map((item) => item.productId));
    for (const product of this.filteredResults()) {
      if (selected.has(product.id)) continue;
      selected.add(product.id);
      products.push({ productId: product.id, position: products.length });
    }
    this.selectedLimit.set(products.length);
    this.selectedChange.emit(products);
  }

  protected removeProduct(productId: string): void {
    this.selectedChange.emit(
      this.selected()
        .filter((item) => item.productId !== productId)
        .map((item, index) => ({ ...item, position: index })),
    );
  }

  protected dropProduct(event: CdkDragDrop<CollectionProductSelection[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    const products = [...this.selected()];
    moveItemInArray(products, event.previousIndex, event.currentIndex);
    this.selectedChange.emit(
      products.map((item, position) => ({ ...item, position })),
    );
  }

  protected productById(productId: string): AdminProduct | undefined {
    return this.products().find((product) => product.id === productId);
  }

  protected productImage(product: AdminProduct | Product): string | null {
    return product.featuredImage || product.images?.[0] || null;
  }

  protected productImageById(productId: string): string | null {
    const product = this.productById(productId);
    return product ? this.productImage(product) : null;
  }

  protected productName(productId: string): string {
    return this.productById(productId)?.name ?? 'Producto';
  }

  protected productPrice(productId: string): number {
    return this.productById(productId)?.price ?? 0;
  }

  protected productCategory(productId: string): string {
    const product = this.productById(productId);
    if (!product) return '—';
    if (product.category?.name) return product.category.name;
    return (
      this.categories().find((category) => category.id === product.categoryId)
        ?.name ?? '—'
    );
  }

  protected categoryName(product: AdminProduct | Product): string {
    if (product.category?.name) return product.category.name;
    return (
      this.categories().find((category) => category.id === product.categoryId)
        ?.name ?? 'Sin categoría'
    );
  }
}
