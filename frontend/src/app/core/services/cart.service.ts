import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { FlyToCartService } from './fly-to-cart.service';
import type { Product } from './product.service';

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  flashSaleId: string | null;
  flashSalePrice: number | null;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    stock?: number;
  };
}

export interface AddToCartProduct {
  id: string;
  name: string;
  price: number;
  images: string[];
  stock?: number;
  flashSaleId?: string;
  flashSalePrice?: number;
}

export interface StockIssue {
  itemId: string;
  name: string;
  requested: number;
  available: number;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly path = 'cart';
  private readonly storageKey = 'market_cart';

  readonly items = signal<CartItem[]>([]);
  readonly count = computed(() => this.items().reduce((acc, i) => acc + i.quantity, 0));
  readonly total = computed(() =>
    this.items().reduce((acc, i) => {
      const price = i.flashSalePrice ?? i.product.price;
      return acc + i.quantity * price;
    }, 0)
  );
  readonly drawerOpen = signal(false);
  readonly error = signal<string | null>(null);
  readonly stockIssues = signal<StockIssue[]>([]);
  readonly validatingStock = signal(false);
  readonly stockCheckError = signal<string | null>(null);
  readonly stockMessage = computed(() => {
    const checkError = this.stockCheckError();
    if (checkError) return checkError;
    const issues = this.stockIssues();
    if (issues.length === 0) return '';
    return issues
      .map((issue) =>
        issue.available > 0
          ? `${issue.name}: solo quedan ${issue.available} (tienes ${issue.requested})`
          : `${issue.name}: sin stock disponible`,
      )
      .join('. ');
  });

  openDrawer(): void {
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  toggleDrawer(): void {
    this.drawerOpen.update((v) => !v);
  }

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private auth: AuthService,
    private toast: ToastService,
    private flyToCart: FlyToCartService
  ) {}

  load(): void {
    this.stockIssues.set([]);
    this.stockCheckError.set(null);
    if (this.auth.isAuthed()) {
      this.http.get<CartItem[]>(this.api.url(this.path)).subscribe({
        next: (items) => this.items.set(items),
        error: (err) => {
          if (this.isUnauthorized(err)) {
            this.fallbackToGuestCart();
            return;
          }
          this.items.set([]);
        },
      });
    } else {
      this.items.set(this.readLocal());
    }
  }

  validateStock(): Observable<StockIssue[]> {
    this.stockCheckError.set(null);
    return this.fetchFreshItems().pipe(
      map((items) => {
        this.items.set(items);
        const issues = this.computeStockIssues(items);
        this.stockIssues.set(issues);
        return issues;
      }),
      catchError((err) => {
        if (this.isUnauthorized(err)) {
          this.fallbackToGuestCart();
          const items = this.readLocal();
          const issues = this.computeStockIssues(items);
          this.stockIssues.set(issues);
          return of(issues);
        }
        this.stockIssues.set([]);
        this.stockCheckError.set(
          'No se pudo verificar el stock. Revisa tu conexión e intenta de nuevo.',
        );
        return throwError(() => err);
      }),
    );
  }

  private computeStockIssues(items: CartItem[]): StockIssue[] {
    return items
      .filter((item) => item.product.stock == null || item.quantity > item.product.stock)
      .map((item) => ({
        itemId: item.id,
        name: item.product.name,
        requested: item.quantity,
        available: item.product.stock ?? 0,
      }));
  }

  private fetchFreshItems(): Observable<CartItem[]> {
    if (this.auth.isAuthed()) {
      return this.http.get<CartItem[]>(this.api.url(this.path));
    }
    const items = this.readLocal();
    if (items.length === 0) return of([]);
    return forkJoin(
      items.map((item) =>
        this.http.get<Product>(this.api.url(`products/${item.productId}`)).pipe(
          map((product) => ({
            ...item,
            product: {
              ...item.product,
              price: product.price ?? item.product.price,
              stock: product.stock,
              images:
                product.images && product.images.length > 0
                  ? product.images
                  : item.product.images,
            },
          })),
        ),
      ),
    ).pipe(
      map((freshItems) => {
        this.writeLocal(freshItems);
        return freshItems;
      }),
    );
  }

  add(product: AddToCartProduct, quantity = 1, source?: HTMLElement | null): void {
    this.error.set(null);
    if (this.auth.isAuthed()) {
      const payload: any = { productId: product.id, quantity };
      if (product.flashSaleId) {
        payload.flashSaleId = product.flashSaleId;
        payload.flashSalePrice = product.flashSalePrice;
      }
      this.http
        .post<CartItem>(this.api.url(this.path), payload)
        .subscribe({
          next: () => {
            this.load();
            this.notifyAdded(product.name, source);
          },
          error: (err) => {
            if (this.isUnauthorized(err)) {
              this.addToLocalCart(product, quantity);
              this.fallbackToGuestCart();
              this.notifyAdded(product.name, source);
              return;
            }
            const msg = err?.error?.message || 'No se pudo agregar el producto al carrito';
            this.error.set(msg);
            this.toast.error(msg);
          },
        });
      return;
    }
    this.addToLocalCart(product, quantity);
    this.notifyAdded(product.name, source);
  }

  private notifyAdded(productName: string, source?: HTMLElement | null): void {
    this.flyToCart.fly(source);
    this.toast.success(`${productName} agregado al carrito`);
  }

  update(itemId: string, quantity: number): void {
    this.error.set(null);
    this.stockIssues.set([]);
    this.stockCheckError.set(null);
    const item = this.items().find((i) => i.id === itemId);
    const stock = item?.product.stock;
    const capped =
      stock != null ? Math.max(1, Math.min(quantity, stock)) : quantity;
    if (item && capped === item.quantity) {
      return;
    }
    if (this.auth.isAuthed()) {
      this.http
        .patch<CartItem>(this.api.url(`${this.path}/${itemId}`), { quantity: capped })
        .subscribe({
          next: () => this.load(),
          error: (err) => {
            if (this.isUnauthorized(err)) {
              this.updateLocalQuantity(itemId, capped);
              this.fallbackToGuestCart();
              return;
            }
            const msg = err?.error?.message || 'No se pudo actualizar la cantidad';
            this.error.set(msg);
            this.toast.error(msg);
          },
        });
      return;
    }
    this.updateLocalQuantity(itemId, capped);
  }

  remove(itemId: string): void {
    this.error.set(null);
    this.stockIssues.set([]);
    this.stockCheckError.set(null);
    if (this.auth.isAuthed()) {
      this.http.delete<void>(this.api.url(`${this.path}/${itemId}`)).subscribe({
        next: () => this.load(),
        error: (err) => {
          if (this.isUnauthorized(err)) {
            this.removeLocalItem(itemId);
            this.fallbackToGuestCart();
            return;
          }
          const msg = err?.error?.message || 'No se pudo eliminar el producto del carrito';
          this.error.set(msg);
        },
      });
      return;
    }
    this.removeLocalItem(itemId);
  }

  clear(): void {
    this.error.set(null);
    if (this.auth.isAuthed()) {
      this.http.delete<void>(this.api.url(this.path)).subscribe({
        next: () => this.items.set([]),
        error: (err) => {
          if (this.isUnauthorized(err)) {
            this.writeLocal([]);
            this.fallbackToGuestCart();
            return;
          }
          const msg = err?.error?.message || 'No se pudo vaciar el carrito';
          this.error.set(msg);
        },
      });
      return;
    }
    this.writeLocal([]);
    this.items.set([]);
  }

  mergeGuest(): void {
    if (!this.auth.isAuthed()) {
      this.items.set(this.readLocal());
      return;
    }
    const local = this.readLocal();
    if (local.length === 0) {
      this.load();
      return;
    }
    const calls: Observable<unknown>[] = local.map((i) =>
      this.http.post<CartItem>(this.api.url(this.path), {
        productId: i.productId,
        quantity: i.quantity,
      })
    );
    forkJoin(calls).subscribe({
      complete: () => {
        this.writeLocal([]);
        this.load();
      },
      error: (err) => {
        if (this.isUnauthorized(err)) {
          this.fallbackToGuestCart();
          return;
        }
        this.load();
      },
    });
  }

  private isUnauthorized(err: unknown): boolean {
    return (err as { status?: number })?.status === 401;
  }

  private fallbackToGuestCart(): void {
    this.auth.clearSession();
    this.items.set(this.readLocal());
  }

  private addToLocalCart(product: AddToCartProduct, quantity: number): void {
    const items = this.readLocal();
    const stock = product.stock;
    const existing = items.find((i) => i.productId === product.id);
    if (existing) {
      const next = existing.quantity + quantity;
      existing.quantity =
        stock != null ? Math.max(1, Math.min(next, stock)) : next;
      if (stock != null) existing.product.stock = stock;
    } else {
      items.push({
        id: `local-${product.id}`,
        userId: '',
        productId: product.id,
        quantity: stock != null ? Math.max(1, Math.min(quantity, stock)) : quantity,
        flashSaleId: product.flashSaleId ?? null,
        flashSalePrice: product.flashSalePrice ?? null,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          images: product.images,
          stock,
        },
      });
    }
    this.writeLocal(items);
    this.items.set(items);
  }

  private updateLocalQuantity(itemId: string, quantity: number): void {
    const items = this.readLocal().map((i) => {
      if (i.id !== itemId) return i;
      const stock = i.product.stock;
      const capped =
        stock != null ? Math.max(1, Math.min(quantity, stock)) : quantity;
      return { ...i, quantity: capped };
    });
    this.writeLocal(items);
    this.items.set(items);
  }

  private removeLocalItem(itemId: string): void {
    const items = this.readLocal().filter((i) => i.id !== itemId);
    this.writeLocal(items);
    this.items.set(items);
  }

  private readLocal(): CartItem[] {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as CartItem[];
    } catch {
      return [];
    }
  }

  private writeLocal(items: CartItem[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }
}
