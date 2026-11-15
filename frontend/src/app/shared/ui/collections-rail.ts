import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CollectionSection } from '../../core/services/collection.service';

@Component({
  selector: 'app-collections-rail',
  imports: [RouterLink],
  template: `
    @if (collections().length > 0) {
      <section class="container-max collections-rail" data-testid="shop-collections-rail">
        <div class="rail-scroll">
          @for (collection of collections(); track collection.id) {
            <a
              class="collection-card"
              [class.is-active]="collection.slug === activeSlug()"
              routerLink="/shop"
              [queryParams]="{ collection: collection.slug }"
              [attr.data-testid]="'shop-collection-' + collection.slug"
            >
              <div class="collection-media">
                @if (collection.imageUrl) {
                  <img
                    [src]="collection.imageUrl"
                    [alt]="collection.title"
                    loading="lazy"
                    decoding="async"
                  />
                } @else {
                  <span class="collection-placeholder">{{ collection.title.charAt(0) }}</span>
                }
              </div>
              <div class="collection-info">
                <p class="collection-title">{{ collection.title }}</p>
                <span class="collection-count">{{ collection.productCount ?? 0 }} productos</span>
              </div>
            </a>
          }
        </div>
      </section>
    }
  `,
  styles: `
    .collections-rail {
      padding-top: var(--spacing-xl);
    }

    .rail-scroll {
      display: flex;
      gap: var(--spacing-md);
      overflow-x: auto;
      overscroll-behavior-x: contain;
      scrollbar-width: none;
      padding-bottom: var(--spacing-xxs);
    }

    .rail-scroll::-webkit-scrollbar {
      display: none;
    }

    .collection-card {
      flex: 0 0 220px;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm);
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-xl);
      background-color: var(--color-canvas);
      text-decoration: none;
      color: inherit;
      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease;
    }

    .collection-card:hover {
      border-color: var(--color-primary);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    }

    .collection-card.is-active {
      border-color: var(--color-primary);
      background-color: var(--color-canvas-soft);
    }

    .collection-media {
      display: grid;
      place-items: center;
      aspect-ratio: 16 / 9;
      overflow: hidden;
      background-color: var(--color-canvas-softer);
      border-radius: var(--radius-lg);
    }

    .collection-media img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .collection-placeholder {
      font-size: var(--text-display-lg);
      font-weight: 700;
      color: var(--color-mute);
    }

    .collection-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 0 var(--spacing-xs) var(--spacing-xs);
    }

    .collection-title {
      margin: 0;
      font-size: var(--text-body-md);
      font-weight: 600;
      line-height: 20px;
      color: var(--color-ink);
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .collection-count {
      font-size: var(--text-body-xs);
      color: var(--color-body);
    }

    @media (max-width: 640px) {
      .collection-card {
        flex-basis: 168px;
      }
    }
  `,
})
export class CollectionsRail {
  readonly collections = input<CollectionSection[]>([]);
  readonly activeSlug = input<string | null>(null);
}
