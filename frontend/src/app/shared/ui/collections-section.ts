import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  effect,
  inject,
  OnInit,
  signal,
  untracked,
} from '@angular/core';
import { CollectionService, CollectionSection } from '../../core/services/collection.service';
import { BranchService } from '../../core/services/branch.service';
import { ProductCard } from './product-card';
import { SectionHeader } from './section-header';

@Component({
  selector: 'app-collections-section',
  imports: [ProductCard, SectionHeader],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    @for (section of visibleSections(); track section.id) {
      <section
        class="container-max py-3xl"
        [attr.data-testid]="'collection-' + section.slug"
      >
        <app-section-header
          [subtitle]="section.subtitle ?? ''"
          [titleBold]="section.title"
          link="/shop"
          [linkQueryParams]="{ collection: section.slug }"
          linkText="Ver más"
        />
        <swiper-container
          navigation='{"addIcons": false}'
          slides-per-view="2"
          space-between="12"
          free-mode="true"
          class="pb-md mt-lg"
          [attr.data-testid]="'collection-carousel-' + section.slug"
          breakpoints='{"640": {"slidesPerView": 3, "spaceBetween": 12}, "768": {"slidesPerView": 4, "spaceBetween": 14}, "1024": {"slidesPerView": 5, "spaceBetween": 16}}'
        >
          <svg
            slot="button-prev"
            class="carousel-arrow-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <svg
            slot="button-next"
            class="carousel-arrow-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
          @for (product of section.products; track product.id) {
            <swiper-slide>
              <app-product-card [product]="product" />
            </swiper-slide>
          }
        </swiper-container>
      </section>
    }
  `,
  styles: `
    swiper-container::part(button-prev),
    swiper-container::part(button-next) {
      width: 38px;
      height: 38px;
      margin-top: 0;
      top: 36%;
      transform: translateY(-50%);
      border-radius: var(--radius-full);
      border: 1px solid var(--color-surface-pressed);
      background-color: var(--color-canvas);
      color: var(--color-ink);
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.14);
      transition:
        box-shadow 0.2s ease,
        background-color 0.2s ease;
    }

    swiper-container::part(button-prev) {
      left: 6px;
    }

    swiper-container::part(button-next) {
      right: 6px;
    }

    swiper-container::part(button-prev):hover,
    swiper-container::part(button-next):hover {
      background-color: var(--color-canvas-soft);
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
    }

    .carousel-arrow-icon {
      width: 16px;
      height: 16px;
    }

    @media (max-width: 767px) {
      swiper-container::part(button-prev),
      swiper-container::part(button-next) {
        display: none;
      }
    }
  `,
})
export class CollectionsSection implements OnInit {
  private readonly collectionService = inject(CollectionService);
  private readonly branchService = inject(BranchService);

  protected readonly sections = signal<CollectionSection[]>([]);

  protected readonly visibleSections = computed(() => {
    const seen = new Set<string>();
    return this.sections()
      .map((section) => ({
        ...section,
        products: (section.products ?? []).filter((product) => {
          if (seen.has(product.id)) return false;
          seen.add(product.id);
          return true;
        }),
      }))
      .filter((section) => section.products.length > 0);
  });

  private readonly branchReload = effect(() => {
    const loaded = this.branchService.loaded();
    this.branchService.selectedBranch();
    if (!loaded) return;
    untracked(() => this.loadSections());
  });

  ngOnInit(): void {
    this.branchService.load();
  }

  private loadSections(): void {
    this.collectionService
      .getSections('home')
      .subscribe((sections) => this.sections.set(sections));
  }
}
