import { Component, input, output } from '@angular/core';

export interface ActiveFilter {
  label: string;
  type: 'category' | 'tag' | 'price' | 'rating' | 'stock' | 'search' | 'bestDeals';
  value: string;
}

@Component({
  selector: 'app-active-filters',
  template: `
    @if (filters().length > 0) {
      <div class="active-filters" data-testid="active-filters">
        <div class="filter-tags">
          @for (filter of filters(); track filter.type + filter.value) {
            <span class="filter-tag" [attr.data-testid]="'active-filter-tag-' + filter.type">
              <span class="filter-tag-label">{{ filter.label }}</span>
              <button
                type="button"
                class="filter-tag-remove"
                (click)="remove.emit(filter)"
                [attr.aria-label]="'Remover filtro: ' + filter.label"
                data-testid="active-filter-remove"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="remove-icon">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </span>
          }
        </div>
        <button
          type="button"
          class="clear-all-btn"
          (click)="clearAll.emit()"
          data-testid="clear-all-filters"
        >
          Limpiar todo
        </button>
      </div>
    }
  `,
  styles: `
    .active-filters {
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
      flex-wrap: wrap;
    }

    .filter-tags {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      flex-wrap: wrap;
    }

    .filter-tag {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-xs) var(--spacing-md);
      background-color: color-mix(in srgb, var(--color-primary) 12%, var(--color-canvas));
      color: var(--color-primary);
      border-radius: var(--radius-pill);
      font-size: var(--text-body-sm);
      font-weight: 500;
      line-height: 18px;
    }

    .filter-tag-label {
      white-space: nowrap;
    }

    .filter-tag-remove {
      display: grid;
      place-items: center;
      width: 18px;
      height: 18px;
      border: none;
      background: none;
      cursor: pointer;
      color: var(--color-primary);
      padding: 0;
      border-radius: 50%;
      transition: background-color 0.2s ease;
    }

    .filter-tag-remove:hover {
      background-color: color-mix(in srgb, var(--color-primary) 20%, transparent);
    }

    .remove-icon {
      width: 14px;
      height: 14px;
    }

    .clear-all-btn {
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

    .clear-all-btn:hover {
      background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
    }
  `,
})
export class ActiveFilters {
  readonly filters = input<ActiveFilter[]>([]);
  readonly remove = output<ActiveFilter>();
  readonly clearAll = output<void>();
}
