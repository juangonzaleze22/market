import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface Breadcrumb {
  label: string;
  link?: string;
}

@Component({
  selector: 'app-page-hero',
  imports: [RouterLink],
  template: `
    <section class="page-hero" data-testid="page-hero">
      <div class="page-hero-pattern"></div>
      <div class="page-hero-content container-max">
        <h1 class="page-hero-title" data-testid="page-hero-title">{{ title() }}</h1>
        @if (breadcrumbs().length > 0) {
          <nav class="page-hero-breadcrumbs" aria-label="Breadcrumb" data-testid="page-hero-breadcrumbs">
            @for (crumb of breadcrumbs(); track crumb.label; let last = $last) {
              @if (crumb.link && !last) {
                <a [routerLink]="crumb.link" class="breadcrumb-link">{{ crumb.label }}</a>
              } @else {
                <span [class.breadcrumb-current]="last">{{ crumb.label }}</span>
              }
              @if (!last) {
                <span class="breadcrumb-separator">/</span>
              }
            }
          </nav>
        }
      </div>
    </section>
  `,
  styles: `
    .page-hero {
      position: relative;
      background-color: var(--color-canvas-softer);
      padding: var(--spacing-3xl) 0;
      overflow: hidden;
    }

    .page-hero-pattern {
      position: absolute;
      inset: 0;
      opacity: 0.65;
      mix-blend-mode: multiply;
      background-image: url('/assets/icons/bg-cover-repeat.webp');
      background-repeat: repeat;
      background-size: 420px auto;
      pointer-events: none;
    }

    .page-hero-content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-md);
      text-align: center;
    }

    .page-hero-title {
      font-size: var(--text-display-xl);
      line-height: var(--text-display-xl--line-height);
      font-weight: 700;
      color: var(--color-ink);
      margin: 0;
    }

    .page-hero-breadcrumbs {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-size: var(--text-body-sm);
      line-height: 18px;
    }

    .breadcrumb-link {
      color: var(--color-body);
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .breadcrumb-link:hover {
      color: var(--color-link);
    }

    .breadcrumb-separator {
      color: var(--color-mute);
    }

    .breadcrumb-current {
      color: var(--color-ink);
      font-weight: 500;
    }
  `,
})
export class PageHero {
  readonly title = input.required<string>();
  readonly breadcrumbs = input<Breadcrumb[]>([]);
}
