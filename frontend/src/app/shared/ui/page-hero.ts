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
      opacity: 0.4;
      background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231a5632' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
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
      font-size: var(--text-display-xxl);
      line-height: 52px;
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
      color: var(--color-primary);
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
