import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminService, AdminCategory } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalComponent } from '../../../shared/ui/modal';
import { ImageCropperModalComponent } from '../../../shared/ui/image-cropper-modal';

interface CategoryForm {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
}

const EMPTY_FORM: CategoryForm = {
  name: '',
  slug: '',
  description: '',
  imageUrl: '',
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

@Component({
  selector: 'app-admin-categories',
  imports: [FormsModule, ModalComponent, ImageCropperModalComponent],
  template: `
    <div data-testid="admin-categories">
      <div class="flex flex-col gap-lg mb-2xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-body-2xl font-bold" data-testid="categories-title">Categorías</h1>
          <span class="text-body-sm text-body">{{ total() }} categorías</span>
        </div>
        <button
          type="button"
          (click)="openCreate()"
          class="btn-primary sm:self-auto"
          data-testid="add-category-btn"
        >
          + Nueva categoría
        </button>
      </div>

      <!-- Search -->
      <div class="mb-xl">
        <div
          class="flex rounded-pill bg-canvas border border-surface-pressed overflow-hidden focus-within:border-primary"
        >
          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
            class="flex-1 bg-transparent outline-none border-none px-lg py-sm text-body-md"
            [(ngModel)]="searchTerm"
            (ngModelChange)="onSearch()"
            data-testid="category-search"
          />
        </div>
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center py-4xl">
          <div
            class="w-8 h-8 border-2 border-surface-pressed border-t-primary rounded-full animate-spin"
          ></div>
        </div>
      } @else {
        <div data-testid="categories-table">
        <!-- Desktop table -->
        <div
          class="bg-canvas rounded-xl border border-surface-pressed overflow-hidden max-md:hidden"
        >
          <div
            class="grid grid-cols-12 gap-4 bg-accent text-white rounded-t-xl px-lg py-3 font-semibold text-body-sm"
            data-testid="categories-table-header"
          >
            <div
              class="col-span-4 cursor-pointer select-none hover:bg-white/10 rounded px-sm py-xxs -mx-sm"
              (click)="onSort('name')"
              data-testid="sort-name"
            >
              Categoría{{ sortIcon('name') }}
            </div>
            <div
              class="col-span-2 cursor-pointer select-none hover:bg-white/10 rounded px-sm py-xxs -mx-sm"
              (click)="onSort('slug')"
              data-testid="sort-slug"
            >
              Slug{{ sortIcon('slug') }}
            </div>
            <div
              class="col-span-4 cursor-pointer select-none hover:bg-white/10 rounded px-sm py-xxs -mx-sm"
              (click)="onSort('description')"
              data-testid="sort-description"
            >
              Descripción{{ sortIcon('description') }}
            </div>
            <div class="col-span-2 text-right">Acciones</div>
          </div>
          <div class="border border-surface-pressed border-t-0 rounded-b-xl">
            @for (category of categories(); track category.id) {
              <div
                class="grid grid-cols-12 gap-4 items-center px-lg py-4 border-b border-surface-pressed last:border-b-0 hover:bg-canvas-soft/50"
                [attr.data-testid]="'category-row-' + category.id"
              >
                <div class="col-span-4 flex items-center gap-md min-w-0">
                  @if (category.imageUrl) {
                    <img
                      [src]="category.imageUrl"
                      [alt]="category.name"
                      class="w-10 h-10 rounded-lg object-cover bg-canvas-soft shrink-0"
                      loading="lazy"
                      decoding="async"
                    />
                  } @else {
                    <span
                      class="w-10 h-10 rounded-lg bg-canvas-soft flex items-center justify-center text-mute text-body-xs shrink-0"
                      >—</span
                    >
                  }
                  <span class="text-body-sm truncate">{{ category.name }}</span>
                </div>
                <div class="col-span-2 text-body-sm text-body font-mono">{{ category.slug }}</div>
                <div class="col-span-4 text-body-sm text-body truncate">
                  {{ category.description || '—' }}
                </div>
                <div class="col-span-2 flex items-center justify-end gap-sm">
                  <button
                    type="button"
                    class="admin-icon-btn"
                    (click)="openEdit(category)"
                    title="Editar"
                    aria-label="Editar"
                    [attr.data-testid]="'edit-category-' + category.id"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor">
                      <path
                        d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z"
                      />
                      <path
                        d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="admin-icon-btn danger"
                    (click)="deleteCategory(category.id)"
                    [disabled]="deletingId() === category.id"
                    title="Eliminar"
                    aria-label="Eliminar"
                    [attr.data-testid]="'delete-category-' + category.id"
                  >
                    @if (deletingId() === category.id) {
                      <span class="btn-spinner"></span>
                    } @else {
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fill-rule="evenodd"
                          d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482 41.03 41.03 0 0 0-2.365-.298V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    }
                  </button>
                </div>
              </div>
            } @empty {
              <div class="px-xl py-2xl text-center text-body text-body-sm">
                No se encontraron categorías
              </div>
            }
          </div>
        </div>

        <!-- Mobile card list -->
        <div class="md:hidden flex flex-col gap-md">
          @for (category of categories(); track category.id) {
            <div
              class="bg-canvas rounded-xl border border-surface-pressed p-lg"
              (click)="openDropdown.set(null)"
              [attr.data-testid]="'category-card-' + category.id"
            >
              <div class="flex items-start gap-md">
                @if (category.imageUrl) {
                  <img
                    [src]="category.imageUrl"
                    [alt]="category.name"
                    class="w-14 h-14 rounded-lg object-cover bg-canvas-soft shrink-0"
                    loading="lazy"
                    decoding="async"
                  />
                } @else {
                  <span
                    class="w-14 h-14 rounded-lg bg-canvas-soft flex items-center justify-center text-mute text-body-xs shrink-0"
                    >—</span
                  >
                }
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-sm">
                    <div class="min-w-0">
                      <p class="text-body-sm font-medium truncate">{{ category.name }}</p>
                      <p class="text-body-xs text-mute font-mono mt-xxs">{{ category.slug }}</p>
                    </div>
                    <div class="relative shrink-0">
                      <button
                        type="button"
                        (click)="toggleDropdown($event, category.id)"
                        class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-canvas-soft transition-colors text-body"
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                          <path
                            d="M6 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm6 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                          />
                        </svg>
                      </button>
                      @if (openDropdown() === category.id) {
                        <div
                          class="absolute right-0 top-full mt-xs w-44 bg-canvas rounded-xl border border-surface-pressed shadow-lg z-10 py-xs"
                          (click)="$event.stopPropagation()"
                        >
                          <button
                            type="button"
                            (click)="openDropdown.set(null); openEdit(category)"
                            class="flex items-center gap-md w-full px-lg py-md text-body-sm text-body hover:bg-canvas-soft transition-colors text-left"
                          >
                            <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 shrink-0">
                              <path
                                d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z"
                              />
                              <path
                                d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z"
                              />
                            </svg>
                            Editar
                          </button>
                          <div class="border-t border-surface-pressed my-xs"></div>
                          <button
                            type="button"
                            (click)="openDropdown.set(null); deleteCategory(category.id)"
                            [disabled]="deletingId() === category.id"
                            class="flex items-center gap-md w-full px-lg py-md text-body-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                          >
                            <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 shrink-0">
                              <path
                                fill-rule="evenodd"
                                d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482 41.03 41.03 0 0 0-2.365-.298V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                                clip-rule="evenodd"
                              />
                            </svg>
                            Eliminar
                          </button>
                        </div>
                      }
                    </div>
                  </div>
                  @if (category.description) {
                    <p class="text-body-xs text-body mt-sm line-clamp-2">
                      {{ category.description }}
                    </p>
                  }
                </div>
              </div>
            </div>
          } @empty {
            <div
              class="px-xl py-2xl text-center text-body text-body-sm bg-canvas rounded-xl border border-surface-pressed"
            >
              No se encontraron categorías
            </div>
          }
        </div>
        </div>

        @if (totalPages() > 1) {
          <div class="flex items-center justify-center gap-md mt-xl">
            <button
              type="button"
              (click)="goToPage(page() - 1)"
              [disabled]="page() <= 1"
              class="btn-secondary"
              data-testid="prev-page"
            >
              Anterior
            </button>
            <span class="text-body-sm text-body" data-testid="page-info"
              >{{ page() }} / {{ totalPages() }}</span
            >
            <button
              type="button"
              (click)="goToPage(page() + 1)"
              [disabled]="page() >= totalPages()"
              class="btn-secondary"
              data-testid="next-page"
            >
              Siguiente
            </button>
          </div>
        }
      }

      @if (formError()) {
        <p class="mt-lg form-error" data-testid="category-form-error">{{ formError() }}</p>
      }

      <!-- Create / Edit modal -->
      <app-modal
        [open]="formOpen()"
        [title]="editingId() ? 'Editar categoría' : 'Nueva categoría'"
        size="md"
        testId="category-form-modal"
        [closeOnBackdrop]="false"
        (closed)="closeForm()"
      >
        <div class="grid grid-cols-1 gap-lg">
          <div>
            <label class="form-label" for="cf-name">Nombre</label>
            <input
              id="cf-name"
              type="text"
              [ngModel]="form().name"
              (ngModelChange)="patch({ name: $event })"
              class="form-input"
              data-testid="form-name"
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
          <div>
            <label class="form-label" for="cf-description">Descripción</label>
            <textarea
              id="cf-description"
              [ngModel]="form().description"
              (ngModelChange)="patch({ description: $event })"
              rows="3"
              class="form-input resize-none"
              data-testid="form-description"
            ></textarea>
          </div>
          <div>
            <span class="form-label">Imagen</span>
            <div class="image-picker">
              @if (form().imageUrl) {
                <img
                  [src]="form().imageUrl"
                  alt="Vista previa de la imagen"
                  class="image-picker-preview"
                  data-testid="form-image-preview"
                />
              } @else {
                <span class="image-picker-empty">
                  <svg viewBox="0 0 20 20" fill="currentColor" class="w-6 h-6">
                    <path
                      fill-rule="evenodd"
                      d="M1 5.25A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25v9.5A2.25 2.25 0 0 1 16.75 17H3.25A2.25 2.25 0 0 1 1 14.75v-9.5Zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 0 0 .75-.75v-2.69l-2.22-2.219a.75.75 0 0 0-1.06 0l-1.91 1.909.47.47a.75.75 0 1 1-1.06 1.06L6.53 8.091a.75.75 0 0 0-1.06 0l-2.97 2.97ZM12 7a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </span>
              }
              <div class="flex-1 min-w-0">
                <p class="text-body-md text-body mb-md truncate">
                  {{
                    form().imageUrl ? form().imageUrl : 'Sin imagen. Se recortará antes de subir.'
                  }}
                </p>
                <div class="flex items-center gap-sm flex-wrap">
                  <button
                    type="button"
                    class="btn-secondary"
                    (click)="fileInput.click()"
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
            @if (imageError()) {
              <p class="mt-sm form-error" data-testid="form-image-error">{{ imageError() }}</p>
            }
          </div>
        </div>

        <div modalFooter>
          <button
            type="button"
            class="btn-secondary"
            (click)="closeForm()"
            data-testid="cancel-form"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="btn-primary"
            (click)="saveCategory()"
            [disabled]="isSaving() || isUploading()"
            data-testid="save-category"
          >
            @if (isSaving()) {
              <span class="inline-flex items-center gap-sm"
                ><span class="btn-spinner"></span>Guardando...</span
              >
            } @else {
              Guardar
            }
          </button>
        </div>
      </app-modal>

      <!-- Image cropper modal -->
      <app-image-cropper-modal
        [open]="cropperOpen()"
        [file]="cropperFile()"
        [uploading]="isUploading()"
        [aspectRatio]="1"
        [resizeToWidth]="800"
        title="Recortar imagen de la categoría"
        testId="category-cropper"
        (cancelled)="closeCropper()"
        (confirmed)="onImageCropped($event)"
      />
    </div>
  `,
})
export class AdminCategories implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);

  protected readonly categories = signal<AdminCategory[]>([]);
  protected readonly loading = signal(true);
  protected readonly page = signal(1);
  protected readonly total = signal(0);
  protected readonly totalPages = signal(0);

  protected readonly form = signal<CategoryForm>({ ...EMPTY_FORM });
  protected readonly formOpen = signal(false);
  protected readonly formError = signal('');
  protected readonly editingId = signal<string | null>(null);
  protected readonly isSaving = signal(false);
  protected readonly deletingId = signal<string | null>(null);
  protected readonly openDropdown = signal<string | null>(null);

  protected readonly cropperOpen = signal(false);
  protected readonly cropperFile = signal<File | null>(null);
  protected readonly isUploading = signal(false);
  protected readonly imageError = signal('');

  protected sortField = '';
  protected sortOrder: 'ASC' | 'DESC' = 'ASC';
  protected searchTerm = '';
  private searchTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.loadCategories();
  }

  protected patch(values: Partial<CategoryForm>): void {
    this.form.update((f) => ({ ...f, ...values }));
  }

  protected onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page.set(1);
      this.loadCategories();
    }, 300);
  }

  protected onSort(field: string): void {
    if (this.sortField === field) {
      this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortField = field;
      this.sortOrder = 'ASC';
    }
    this.page.set(1);
    this.loadCategories();
  }

  protected sortIcon(field: string): string {
    if (this.sortField !== field) return '';
    return this.sortOrder === 'ASC' ? ' ↑' : ' ↓';
  }

  protected goToPage(p: number): void {
    if (p < 1 || p > this.totalPages()) return;
    this.page.set(p);
    this.loadCategories();
  }

  protected openCreate(): void {
    this.form.set({ ...EMPTY_FORM });
    this.editingId.set(null);
    this.formError.set('');
    this.formOpen.set(true);
  }

  protected openEdit(category: AdminCategory): void {
    this.editingId.set(category.id);
    this.form.set({
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      imageUrl: category.imageUrl ?? '',
    });
    this.formError.set('');
    this.formOpen.set(true);
  }

  protected closeForm(): void {
    if (this.isSaving() || this.isUploading()) return;
    this.formOpen.set(false);
    this.editingId.set(null);
    this.form.set({ ...EMPTY_FORM });
    this.formError.set('');
    this.imageError.set('');
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.imageError.set('El archivo debe ser una imagen');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      this.imageError.set('La imagen no puede superar los 5MB');
      return;
    }

    this.imageError.set('');
    this.cropperFile.set(file);
    this.cropperOpen.set(true);
  }

  protected closeCropper(): void {
    if (this.isUploading()) return;
    this.cropperOpen.set(false);
    this.cropperFile.set(null);
  }

  protected onImageCropped(blob: Blob): void {
    this.isUploading.set(true);
    this.imageError.set('');
    this.adminService
      .uploadImage('categories', blob)
      .pipe(finalize(() => this.isUploading.set(false)))
      .subscribe({
        next: (res) => {
          this.patch({ imageUrl: res.url });
          this.cropperOpen.set(false);
          this.cropperFile.set(null);
        },
        error: (err) => {
          this.imageError.set(
            err?.error?.message ?? 'No se pudo subir la imagen. Intenta de nuevo',
          );
        },
      });
  }

  protected saveCategory(): void {
    const data = this.form();
    if (!data.name.trim() || !data.slug.trim()) {
      this.formError.set('Nombre y slug son obligatorios');
      return;
    }

    this.formError.set('');
    this.isSaving.set(true);

    const payload: Partial<AdminCategory> = {
      name: data.name.trim(),
      slug: data.slug.trim(),
      description: data.description,
      imageUrl: data.imageUrl,
    };

    const id = this.editingId();
    const request = id
      ? this.adminService.updateCategory(id, payload)
      : this.adminService.createCategory(payload);

    request.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.formOpen.set(false);
        this.editingId.set(null);
        this.form.set({ ...EMPTY_FORM });
        this.loadCategories();
        this.toast.success(id ? 'Categoría actualizada' : 'Categoría creada');
      },
      error: (err) => {
        const message = err?.error?.message;
        const msg = Array.isArray(message)
          ? message.join(', ')
          : (message ?? 'No se pudo guardar la categoría');
        this.formError.set(msg);
        this.toast.error(msg);
      },
    });
  }

  protected deleteCategory(id: string): void {
    this.deletingId.set(id);
    this.openDropdown.set(null);
    this.adminService
      .deleteCategory(id)
      .pipe(finalize(() => this.deletingId.set(null)))
      .subscribe({
        next: () => {
          this.categories.update((list) => list.filter((c) => c.id !== id));
          this.total.update((t) => t - 1);
          this.toast.success('Categoría eliminada');
        },
        error: () => {
          this.toast.error('No se pudo eliminar la categoría');
        },
      });
  }

  protected toggleDropdown(event: Event, id: string): void {
    event.stopPropagation();
    this.openDropdown.set(this.openDropdown() === id ? null : id);
  }

  private loadCategories(): void {
    this.loading.set(true);
    this.adminService
      .getCategories(this.page(), 10, this.searchTerm, this.sortField, this.sortOrder)
      .subscribe({
        next: (res) => {
          this.categories.set(res.data);
          this.total.set(res.total);
          this.totalPages.set(res.totalPages);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
