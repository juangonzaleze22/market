import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { BannerService, Banner, BannerSettings } from '../../../core/services/banner.service';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalComponent } from '../../../shared/ui/modal';
import { ImageCropperModalComponent } from '../../../shared/ui/image-cropper-modal';

interface BannerForm {
  title: string;
  subtitle: string;
  imageUrl: string;
  link: string;
  order: number;
  isActive: boolean;
}

const EMPTY_FORM: BannerForm = {
  title: '',
  subtitle: '',
  imageUrl: '',
  link: '',
  order: 0,
  isActive: true,
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

@Component({
  selector: 'app-admin-banners',
  imports: [FormsModule, ModalComponent, ImageCropperModalComponent],
  template: `
    <div data-testid="admin-banners">
      <div class="flex flex-col gap-lg mb-2xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-body-2xl font-bold" data-testid="banners-title">Banners del Home</h1>
          <span class="text-body-sm text-body">{{ banners().length }} banners</span>
        </div>
        <button
          type="button"
          (click)="openCreate()"
          class="btn-primary sm:self-auto"
          data-testid="add-banner-btn"
        >
          + Nuevo banner
        </button>
      </div>

      <!-- Settings -->
      <div class="bg-canvas rounded-xl border border-surface-pressed p-xl mb-2xl">
        <h2 class="text-body-lg font-bold mb-lg">Configuración del Carousel</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-lg">
          <div>
            <label class="form-label" for="settings-transition">Efecto de transición</label>
            <select
              id="settings-transition"
              [(ngModel)]="settingsForm().transitionEffect"
              (ngModelChange)="saveSettings()"
              class="form-input"
              data-testid="settings-transition"
            >
              <option value="fade">Fade (Fundido)</option>
              <option value="slide">Slide (Deslizar)</option>
              <option value="cube">Cube (Cubo)</option>
              <option value="coverflow">Coverflow</option>
              <option value="flip">Flip (Voltear)</option>
            </select>
          </div>
          <div>
            <label class="form-label" for="settings-delay">Tiempo entre slides (ms)</label>
            <input
              id="settings-delay"
              type="number"
              min="1000"
              max="10000"
              step="500"
              [ngModel]="settingsForm().autoplayDelay"
              (ngModelChange)="onDelayChange($event)"
              class="form-input"
              data-testid="settings-delay"
            />
          </div>
          <div>
            <label class="form-label" for="settings-animation">Tipo de animación</label>
            <select
              id="settings-animation"
              [(ngModel)]="settingsForm().animationType"
              (ngModelChange)="saveSettings()"
              class="form-input"
              data-testid="settings-animation"
            >
              <option value="slide">Slide</option>
              <option value="fade">Fade</option>
              <option value="custom">Custom CSS</option>
            </select>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center py-4xl">
          <div
            class="w-8 h-8 border-2 border-surface-pressed border-t-primary rounded-full animate-spin"
          ></div>
        </div>
      } @else {
        <!-- Desktop table -->
        <div
          class="bg-canvas rounded-xl border border-surface-pressed overflow-hidden max-md:hidden"
        >
          <div
            class="grid grid-cols-12 gap-4 bg-accent text-white rounded-t-xl px-lg py-3 font-semibold text-body-sm"
            data-testid="banners-table-header"
          >
            <div class="col-span-1 text-center">#</div>
            <div class="col-span-3">Imagen</div>
            <div class="col-span-2">Título</div>
            <div class="col-span-2">Subtítulo</div>
            <div class="col-span-2">Enlace</div>
            <div class="col-span-1 text-center">Estado</div>
            <div class="col-span-1 text-right">Acciones</div>
          </div>
          <div class="border border-surface-pressed border-t-0 rounded-b-xl">
            @for (banner of banners(); track banner.id; let i = $index) {
              <div
                class="grid grid-cols-12 gap-4 items-center px-lg py-4 border-b border-surface-pressed last:border-b-0 hover:bg-canvas-soft/50"
                [attr.data-testid]="'banner-row-' + banner.id"
              >
                <div class="col-span-1 text-center text-body-sm text-body">{{ i + 1 }}</div>
                <div class="col-span-3">
                  @if (banner.imageUrl) {
                    <img
                      [src]="banner.imageUrl"
                      [alt]="banner.title ?? 'Banner'"
                      class="w-32 h-16 rounded-lg object-cover bg-canvas-soft"
                      loading="lazy"
                      decoding="async"
                    />
                  } @else {
                    <span
                      class="w-32 h-16 rounded-lg bg-canvas-soft flex items-center justify-center text-mute text-body-xs"
                      >—</span
                    >
                  }
                </div>
                <div class="col-span-2 text-body-sm truncate">{{ banner.title || '—' }}</div>
                <div class="col-span-2 text-body-sm text-body truncate">
                  {{ banner.subtitle || '—' }}
                </div>
                <div class="col-span-2 text-body-sm text-body truncate">
                  {{ banner.link || '—' }}
                </div>
                <div class="col-span-1 text-center">
                  @if (banner.isActive) {
                    <span
                      class="inline-flex items-center px-sm py-xxs rounded-full text-body-xs font-medium bg-green-100 text-green-800"
                      >Activo</span
                    >
                  } @else {
                    <span
                      class="inline-flex items-center px-sm py-xxs rounded-full text-body-xs font-medium bg-gray-100 text-gray-600"
                      >Inactivo</span
                    >
                  }
                </div>
                <div class="col-span-1 flex items-center justify-end gap-sm">
                  <button
                    type="button"
                    class="admin-icon-btn"
                    (click)="openEdit(banner)"
                    title="Editar"
                    aria-label="Editar"
                    [attr.data-testid]="'edit-banner-' + banner.id"
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
                    (click)="deleteBanner(banner.id)"
                    [disabled]="deletingId() === banner.id"
                    title="Eliminar"
                    aria-label="Eliminar"
                    [attr.data-testid]="'delete-banner-' + banner.id"
                  >
                    @if (deletingId() === banner.id) {
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
                No hay banners. Agrega uno para mostrar en el home.
              </div>
            }
          </div>
        </div>

        <!-- Mobile card list -->
        <div class="md:hidden flex flex-col gap-md">
          @for (banner of banners(); track banner.id; let i = $index) {
            <div
              class="bg-canvas rounded-xl border border-surface-pressed p-lg"
              (click)="openDropdown.set(null)"
              [attr.data-testid]="'banner-card-' + banner.id"
            >
              @if (banner.imageUrl) {
                <img
                  [src]="banner.imageUrl"
                  [alt]="banner.title ?? 'Banner'"
                  class="w-full h-32 rounded-lg object-cover bg-canvas-soft mb-md"
                  loading="lazy"
                  decoding="async"
                />
              } @else {
                <div
                  class="w-full h-32 rounded-lg bg-canvas-soft flex items-center justify-center text-mute text-body-xs mb-md"
                >
                  —
                </div>
              }
              <div class="flex items-start justify-between gap-sm">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-sm">
                    <span class="text-body-xs text-mute font-mono">#{{ i + 1 }}</span>
                    <p class="text-body-sm font-medium truncate">
                      {{ banner.title || 'Sin título' }}
                    </p>
                  </div>
                  @if (banner.subtitle) {
                    <p class="text-body-xs text-body mt-xxs truncate">{{ banner.subtitle }}</p>
                  }
                  <div class="flex items-center gap-md mt-sm">
                    @if (banner.isActive) {
                      <span
                        class="inline-flex items-center px-sm py-xxs rounded-full text-body-xs font-medium bg-green-100 text-green-800"
                        >Activo</span
                      >
                    } @else {
                      <span
                        class="inline-flex items-center px-sm py-xxs rounded-full text-body-xs font-medium bg-gray-100 text-gray-600"
                        >Inactivo</span
                      >
                    }
                    @if (banner.link) {
                      <span class="text-body-xs text-mute truncate">{{ banner.link }}</span>
                    }
                  </div>
                </div>
                <div class="relative shrink-0">
                  <button
                    type="button"
                    (click)="toggleDropdown($event, banner.id)"
                    class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-canvas-soft transition-colors text-body"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                      <path
                        d="M6 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm6 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                      />
                    </svg>
                  </button>
                  @if (openDropdown() === banner.id) {
                    <div
                      class="absolute right-0 top-full mt-xs w-44 bg-canvas rounded-xl border border-surface-pressed shadow-lg z-10 py-xs"
                      (click)="$event.stopPropagation()"
                    >
                      <button
                        type="button"
                        (click)="openDropdown.set(null); openEdit(banner)"
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
                        (click)="openDropdown.set(null); deleteBanner(banner.id)"
                        [disabled]="deletingId() === banner.id"
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
            </div>
          } @empty {
            <div
              class="px-xl py-2xl text-center text-body text-body-sm bg-canvas rounded-xl border border-surface-pressed"
            >
              No hay banners. Agrega uno para mostrar en el home.
            </div>
          }
        </div>
      }

      @if (formError()) {
        <p class="mt-lg form-error" data-testid="banner-form-error">{{ formError() }}</p>
      }

      <!-- Create / Edit modal -->
      <app-modal
        [open]="formOpen()"
        [title]="editingId() ? 'Editar banner' : 'Nuevo banner'"
        size="md"
        testId="banner-form-modal"
        [closeOnBackdrop]="false"
        (closed)="closeForm()"
      >
        <div class="grid grid-cols-1 gap-lg">
          <div>
            <label class="form-label" for="bf-title">Título</label>
            <input
              id="bf-title"
              type="text"
              [ngModel]="form().title"
              (ngModelChange)="patch({ title: $event })"
              class="form-input"
              data-testid="form-title"
              placeholder="Opcional"
            />
          </div>
          <div>
            <label class="form-label" for="bf-subtitle">Subtítulo</label>
            <input
              id="bf-subtitle"
              type="text"
              [ngModel]="form().subtitle"
              (ngModelChange)="patch({ subtitle: $event })"
              class="form-input"
              data-testid="form-subtitle"
              placeholder="Opcional"
            />
          </div>
          <div>
            <label class="form-label" for="bf-link">Enlace</label>
            <input
              id="bf-link"
              type="text"
              [ngModel]="form().link"
              (ngModelChange)="patch({ link: $event })"
              class="form-input"
              data-testid="form-link"
              placeholder="https://ejemplo.com/ofertas"
            />
          </div>
          <div>
            <label class="form-label" for="bf-order">Orden</label>
            <input
              id="bf-order"
              type="number"
              min="0"
              [ngModel]="form().order"
              (ngModelChange)="patch({ order: $event })"
              class="form-input"
              data-testid="form-order"
            />
          </div>
          <div class="flex items-center gap-md">
            <input
              id="bf-active"
              type="checkbox"
              [ngModel]="form().isActive"
              (ngModelChange)="patch({ isActive: $event })"
              class="w-4 h-4 rounded border-surface-pressed text-primary focus:ring-primary"
              data-testid="form-active"
            />
            <label for="bf-active" class="text-body-md text-body"
              >Activo (visible en el home)</label
            >
          </div>
          <div>
            <span class="form-label">Imagen del banner</span>
            <div class="image-picker">
              @if (form().imageUrl) {
                <img
                  [src]="form().imageUrl"
                  alt="Vista previa"
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
                    form().imageUrl ? 'Imagen seleccionada' : 'Selecciona una imagen para el banner'
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
            (click)="saveBanner()"
            [disabled]="isSaving() || isUploading()"
            data-testid="save-banner"
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
        [aspectRatio]="0"
        [maintainAspectRatio]="false"
        [resizeToWidth]="1920"
        title="Recortar imagen del banner"
        testId="banner-cropper"
        (cancelled)="closeCropper()"
        (confirmed)="onImageCropped($event)"
      />
    </div>
  `,
})
export class AdminBanners implements OnInit {
  private readonly bannerService = inject(BannerService);
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);

  protected readonly banners = signal<Banner[]>([]);
  protected readonly loading = signal(true);

  protected readonly form = signal<BannerForm>({ ...EMPTY_FORM });
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

  protected readonly settingsForm = signal({
    transitionEffect: 'fade',
    autoplayDelay: 3000,
    animationType: 'slide',
  });

  ngOnInit(): void {
    this.loadBanners();
    this.loadSettings();
  }

  protected patch(values: Partial<BannerForm>): void {
    this.form.update((f) => ({ ...f, ...values }));
  }

  protected openCreate(): void {
    this.form.set({ ...EMPTY_FORM, order: this.banners().length });
    this.editingId.set(null);
    this.formError.set('');
    this.formOpen.set(true);
  }

  protected openEdit(banner: Banner): void {
    this.editingId.set(banner.id);
    this.form.set({
      title: banner.title ?? '',
      subtitle: banner.subtitle ?? '',
      imageUrl: banner.imageUrl,
      link: banner.link ?? '',
      order: banner.order,
      isActive: banner.isActive,
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
      .uploadImage('banners', blob)
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

  protected saveBanner(): void {
    const data = this.form();

    this.formError.set('');
    this.isSaving.set(true);

    const payload: Partial<Banner> = {
      title: data.title || null,
      subtitle: data.subtitle || null,
      imageUrl: data.imageUrl,
      link: data.link || null,
      order: data.order,
      isActive: data.isActive,
    };

    const id = this.editingId();
    const request = id
      ? this.bannerService.update(id, payload)
      : this.bannerService.create(payload);

    request.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.formOpen.set(false);
        this.editingId.set(null);
        this.form.set({ ...EMPTY_FORM });
        this.loadBanners();
        this.toast.success(id ? 'Banner actualizado' : 'Banner creado');
      },
      error: (err) => {
        const message = err?.error?.message;
        const msg = Array.isArray(message)
          ? message.join(', ')
          : (message ?? 'No se pudo guardar el banner');
        this.formError.set(msg);
        this.toast.error(msg);
      },
    });
  }

  protected deleteBanner(id: string): void {
    this.deletingId.set(id);
    this.openDropdown.set(null);
    this.bannerService
      .delete(id)
      .pipe(finalize(() => this.deletingId.set(null)))
      .subscribe({
        next: () => {
          this.banners.update((list) => list.filter((b) => b.id !== id));
          this.toast.success('Banner eliminado');
        },
        error: () => {
          this.toast.error('No se pudo eliminar el banner');
        },
      });
  }

  protected toggleDropdown(event: Event, id: string): void {
    event.stopPropagation();
    this.openDropdown.set(this.openDropdown() === id ? null : id);
  }

  private loadBanners(): void {
    this.loading.set(true);
    this.bannerService.getAll().subscribe({
      next: (res) => {
        this.banners.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadSettings(): void {
    this.bannerService.getSettings().subscribe({
      next: (settings) => {
        this.settingsForm.set({
          transitionEffect: settings.transitionEffect,
          autoplayDelay: settings.autoplayDelay,
          animationType: settings.animationType,
        });
      },
    });
  }

  protected saveSettings(): void {
    this.bannerService.updateSettings(this.settingsForm()).subscribe({
      next: () => {
        this.toast.success('Configuración del carousel guardada');
      },
      error: () => {
        this.toast.error('No se pudo guardar la configuración del carousel');
      },
    });
  }

  protected onDelayChange(value: number): void {
    this.settingsForm.update((s) => ({ ...s, autoplayDelay: value }));
    this.saveSettings();
  }
}
