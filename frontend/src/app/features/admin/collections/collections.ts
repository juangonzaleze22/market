import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AdminCollection, CollectionService } from '../../../core/services/collection.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-collections',
  imports: [FormsModule, RouterLink],
  template: `
    <div data-testid="admin-collections">
      <div class="flex flex-col gap-lg mb-2xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-body-2xl font-bold" data-testid="collections-title">Secciones</h1>
          <span class="text-body-sm text-body"
            >{{ total() }} secciones de merchandising</span
          >
        </div>
        <a
          routerLink="/admin/collections/new"
          class="btn-primary sm:self-auto"
          data-testid="add-collection-btn"
        >
          + Nueva sección
        </a>
      </div>

      <div class="mb-xl">
        <div
          class="flex rounded-pill bg-canvas border border-surface-pressed overflow-hidden focus-within:border-primary"
        >
          <input
            type="text"
            placeholder="Buscar por título o slug..."
            class="flex-1 bg-transparent outline-none border-none px-lg py-sm text-body-md"
            [(ngModel)]="searchTerm"
            (ngModelChange)="onSearch()"
            data-testid="collection-search"
          />
        </div>
      </div>

      @if (loading()) {
        <div class="py-3xl text-center text-body">Cargando secciones...</div>
      } @else if (collections().length === 0) {
        <div class="py-3xl text-center text-body" data-testid="collections-empty">
          No hay secciones creadas todavía.
        </div>
      } @else {
        <div class="flex flex-col gap-md" data-testid="collections-list">
          @for (collection of collections(); track collection.id) {
            <article
              class="collection-row"
              [attr.data-testid]="'collection-row-' + collection.slug"
            >
              <div class="collection-thumb">
                @if (collection.imageUrl) {
                  <img [src]="collection.imageUrl" [alt]="collection.title" />
                } @else {
                  <span>{{ collection.title.charAt(0) }}</span>
                }
              </div>

              <div class="collection-main">
                <div class="flex items-center gap-sm flex-wrap">
                  <h3 class="text-body-lg font-bold">{{ collection.title }}</h3>
                  @if (!collection.isActive) {
                    <span class="status-pill">Inactiva</span>
                  }
                  @if (collection.startsAt || collection.endsAt) {
                    <span class="status-pill">Programada</span>
                  }
                </div>
                <p class="text-body-sm text-body">{{ collection.slug }}</p>
                <div class="collection-meta">
                  @for (placement of collection.placements; track placement) {
                    <span class="meta-chip">{{ placement === 'home' ? 'Home' : 'Shop' }}</span>
                  }
                  <span class="meta-text">{{ collection.productCount }} productos</span>
                  <span class="meta-text">Orden {{ collection.sortOrder }}</span>
                </div>
              </div>

              <div class="collection-actions">
                <a
                  [routerLink]="['/admin/collections', collection.id, 'edit']"
                  class="admin-icon-btn"
                  title="Editar sección"
                  aria-label="Editar sección"
                  data-testid="edit-collection"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path
                      d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-7.5 7.5a1 1 0 0 1-.255.44l-3 .857a.5.5 0 0 1-.62-.62l.857-3a1 1 0 0 1 .255-.44l7.62-7.38Z"
                    />
                  </svg>
                </a>
                <button
                  type="button"
                  class="admin-icon-btn danger"
                  (click)="deleteCollection(collection.id)"
                  [disabled]="deletingId() === collection.id"
                  title="Eliminar sección"
                  aria-label="Eliminar sección"
                  data-testid="delete-collection"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path
                      d="M7.5 2.75a.75.75 0 0 0-.75.75V4h-2a.75.75 0 0 0 0 1.5h.53l.72 9.4A2.25 2.25 0 0 0 8.24 17h3.52a2.25 2.25 0 0 0 2.24-2.1l.72-9.4h.53a.75.75 0 0 0 0-1.5h-2v-.5a.75.75 0 0 0-.75-.75h-5ZM8.5 7.75a.75.75 0 0 1 1.5 0v5.5a.75.75 0 0 1-1.5 0v-5.5Zm2.5 0a.75.75 0 0 1 1.5 0v5.5a.75.75 0 0 1-1.5 0v-5.5Z"
                    />
                  </svg>
                </button>
              </div>
            </article>
          }
        </div>

        @if (totalPages() > 1) {
          <div class="flex items-center justify-center gap-md mt-2xl">
            <button
              type="button"
              class="btn-secondary"
              (click)="goToPage(page() - 1)"
              [disabled]="page() <= 1"
            >
              Anterior
            </button>
            <span class="text-body-sm text-body">{{ page() }} / {{ totalPages() }}</span>
            <button
              type="button"
              class="btn-secondary"
              (click)="goToPage(page() + 1)"
              [disabled]="page() >= totalPages()"
            >
              Siguiente
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: `
    .collection-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-lg);
      padding: var(--spacing-md);
      border: 1px solid var(--color-surface-pressed);
      border-radius: var(--radius-xl);
      background-color: var(--color-canvas);
    }

    .collection-thumb {
      flex-shrink: 0;
      width: 88px;
      height: 56px;
      display: grid;
      place-items: center;
      overflow: hidden;
      border-radius: var(--radius-lg);
      background-color: var(--color-canvas-softer);
      color: var(--color-mute);
      font-weight: 700;
    }

    .collection-thumb img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .collection-main {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .collection-meta {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      flex-wrap: wrap;
      margin-top: var(--spacing-xxs);
    }

    .meta-chip,
    .status-pill {
      display: inline-flex;
      align-items: center;
      padding: 2px 10px;
      border-radius: var(--radius-pill);
      font-size: var(--text-body-xs);
      font-weight: 600;
      background-color: var(--color-canvas-soft);
      color: var(--color-body);
    }

    .status-pill {
      background-color: color-mix(in srgb, var(--color-primary) 10%, var(--color-canvas));
      color: var(--color-link);
    }

    .meta-text {
      font-size: var(--text-body-xs);
      color: var(--color-body);
    }

    .collection-actions {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
    }

    @media (max-width: 768px) {
      .collection-row {
        flex-wrap: wrap;
      }
    }
  `,
})
export class AdminCollections implements OnInit {
  private readonly collectionService = inject(CollectionService);
  private readonly toast = inject(ToastService);

  protected readonly collections = signal<AdminCollection[]>([]);
  protected readonly loading = signal(true);
  protected readonly page = signal(1);
  protected readonly total = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly deletingId = signal<string | null>(null);

  protected searchTerm = '';
  private searchTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.loadCollections();
  }

  protected onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page.set(1);
      this.loadCollections();
    }, 300);
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.page.set(page);
    this.loadCollections();
  }

  protected deleteCollection(id: string): void {
    this.deletingId.set(id);
    this.collectionService
      .remove(id)
      .pipe(finalize(() => this.deletingId.set(null)))
      .subscribe({
        next: () => {
          this.collections.update((list) =>
            list.filter((collection) => collection.id !== id),
          );
          this.total.update((total) => Math.max(0, total - 1));
          this.toast.success('Sección eliminada');
        },
        error: () => this.toast.error('No se pudo eliminar la sección'),
      });
  }

  private loadCollections(): void {
    this.loading.set(true);
    this.collectionService
      .getAll(this.page(), 10, this.searchTerm)
      .subscribe({
        next: (res) => {
          this.collections.set(res.data);
          this.total.set(res.total);
          this.totalPages.set(res.totalPages);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
