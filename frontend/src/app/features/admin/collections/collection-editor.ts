import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  AdminCategory,
  AdminProduct,
  AdminService,
} from '../../../core/services/admin.service';
import {
  CollectionPayload,
  CollectionService,
} from '../../../core/services/collection.service';
import { Tag } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import { ImageCropperModalComponent } from '../../../shared/ui/image-cropper-modal';
import { CollectionDetailsForm } from './collection-details-form';
import { CollectionProducts } from './collection-products';
import {
  CollectionFormState,
  CollectionProductSelection,
  EMPTY_FORM,
  slugify,
  toInputDate,
} from './collection-editor.types';

@Component({
  selector: 'app-collection-editor',
  imports: [
    RouterLink,
    CollectionDetailsForm,
    CollectionProducts,
    ImageCropperModalComponent,
  ],
  template: `
    <div class="editor-page" data-testid="collection-editor-page">
      <header class="editor-header">
        <div class="editor-heading">
          <a routerLink="/admin/collections" class="back-link" data-testid="back-to-collections">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Secciones
          </a>
          <h1 class="editor-title" data-testid="collection-editor-title">
            {{ isEdit() ? 'Editar sección' : 'Nueva sección' }}
          </h1>
          <p class="editor-subtitle">
            {{
              isEdit()
                ? 'Actualiza los detalles y el orden de los productos de la sección.'
                : 'Crea una sección de merchandising y elige sus productos.'
            }}
          </p>
        </div>

        <div class="editor-actions">
          <button
            type="button"
            class="btn-secondary"
            (click)="cancel()"
            data-testid="cancel-form"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="btn-primary"
            (click)="saveCollection()"
            [disabled]="isSaving() || isUploading() || loadingDetail()"
            data-testid="save-collection"
          >
            @if (isSaving()) {
              <span class="inline-flex items-center gap-sm"
                ><span class="btn-spinner"></span>Guardando...</span
              >
            } @else {
              Guardar sección
            }
          </button>
        </div>
      </header>

      @if (formError()) {
        <div class="form-error-banner" data-testid="collection-form-error">
          {{ formError() }}
        </div>
      }

      @if (loadingDetail()) {
        <div class="editor-loading">Cargando sección...</div>
      } @else {
        <app-collection-details-form
          [form]="form()"
          [imageError]="imageError()"
          [isUploading]="isUploading()"
          [startOpen]="detailsOpen()"
          (formChange)="patch($event)"
          (titleChange)="onTitleChange($event)"
          (fileSelected)="onImageFile($event)"
          (openChange)="detailsOpen.set($event)"
        />

        <app-collection-products
          [selected]="form().products"
          [products]="allProducts()"
          [categories]="categories()"
          [tags]="tags()"
          [loading]="catalogLoading()"
          [title]="form().title"
          [subtitle]="form().subtitle"
          [imageUrl]="form().imageUrl"
          [placementLabel]="placementLabel()"
          (selectedChange)="onSelectedChange($event)"
        />
      }
    </div>

    <app-image-cropper-modal
      [open]="cropperOpen()"
      [file]="cropperFile()"
      [uploading]="isUploading()"
      [aspectRatio]="16 / 9"
      [resizeToWidth]="1200"
      title="Recortar imagen de la sección"
      testId="collection-cropper"
      (cancelled)="closeCropper()"
      (confirmed)="onImageCropped($event)"
    />
  `,
  styles: `
    .editor-page {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xl);
      padding-bottom: var(--spacing-3xl);
    }

    .editor-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--spacing-lg);
      flex-wrap: wrap;
    }

    .editor-heading {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xxs);
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-xs);
      margin-bottom: var(--spacing-xs);
      color: var(--color-body);
      font-size: var(--text-body-sm);
      font-weight: 600;
      text-decoration: none;
    }

    .back-link:hover {
      color: var(--color-link);
    }

    .back-link svg {
      width: 16px;
      height: 16px;
    }

    .editor-title {
      margin: 0;
      font-size: var(--text-display-sm);
      font-weight: 700;
      color: var(--color-ink);
    }

    .editor-subtitle {
      margin: 0;
      font-size: var(--text-body-sm);
      color: var(--color-body);
    }

    .editor-actions {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      flex-wrap: wrap;
    }

    .form-error-banner {
      padding: var(--spacing-sm) var(--spacing-lg);
      border: 1px solid color-mix(in srgb, #dc2626 40%, var(--color-canvas));
      border-radius: var(--radius-lg);
      background-color: color-mix(in srgb, #dc2626 8%, var(--color-canvas));
      color: #b91c1c;
      font-size: var(--text-body-sm);
      font-weight: 600;
    }

    .editor-loading {
      padding: var(--spacing-3xl);
      text-align: center;
      font-size: var(--text-body-md);
      color: var(--color-body);
    }

    @media (max-width: 768px) {
      .editor-actions {
        width: 100%;
      }

      .editor-actions .btn-secondary,
      .editor-actions .btn-primary {
        flex: 1;
      }
    }
  `,
})
export class CollectionEditor implements OnInit {
  private readonly collectionService = inject(CollectionService);
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly collectionId = signal<string | null>(
    this.route.snapshot.paramMap.get('id'),
  );
  protected readonly isEdit = computed(() => this.collectionId() !== null);
  protected readonly loadingDetail = signal(false);

  protected readonly form = signal<CollectionFormState>({ ...EMPTY_FORM });
  protected readonly formError = signal('');
  protected readonly isSaving = signal(false);
  protected readonly detailsOpen = signal(true);

  protected readonly cropperOpen = signal(false);
  protected readonly cropperFile = signal<File | null>(null);
  protected readonly isUploading = signal(false);
  protected readonly imageError = signal('');

  protected readonly allProducts = signal<AdminProduct[]>([]);
  protected readonly categories = signal<AdminCategory[]>([]);
  protected readonly tags = signal<Tag[]>([]);
  protected readonly catalogLoading = signal(true);

  protected readonly placementLabel = computed(() => {
    const placements = this.form().placements;
    if (placements.length === 2) return 'Home + Shop';
    return placements[0] === 'shop' ? 'Solo Shop' : 'Solo Home';
  });

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
    this.loadTags();

    const id = this.collectionId();
    if (id) {
      this.loadDetail(id);
    } else {
      this.detailsOpen.set(true);
    }
  }

  protected patch(values: Partial<CollectionFormState>): void {
    this.form.update((form) => ({ ...form, ...values }));
  }

  protected onTitleChange(title: string): void {
    const shouldAutoSlug = !this.isEdit() && !this.form().slug;
    this.patch({
      title,
      ...(shouldAutoSlug ? { slug: slugify(title) } : {}),
    });
  }

  protected onSelectedChange(products: CollectionProductSelection[]): void {
    this.patch({ products });
  }

  protected onImageFile(file: File): void {
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
      .uploadImage('collections', blob)
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

  protected cancel(): void {
    if (this.isSaving() || this.isUploading()) return;
    this.router.navigate(['/admin/collections']);
  }

  protected saveCollection(): void {
    const data = this.form();
    if (!data.title.trim() || !data.slug.trim()) {
      this.formError.set('Título y slug son obligatorios');
      this.detailsOpen.set(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    this.formError.set('');
    this.isSaving.set(true);

    const payload: CollectionPayload = {
      title: data.title.trim(),
      slug: data.slug.trim(),
      subtitle: data.subtitle.trim(),
      imageUrl: data.imageUrl,
      placements: data.placements,
      maxItems: data.maxItems,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
      startsAt: data.startsAt ? new Date(data.startsAt).toISOString() : null,
      endsAt: data.endsAt ? new Date(data.endsAt).toISOString() : null,
      products: data.products.map((item, position) => ({
        productId: item.productId,
        position,
      })),
    };

    const id = this.collectionId();
    const request = id
      ? this.collectionService.update(id, payload)
      : this.collectionService.create(payload);

    request.pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: () => {
        this.toast.success(id ? 'Sección actualizada' : 'Sección creada');
        this.router.navigate(['/admin/collections']);
      },
      error: (err) => {
        const message = err?.error?.message;
        const msg = Array.isArray(message)
          ? message.join(', ')
          : (message ?? 'No se pudo guardar la sección');
        this.formError.set(msg);
        this.toast.error(msg);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    });
  }

  private loadDetail(id: string): void {
    this.loadingDetail.set(true);
    this.collectionService
      .getOne(id)
      .pipe(finalize(() => this.loadingDetail.set(false)))
      .subscribe({
        next: (detail) => {
          this.form.set({
            title: detail.title,
            slug: detail.slug,
            subtitle: detail.subtitle ?? '',
            imageUrl: detail.imageUrl ?? '',
            placements:
              (detail.placements?.length ?? 0) > 0
                ? detail.placements
                : ['home', 'shop'],
            maxItems: detail.maxItems,
            sortOrder: detail.sortOrder,
            isActive: detail.isActive,
            startsAt: toInputDate(detail.startsAt),
            endsAt: toInputDate(detail.endsAt),
            products: (detail.products ?? []).map((item) => ({
              productId: item.productId,
              position: item.position,
            })),
          });
          this.detailsOpen.set(false);
        },
        error: () => {
          this.toast.error('No se pudo cargar la sección');
          this.router.navigate(['/admin/collections']);
        },
      });
  }

  private loadProducts(): void {
    this.catalogLoading.set(true);
    this.adminService
      .getProducts(1, 200)
      .pipe(finalize(() => this.catalogLoading.set(false)))
      .subscribe({
        next: (res) => this.allProducts.set(res.data),
      });
  }

  private loadCategories(): void {
    this.adminService.getCategories(1, 100).subscribe({
      next: (res) => this.categories.set(res.data),
    });
  }

  private loadTags(): void {
    this.adminService.getTags(1, 100).subscribe({
      next: (res) => this.tags.set(res.data),
    });
  }
}
