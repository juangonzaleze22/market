import { Component, inject, OnInit } from '@angular/core';
import { BranchService } from '../../core/services/branch.service';
import { BannerCarousel } from '../../shared/ui/banner-carousel';
import { CollectionsSection } from '../../shared/ui/collections-section';
import { Faq } from '../../shared/ui/faq';
import { FlashSalesSection } from '../../shared/ui/flash-sales-section';
import { TrustStrip } from '../../shared/ui/trust-strip';

@Component({
  selector: 'app-home',
  imports: [
    BannerCarousel,
    FlashSalesSection,
    CollectionsSection,
    TrustStrip,
    Faq,
  ],
  template: `
    <!-- Saludo -->
    <section class="container-max home-greeting" data-testid="home-greeting">
      <h1 class="greeting-title">Hola,</h1>
      <p class="greeting-subtitle">¿Qué deseas pedir hoy?</p>
    </section>

    <!-- Banner Carousel -->
    <app-banner-carousel />

    <!-- Flash Sales -->
    <app-flash-sales-section />

    <!-- Secciones de merchandising curadas -->
    <app-collections-section />

    <!-- Beneficios -->
    <app-trust-strip />

    <!-- Preguntas frecuentes -->
    <app-faq />
  `,
  styles: `
    .home-greeting {
      padding-top: var(--spacing-lg);
      padding-bottom: var(--spacing-xs);
    }

    .greeting-title {
      margin: 0;
      font-size: var(--text-display-md);
      line-height: var(--text-display-md--line-height);
      font-weight: 700;
      color: var(--color-ink);
    }

    .greeting-subtitle {
      margin: 2px 0 0;
      font-size: var(--text-body-md);
      line-height: var(--text-body-md--line-height);
      color: var(--color-body);
    }

    @media (min-width: 768px) {
      .home-greeting {
        display: none;
      }
    }
  `,
})
export class Home implements OnInit {
  private readonly branchService = inject(BranchService);

  ngOnInit(): void {
    this.branchService.load();
  }
}
