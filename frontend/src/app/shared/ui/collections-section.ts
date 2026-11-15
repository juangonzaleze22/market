import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
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
    @for (section of sections(); track section.id) {
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
          slides-per-view="2"
          space-between="12"
          free-mode="true"
          class="pb-md mt-lg"
          [attr.data-testid]="'collection-carousel-' + section.slug"
          breakpoints='{"640": {"slidesPerView": 3, "spaceBetween": 12}, "768": {"slidesPerView": 4, "spaceBetween": 14}, "1024": {"slidesPerView": 5, "spaceBetween": 16}}'
        >
          @for (product of section.products ?? []; track product.id) {
            <swiper-slide>
              <app-product-card [product]="product" />
            </swiper-slide>
          }
        </swiper-container>
      </section>
    }
  `,
})
export class CollectionsSection implements OnInit {
  private readonly collectionService = inject(CollectionService);
  private readonly branchService = inject(BranchService);

  protected readonly sections = signal<CollectionSection[]>([]);

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
