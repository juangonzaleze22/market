import {
  Component,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CollectionFormState,
  MAX_IMAGE_SIZE,
} from './collection-editor.types';

@Component({
  selector: 'app-collection-details-form',
  imports: [FormsModule],
  template: `
    <section class="editor-details">
      <button
        type="button"
        class="details-toggle"
        (click)="toggle()"
        [attr.aria-expanded]="open()"
        data-testid="toggle-details"
      >
        <svg
          class="details-chevron"
          [class.open]="open()"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
        <span class="details-title">Detalles de la sección</span>
        @if (!open()) {
          <span class="details-summary">
            {{ form().title || 'Sin título' }} · /{{ form().slug || 'sin-slug' }}
          </span>
        }
      </button>

      @if (open()) {
        <div class="details-body">
          <div class="form-grid-2">
            <div>
              <label class="form-label" for="cf-title">Título</label>
              <input
                id="cf-title"
                type="text"
                [ngModel]="form().title"
                (ngModelChange)="titleChange.emit($event)"
                class="form-input"
                data-testid="form-title"
              />
            </div>
            <div>
              <label class="form-label" for="cf-slug">Slug</label>
              <input
                id="cf-slug"
                type="text"
                [ngModel]="form().slug"
                (ngModelChange)="patch({ slug: $event })"
                class="form-input"
                data-testid="form-slug"
              />
            </div>
          </div>

          <div>
            <label class="form-label" for="cf-subtitle">Subtítulo</label>
            <input
              id="cf-subtitle"
              type="text"
              [ngModel]="form().subtitle"
              (ngModelChange)="patch({ subtitle: $event })"
              class="form-input"
              data-testid="form-subtitle"
            />
          </div>

          <div class="form-grid-4">
            <div>
              <span class="form-label">Dónde se muestra</span>
              <div class="flex flex-col gap-xs">
                <label class="inline-flex items-center gap-sm text-body-sm">
                  <input
                    type="checkbox"
                    [ngModel]="form().placements.includes('home')"
                    (ngModelChange)="togglePlacement('home', $event)"
                    data-testid="form-placement-home"
                  />
                  Home
                </label>
                <label class="inline-flex items-center gap-sm text-body-sm">
                  <input
                    type="checkbox"
                    [ngModel]="form().placements.includes('shop')"
                    (ngModelChange)="togglePlacement('shop', $event)"
                    data-testid="form-placement-shop"
                  />
                  Shop
                </label>
              </div>
            </div>
            <div>
              <label class="form-label" for="cf-max-items">Máx. productos (home)</label>
              <input
                id="cf-max-items"
                type="number"
                min="4"
                max="24"
                [ngModel]="form().maxItems"
                (ngModelChange)="patch({ maxItems: +$event })"
                class="form-input"
                data-testid="form-max-items"
              />
            </div>
            <div>
              <label class="form-label" for="cf-sort-order">Orden de la sección</label>
              <input
                id="cf-sort-order"
                type="number"
                [ngModel]="form().sortOrder"
                (ngModelChange)="patch({ sortOrder: +$event })"
                class="form-input"
                data-testid="form-sort-order"
              />
            </div>
            <div>
              <label class="form-label" for="cf-start">Vigencia (opcional)</label>
              <div class="flex flex-col gap-xs">
                <input
                  id="cf-start"
                  type="datetime-local"
                  [ngModel]="form().startsAt"
                  (ngModelChange)="patch({ startsAt: $event })"
                  class="form-input"
                  data-testid="form-start"
                />
                <input
                  type="datetime-local"
                  [ngModel]="form().endsAt"
                  (ngModelChange)="patch({ endsAt: $event })"
                  class="form-input"
                  data-testid="form-end"
                />
              </div>
            </div>
          </div>

          <label class="inline-flex items-center gap-sm text-body-sm">
            <input
              type="checkbox"
              [ngModel]="form().isActive"
              (ngModelChange)="patch({ isActive: $event })"
              data-testid="form-active"
            />
            Activa
          </label>

          <div>
            <span class="form-label">Imagen de la sección</span>
            <div class="image-picker">
              @if (form().imageUrl) {
                <img
                  [src]="form().imageUrl"
                  alt="Vista previa de la sección"
                  class="image-picker-preview"
                  data-testid="form-image-preview"
                />
              } @else {
                <span class="image-picker-empty">
                  <svg viewBox="0 0 20 20" fill="currentColor" class="w-6 h-6">
                    <path
                      fill-rule="evenodd"
                      d="M1 5.25A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25v9.5A2.25 2.25 0 0 1 16.75 17H3.25A2.25 2.25 0 0 1 1 14.75v-9.5Zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 0 0 .75-.75v-2.69l-2.22-2.219a.75.75 0 0 0-1.06 0l-1.91 1.909.47.47a.75.75 0 1 1-1.06 1.06L6.53 8.091a.75.75 0 0 0-1.06 0l-2.97 2.97Z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </span>
              }
              <div class="flex-1 min-w-0">
                <p class="text-body-md text-body mb-md truncate">
                  {{ form().imageUrl || 'Sin imagen. Se recortará antes de subir.' }}
                </p>
                <div class="flex items-center gap-sm flex-wrap">
                  <button
                    type="button"
                    class="btn-secondary"
                    (click)="fileInput.click()"
                    [disabled]="isUploading()"
                    data-testid="form-image-choose"
                  >
                    {{ form().imageUrl ? 'Cambiar imagen' : 'Seleccionar imagen' }}
                  </button>
                  @if (form().imageUrl) {
                    <button
                      type="button"
                      class="admin-icon-btn danger"
                      (click)="patch({ imageUrl: '' })"
                      title="Quitar imagen"
                      aria-label="Quitar imagen"
                      data-testid="form-image-remove"
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path
                          d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"
                        />
                      </svg>
                    </button>
                  }
                </div>
              </div>
              <input
                #fileInput
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                class="hidden"
                (change)="onFileSelected($event)"
                data-testid="form-image-input"
              />
            </div>
            @if (displayImageError()) {
              <p class="mt-sm form-error" data-testid="form-image-error">
                {{ displayImageError() }}
              </p>
            }
          </div>
        </div>
      }
    </section>
  `,
  styles: `
    .editor-details {
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-lg);
      background-color: var(--color-canvas);
      overflow: hidden;
    }

    .details-toggle {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      width: 100%;
      padding: var(--spacing-md) var(--spacing-lg);
      border: none;
      background-color: var(--color-canvas-softer);
      cursor: pointer;
      text-align: left;
    }

    .details-chevron {
      width: 16px;
      height: 16px;
      color: var(--color-body);
      transition: transform 0.2s ease;
      flex-shrink: 0;
    }

    .details-chevron.open {
      transform: rotate(180deg);
    }

    .details-title {
      font-size: var(--text-body-md);
      font-weight: 700;
      color: var(--color-ink);
    }

    .details-summary {
      margin-left: auto;
      font-size: var(--text-body-xs);
      color: var(--color-body);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .details-body {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-lg);
      padding: var(--spacing-lg);
    }

    .form-grid-2 {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--spacing-lg);
    }

    .form-grid-4 {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: var(--spacing-lg);
    }

    @media (max-width: 768px) {
      .form-grid-2,
      .form-grid-4 {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class CollectionDetailsForm {
  readonly form = input.required<CollectionFormState>();
  readonly imageError = input('');
  readonly isUploading = input(false);
  readonly startOpen = input(true);

  readonly formChange = output<Partial<CollectionFormState>>();
  readonly titleChange = output<string>();
  readonly fileSelected = output<File>();
  readonly openChange = output<boolean>();

  protected readonly open = signal(true);
  protected readonly localError = signal('');

  constructor() {
    effect(() => this.open.set(this.startOpen()));
  }

  protected patch(values: Partial<CollectionFormState>): void {
    this.formChange.emit(values);
  }

  protected toggle(): void {
    const next = !this.open();
    this.open.set(next);
    this.openChange.emit(next);
  }

  protected togglePlacement(placement: string, checked: boolean): void {
    const placements = new Set(this.form().placements);
    if (checked) placements.add(placement);
    else placements.delete(placement);
    const list = ['home', 'shop'].filter((item) => placements.has(item));
    this.patch({ placements: list.length > 0 ? list : ['home'] });
  }

  protected displayImageError(): string {
    return this.imageError() || this.localError();
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.localError.set('El archivo debe ser una imagen');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      this.localError.set('La imagen no puede superar los 5MB');
      return;
    }

    this.localError.set('');
    this.fileSelected.emit(file);
  }
}
