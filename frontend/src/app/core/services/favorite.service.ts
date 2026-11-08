import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { AuthModalService } from './auth-modal.service';
import { ToastService } from './toast.service';
import { Product } from './product.service';

export interface Favorite {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class FavoriteService {
  private readonly path = 'favorites';
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly authModal = inject(AuthModalService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly items = signal<Favorite[]>([]);
  readonly loading = signal(false);
  readonly count = computed(() => this.items().length);
  readonly ids = computed(
    () => new Set(this.items().map((favorite) => favorite.productId)),
  );

  load(): void {
    if (!this.auth.isAuthed()) {
      this.items.set([]);
      return;
    }

    this.loading.set(true);
    this.http.get<Favorite[]>(this.api.url(this.path)).subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.items.set([]);
        this.loading.set(false);
      },
    });
  }

  isFavorite(productId: string): boolean {
    return this.ids().has(productId);
  }

  toggle(product: Product): void {
    if (!this.auth.isAuthed()) {
      this.authModal.openLogin(this.router.url.split('?')[0]);
      return;
    }

    if (this.isFavorite(product.id)) {
      this.remove(product.id);
      return;
    }

    const optimistic: Favorite = {
      id: `temp-${product.id}`,
      userId: this.auth.user()?.id ?? '',
      productId: product.id,
      product,
      createdAt: new Date().toISOString(),
    };
    this.items.update((items) => [optimistic, ...items]);

    this.http
      .post<Favorite>(this.api.url(this.path), { productId: product.id })
      .subscribe({
        next: (favorite) =>
          this.items.update((items) =>
            items.map((item) =>
              item.productId === favorite.productId ? favorite : item,
            ),
          ),
        error: () => {
          this.items.update((items) =>
            items.filter((item) => item.productId !== product.id),
          );
          this.toast.error('No se pudo agregar a favoritos');
        },
      });
  }

  remove(productId: string): void {
    if (!this.auth.isAuthed()) {
      return;
    }

    const previous = this.items();
    this.items.update((items) =>
      items.filter((item) => item.productId !== productId),
    );

    this.http
      .delete<void>(this.api.url(`${this.path}/${productId}`))
      .subscribe({
        error: () => {
          this.items.set(previous);
          this.toast.error('No se pudo quitar de favoritos');
        },
      });
  }
}
