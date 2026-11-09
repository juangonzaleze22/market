import {
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
  inject,
  OnInit,
  signal,
  untracked,
} from '@angular/core';
import { Product, ProductService } from '../../core/services/product.service';
import { BranchService } from '../../core/services/branch.service';
import { ProductCard } from '../../shared/ui/product-card';
import { TrustStrip } from '../../shared/ui/trust-strip';
import { SectionHeader } from '../../shared/ui/section-header';
import { Faq } from '../../shared/ui/faq';
import { BannerCarousel } from '../../shared/ui/banner-carousel';
import { FlashSalesSection } from '../../shared/ui/flash-sales-section';

@Component({
  selector: 'app-home',
  imports: [
    ProductCard,
    TrustStrip,
    SectionHeader,
    Faq,
    BannerCarousel,
    FlashSalesSection,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <!-- Banner Carousel -->
    <app-banner-carousel />

    <!-- Flash Sales -->
    <app-flash-sales-section />

    <!-- Nuestras recomendaciones -->
    <section class="container-max py-3xl">
      <app-section-header
        subtitle="Destacados"
        titleBold="Nuestras"
        titleAccent="recomendaciones"
        link="/shop"
        linkText="Ver todos"
      />
      <swiper-container
        slides-per-view="2"
        space-between="12"
        free-mode="true"
        class="pb-md mt-lg"
        data-testid="recommendations-carousel"
        breakpoints='{"640": {"slidesPerView": 3, "spaceBetween": 12}, "768": {"slidesPerView": 4, "spaceBetween": 14}, "1024": {"slidesPerView": 5, "spaceBetween": 16}}'
      >
        @for (product of recommendedProducts(); track product.id) {
          <swiper-slide>
            <app-product-card [product]="product" />
          </swiper-slide>
        } @empty {
          <p class="col-span-full text-body text-center py-3xl">
            No hay productos disponibles en esta categoría.
          </p>
        }
      </swiper-container>
    </section>

    <!-- Novedades -->
    <section class="container-max pb-3xl" data-testid="new-arrivals">
      <app-section-header
        subtitle="Recién llegados"
        titleBold="Novedades"
        titleAccent="de la tienda"
        link="/shop"
        linkText="Ver todos"
      />
      <swiper-container
        slides-per-view="2"
        space-between="12"
        free-mode="true"
        class="pb-md mt-lg"
        data-testid="new-arrivals-carousel"
        breakpoints='{"640": {"slidesPerView": 3, "spaceBetween": 12}, "768": {"slidesPerView": 4, "spaceBetween": 14}, "1024": {"slidesPerView": 5, "spaceBetween": 16}}'
      >
        @for (product of newArrivals(); track product.id) {
          <swiper-slide>
            <app-product-card [product]="product" />
          </swiper-slide>
        } @empty {
          <p class="col-span-full text-body text-center py-3xl">
            No hay productos disponibles en esta categoría.
          </p>
        }
      </swiper-container>
    </section>

    <!-- Productos populares con tabs -->
    <section class="container-max pb-3xl">
      <app-section-header
        subtitle="Lo que la gente compra"
        titleBold="Best Seller"
        titleAccent="Products"
        link="/shop"
        linkText="Ver todos los productos"
        [tabs]="tabs()"
        [activeTab]="activeTab()"
        (tabChange)="activeTab.set($event)"
      />
      <div
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-lg mt-lg"
        data-testid="popular-product-grid"
      >
        @for (product of visibleProducts(); track product.id) {
          <app-product-card [product]="product" />
        } @empty {
          <p class="col-span-full text-body text-center py-3xl">
            No hay productos disponibles en esta categoría.
          </p>
        }
      </div>
    </section>

    <!-- Beneficios -->
    <app-trust-strip />

    <!-- Preguntas frecuentes -->
    <app-faq />
  `,
})
export class Home implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly branchService = inject(BranchService);

  protected readonly products = signal<Product[]>([]);
  protected readonly bestSellers = signal<Product[]>([]);
  protected readonly activeTab = signal('All');

  private readonly branchReload = effect(() => {
    const loaded = this.branchService.loaded();
    this.branchService.selectedBranch();
    if (!loaded) return;
    untracked(() => this.loadProducts());
  });

  protected readonly availableProducts = computed(() =>
    this.products().filter((p) => p.stock > 0),
  );

  protected readonly newArrivals = computed(() =>
    [...this.availableProducts()]
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
      .slice(0, 8),
  );

  protected readonly tabs = computed(() => {
    const names = this.availableProducts()
      .map((p) => p.category?.name)
      .filter((n): n is string => !!n);
    return ['All', ...new Set(names)];
  });

  protected readonly recommendedProducts = computed(() => {
    const seen = new Set<string>();
    const recommended: Product[] = [];

    for (const product of [...this.bestSellers(), ...this.products()]) {
      if (seen.has(product.id)) continue;
      seen.add(product.id);
      if (!(product.stock > 0)) continue;
      recommended.push(product);
      if (recommended.length === 8) break;
    }

    return recommended;
  });

  protected readonly visibleProducts = computed(() => {
    const available = this.availableProducts();
    if (this.activeTab() === 'All') return available;
    return available.filter((p) => p.category?.name === this.activeTab());
  });

  ngOnInit(): void {
    this.branchService.load();
  }

  private loadProducts(): void {
    this.productService.getAll().subscribe((products) => this.products.set(products));
    this.productService.getBestSellers(8).subscribe((products) => this.bestSellers.set(products));
  }
}
