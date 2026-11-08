import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | 'discount-desc';

@Component({
  selector: 'app-sort-dropdown',
  imports: [FormsModule],
  template: `
    <div class="sort-wrapper" data-testid="sort-dropdown">
      <label for="sort-select" class="sort-label">Ordenar por:</label>
      <div class="sort-select-wrapper">
        <select
          id="sort-select"
          class="sort-select"
          [ngModel]="currentSort()"
          (ngModelChange)="sortChange.emit($event)"
          data-testid="sort-select"
        >
          <option value="default">Orden predeterminado</option>
          <option value="price-asc">Menor precio</option>
          <option value="price-desc">Mayor precio</option>
          <option value="name-asc">Nombre: A-Z</option>
          <option value="name-desc">Nombre: Z-A</option>
          <option value="discount-desc">Mayor descuento</option>
        </select>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="sort-chevron">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </div>
  `,
  styles: `
    .sort-wrapper {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      min-width: 0;
    }

    .sort-label {
      font-size: var(--text-body-sm);
      color: var(--color-body);
      white-space: nowrap;
      flex-shrink: 0;
    }

    .sort-select-wrapper {
      position: relative;
      display: inline-flex;
      align-items: center;
      min-width: 0;
    }

    .sort-select {
      appearance: none;
      -webkit-appearance: none;
      padding: var(--spacing-sm) var(--spacing-3xl) var(--spacing-sm) var(--spacing-lg);
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-md);
      background-color: var(--color-canvas);
      font-size: var(--text-body-sm);
      font-weight: 500;
      color: var(--color-ink);
      cursor: pointer;
      outline: none;
      transition: border-color 0.2s ease;
      max-width: 160px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .sort-select:focus {
      border-color: var(--color-primary);
    }

    .sort-chevron {
      position: absolute;
      right: var(--spacing-md);
      width: 16px;
      height: 16px;
      color: var(--color-body);
      pointer-events: none;
    }
  `,
})
export class SortDropdown {
  readonly currentSort = input<SortOption>('default');
  readonly sortChange = output<SortOption>();
}
