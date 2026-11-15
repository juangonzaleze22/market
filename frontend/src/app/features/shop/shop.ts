import { Component, computed, effect, inject, OnInit, signal, untracked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest } from 'rxjs';
import { Product, ProductService, Tag } from '../../core/services/product.service';
import { Category, CategoryService } from '../../core/services/category.service';
import { BranchService } from '../../core/services/branch.service';
import { CollectionSection, CollectionService } from '../../core/services/collection.service';
import { ProductCard } from '../../shared/ui/product-card';
import { PageHero, Breadcrumb } from '../../shared/ui/page-hero';
import { ActiveFilters, ActiveFilter } from '../../shared/ui/active-filters';
import { CollectionsRail } from '../../shared/ui/collections-rail';
import { ShopFilters, ShopFilterState } from './shop-filters';
import { SortDropdown, SortOption } from './sort-dropdown';

@Component({
  selector: 'app-shop',
  imports: [
    ProductCard,
    PageHero,
    ActiveFilters,
    CollectionsRail,
    ShopFilters,
    SortDropdown,
  ],
  template: `
    <app-page-hero [title]="heroTitle()" [breadcrumbs]="breadcrumbs()" />

    <app-collections-rail [collections]="collections()" [activeSlug]="filterState().collectionSlug" />

    <section class="container-max shop-layout">
      @if (collectionDetail(); as collection) {
        <div class="collection-context" data-testid="collection-context">
          <span class="collection-context-text">
            Viendo la colección <strong>{{ collection.title }}</strong>
          </span>
          <button
            type="button"
            class="collection-context-clear"
            (click)="clearCollection()"
            data-testid="clear-collection"
          >
            Ver todo el catálogo
          </button>
        </div>
      }

      <!-- Active Filters -->
      <div class="shop-active-row">
        <app-active-filters
          [filters]="activeFilterTags()"
          (remove)="removeFilter($event)"
          (clearAll)="clearFilters()"
        />
      </div>

      <!-- Results count + Sort + Mobile filter toggle -->
      <div class="shop-toolbar">
        <span class="results-count" data-testid="shop-results-count">
          Mostrando {{ filteredProducts().length }} resultados
        </span>
        <div class="toolbar-right">
          <button
            type="button"
            class="mobile-filter-btn"
            (click)="mobileFiltersOpen.set(true)"
            data-testid="mobile-filter-toggle"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="filter-icon">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Filtros
          </button>
          <app-sort-dropdown
            [currentSort]="sortOption()"
            (sortChange)="onSortChange($event)"
          />
        </div>
      </div>

      <!-- Main content: Sidebar + Grid -->
      <div class="shop-content">
        <!-- Desktop sidebar -->
        <div class="shop-sidebar-desktop">
          <app-shop-filters
            [categories]="categories()"
            [tags]="tags()"
            [priceBounds]="priceBounds()"
            [initialFilters]="filterState()"
            (filterChange)="onFilterChange($event)"
            (clearAll)="clearFilters()"
          />
        </div>

        <!-- Product grid -->
        <div class="shop-grid" data-testid="shop-grid">
          @for (product of filteredProducts(); track product.id) {
            <app-product-card [product]="product" />
          } @empty {
            <div class="empty-state">
              <p class="empty-text">No se encontraron productos con los filtros seleccionados.</p>
              <button type="button" class="btn-primary" (click)="clearFilters()">
                Limpiar filtros
              </button>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- Mobile filter drawer -->
    @if (mobileFiltersOpen()) {
      <div class="mobile-drawer-overlay" (click)="mobileFiltersOpen.set(false)"></div>
      <div class="mobile-drawer">
        <div class="mobile-drawer-header">
          <h3 class="mobile-drawer-title">Filtros</h3>
          <button
            type="button"
            class="mobile-drawer-close"
            (click)="mobileFiltersOpen.set(false)"
            data-testid="mobile-filter-close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="close-icon">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <app-shop-filters
          [categories]="categories()"
          [tags]="tags()"
          [priceBounds]="priceBounds()"
          [initialFilters]="filterState()"
          (filterChange)="onFilterChange($event); mobileFiltersOpen.set(false)"
          (clearAll)="clearFilters(); mobileFiltersOpen.set(false)"
        />
      </div>
    }
  `,
  styles: `
    .shop-layout {
      padding-top: var(--spacing-2xl);
      padding-bottom: var(--spacing-3xl);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
      overflow-x: hidden;
    }

    .shop-active-row {
      min-height: 0;
    }

    .collection-context {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-md);
      flex-wrap: wrap;
      padding: var(--spacing-sm) var(--spacing-lg);
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-pill);
      background-color: var(--color-canvas-soft);
    }

    .collection-context-text {
      font-size: var(--text-body-sm);
      color: var(--color-body);
    }

    .collection-context-text strong {
      color: var(--color-ink);
      font-weight: 600;
    }

    .collection-context-clear {
      border: none;
      background: none;
      color: var(--color-primary);
      font-size: var(--text-body-sm);
      font-weight: 600;
      cursor: pointer;
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: var(--radius-md);
      transition: background-color 0.2s ease;
      white-space: nowrap;
    }

    .collection-context-clear:hover {
      background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
    }

    .shop-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-md);
      flex-wrap: wrap;
    }

    .results-count {
      font-size: var(--text-body-sm);
      color: var(--color-body);
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .mobile-filter-btn {
      display: none;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) var(--spacing-lg);
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-pill);
      background-color: var(--color-canvas);
      font-size: var(--text-body-sm);
      font-weight: 600;
      color: var(--color-ink);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .mobile-filter-btn:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }

    .filter-icon {
      width: 16px;
      height: 16px;
    }

    .shop-content {
      display: flex;
      gap: var(--spacing-2xl);
      align-items: flex-start;
      min-width: 0;
    }

    .shop-sidebar-desktop {
      flex-shrink: 0;
    }

    .shop-grid {
      flex: 1;
      min-width: 0;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--spacing-lg);
    }

    .empty-state {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-lg);
      padding: var(--spacing-3xl);
    }

    .empty-text {
      font-size: var(--text-body-lg);
      color: var(--color-body);
    }

    .mobile-drawer-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 100;
    }

    .mobile-drawer {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      width: 320px;
      max-width: 85vw;
      background-color: var(--color-canvas);
      z-index: 101;
      overflow-y: auto;
      padding: var(--spacing-lg);
    }

    .mobile-drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--spacing-lg);
    }

    .mobile-drawer-title {
      font-size: var(--text-display-sm);
      font-weight: 700;
      color: var(--color-ink);
      margin: 0;
    }

    .mobile-drawer-close {
      display: grid;
      place-items: center;
      width: 36px;
      height: 36px;
      border: none;
      background-color: var(--color-canvas-soft);
      border-radius: var(--radius-full);
      cursor: pointer;
      color: var(--color-ink);
      transition: background-color 0.2s ease;
    }

    .mobile-drawer-close:hover {
      background-color: var(--color-surface-pressed);
    }

    .close-icon {
      width: 20px;
      height: 20px;
    }

    @media (max-width: 1024px) {
      .shop-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .shop-sidebar-desktop {
        display: none;
      }

      .mobile-filter-btn {
        display: flex;
      }

      .mobile-drawer-overlay {
        display: block;
      }

      .mobile-drawer {
        display: block;
      }

      .shop-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: var(--spacing-md);
      }
    }

    @media (max-width: 480px) {
      .shop-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: var(--spacing-sm);
      }
    }
  `,
})
export class Shop implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly branchService = inject(BranchService);
  private readonly collectionService = inject(CollectionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly branchReload = effect(() => {
    const loaded = this.branchService.loaded();
    this.branchService.selectedBranch();
    if (!loaded) return;
    untracked(() => {
      this.loadProducts();
      this.loadShopCollections();
    });
  });

  protected readonly collections = signal<CollectionSection[]>([]);
  protected readonly collectionDetail = signal<CollectionSection | null>(null);

  protected readonly heroTitle = computed(
    () => this.collectionDetail()?.title ?? 'Tienda',
  );

  protected readonly breadcrumbs = computed<Breadcrumb[]>(() => {
    const collection = this.collectionDetail();
    return collection
      ? [{ label: 'Inicio', link: '/' }, { label: 'Tienda', link: '/shop' }, { label: collection.title }]
      : [{ label: 'Inicio', link: '/' }, { label: 'Tienda' }];
  });

  protected readonly products = signal<Product[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly tags = signal<Tag[]>([]);

  // Filter state (synced with URL)
  protected readonly filterState = signal<ShopFilterState>({
    selectedCategorySlugs: [],
    selectedTagSlugs: [],
    collectionSlug: null,
    minPrice: 0,
    maxPrice: 500,
    includeOutOfStock: false,
  });

  protected readonly sortOption = signal<SortOption>('default');
  protected readonly mobileFiltersOpen = signal(false);

  // Price bounds from products (for slider max)
  protected readonly priceBounds = computed(() => {
    const all = this.products();
    if (all.length === 0) return { min: 0, max: 500 };
    const prices = all.map((p) => p.price);
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    };
  });

  protected readonly filteredProducts = computed(() => {
    const list = this.products();
    if (!this.filterState().includeOutOfStock) return list;
    return [...list].sort(
      (a, b) => (a.stock > 0 ? 0 : 1) - (b.stock > 0 ? 0 : 1),
    );
  });

  // Active filter tags for display
  protected readonly activeFilterTags = computed<ActiveFilter[]>(() => {
    const tags: ActiveFilter[] = [];
    const state = this.filterState();

    for (const slug of state.selectedCategorySlugs) {
      const cat = this.categories().find((c) => c.slug === slug);
      if (cat) {
        tags.push({ label: cat.name, type: 'category', value: slug });
      }
    }

    for (const slug of state.selectedTagSlugs) {
      const tag = this.tags().find((t) => t.slug === slug);
      if (tag) {
        tags.push({ label: tag.name, type: 'tag', value: slug });
      }
    }

    if (state.collectionSlug) {
      const collection =
        this.collections().find((c) => c.slug === state.collectionSlug) ??
        (this.collectionDetail()?.slug === state.collectionSlug
          ? this.collectionDetail()
          : null);
      if (collection) {
        tags.push({
          label: collection.title,
          type: 'collection',
          value: collection.slug,
        });
      }
    }

    if (state.minPrice > 0 || state.maxPrice < this.priceBounds().max) {
      tags.push({
        label: `Precio: $\${state.minPrice} - $\${state.maxPrice}`,
        type: 'price',
        value: 'price',
      });
    }

    if (state.includeOutOfStock) {
      tags.push({
        label: 'Incluye agotados',
        type: 'stock',
        value: 'out-of-stock',
      });
    }

    // Search from URL
    const search = this.route.snapshot.queryParams['search'];
    if (search) {
      tags.push({
        label: `Búsqueda: "\${search}"`,
        type: 'search',
        value: 'search',
      });
    }

    return tags;
  });

  ngOnInit(): void {
    this.branchService.load();
    this.loadShopCollections();
    combineLatest([
      this.categoryService.getAll(),
      this.productService.getTags(),
      this.route.queryParams,
    ]).subscribe(([categories, tags, params]) => {
      this.categories.set(categories);
      this.tags.set(tags);
      this.readFiltersFromUrl(params);
      this.loadProducts();
    });
  }

  protected onFilterChange(state: ShopFilterState): void {
    this.filterState.set(state);
    this.writeFiltersToUrl();
    this.loadProductsWithFilters();
  }

  protected onSortChange(sort: SortOption): void {
    this.sortOption.set(sort);
    this.writeFiltersToUrl();
    this.loadProductsWithFilters();
  }

  protected removeFilter(filter: ActiveFilter): void {
    if (filter.type === 'search') {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { search: null },
        queryParamsHandling: 'merge',
      });
      this.loadProductsWithFilters();
      return;
    }

    this.filterState.update((s) => ({
      ...s,
      selectedCategorySlugs:
        filter.type === 'category'
          ? s.selectedCategorySlugs.filter((slug) => slug !== filter.value)
          : s.selectedCategorySlugs,
      selectedTagSlugs:
        filter.type === 'tag'
          ? s.selectedTagSlugs.filter((slug) => slug !== filter.value)
          : s.selectedTagSlugs,
      collectionSlug:
        filter.type === 'collection' ? null : s.collectionSlug,
      minPrice: filter.type === 'price' ? 0 : s.minPrice,
      maxPrice: filter.type === 'price' ? this.priceBounds().max : s.maxPrice,
      includeOutOfStock:
        filter.type === 'stock' ? false : s.includeOutOfStock,
    }));
    this.writeFiltersToUrl();
    this.loadProductsWithFilters();
  }

  protected clearCollection(): void {
    this.filterState.update((state) => ({ ...state, collectionSlug: null }));
    this.writeFiltersToUrl();
    this.loadProducts();
  }

  protected clearFilters(): void {
    this.filterState.set({
      selectedCategorySlugs: [],
      selectedTagSlugs: [],
      collectionSlug: null,
      minPrice: 0,
      maxPrice: this.priceBounds().max,
      includeOutOfStock: false,
    });
    this.sortOption.set('default');
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
    });
    this.loadProductsWithFilters();
  }

  private readFiltersFromUrl(params: Record<string, string>): void {
    const categories = params['category']
      ? params['category'].split(',').filter(Boolean)
      : [];
    const tagSlugs = params['tag']
      ? params['tag'].split(',').filter(Boolean)
      : [];
    const collectionSlug = params['collection'] || null;
    const minPrice = params['minPrice'] ? Number(params['minPrice']) : 0;
    const maxPrice = params['maxPrice'] ? Number(params['maxPrice']) : 500;
    const sort = (params['sort'] as SortOption) || 'default';
    const includeOutOfStock = params['agotados'] === '1';

    this.filterState.set({
      selectedCategorySlugs: categories,
      selectedTagSlugs: tagSlugs,
      collectionSlug,
      minPrice,
      maxPrice,
      includeOutOfStock,
    });
    this.sortOption.set(sort);
  }

  private writeFiltersToUrl(): void {
    const state = this.filterState();
    const queryParams: Record<string, string | null> = {};

    queryParams['category'] =
      state.selectedCategorySlugs.length > 0
        ? state.selectedCategorySlugs.join(',')
        : null;
    queryParams['tag'] =
      state.selectedTagSlugs.length > 0
        ? state.selectedTagSlugs.join(',')
        : null;
    queryParams['collection'] = state.collectionSlug;
    queryParams['minPrice'] =
      state.minPrice > 0 ? String(state.minPrice) : null;
    queryParams['maxPrice'] =
      state.maxPrice < this.priceBounds().max ? String(state.maxPrice) : null;
    queryParams['sort'] =
      this.sortOption() !== 'default' ? this.sortOption() : null;
    queryParams['agotados'] = state.includeOutOfStock ? '1' : null;

    // Preserve search param
    const currentSearch = this.route.snapshot.queryParams['search'];
    if (currentSearch) {
      queryParams['search'] = currentSearch;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    });
  }

  private loadProducts(): void {
    const state = this.filterState();
    if (state.collectionSlug) {
      this.collectionService.getBySlug(state.collectionSlug).subscribe({
        next: (collection) => {
          this.collectionDetail.set(collection);
          this.fetchProducts(collection.productIds ?? []);
        },
        error: () => {
          this.collectionDetail.set(null);
          this.products.set([]);
        },
      });
      return;
    }

    this.collectionDetail.set(null);
    this.fetchProducts(undefined);
  }

  private fetchProducts(ids?: string[]): void {
    const state = this.filterState();
    const search = this.route.snapshot.queryParams['search'] || '';
    if (ids && ids.length === 0) {
      this.products.set([]);
      return;
    }

    // Resolve category IDs from slugs (API supports a single category for now)
    const categoryIds = state.selectedCategorySlugs
      .map((slug) => this.categories().find((c) => c.slug === slug)?.id)
      .filter((id): id is string => !!id);
    const categoryId = categoryIds[0] || undefined;

    // Resolve tag IDs from slugs. Multiple tags are combined with OR.
    const tagIds = state.selectedTagSlugs
      .map((slug) => this.tags().find((t) => t.slug === slug)?.id)
      .filter((id): id is string => !!id);

    this.productService
      .getAll({
        ids,
        categoryId,
        tagIds: tagIds.length > 0 ? tagIds : undefined,
        search: search || undefined,
        minPrice: state.minPrice > 0 ? state.minPrice : undefined,
        maxPrice:
          state.maxPrice < this.priceBounds().max
            ? state.maxPrice
            : undefined,
        sort: this.sortOption() !== 'default' ? this.sortOption() : undefined,
        inStock: state.includeOutOfStock ? undefined : true,
      })
      .subscribe((products) => this.products.set(products));
  }

  private loadShopCollections(): void {
    this.collectionService
      .getSections('shop')
      .subscribe((collections) => this.collections.set(collections));
  }

  private loadProductsWithFilters(): void {
    this.loadProducts();
  }
}
