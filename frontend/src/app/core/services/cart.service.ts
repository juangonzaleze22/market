import { Injectable, computed, effect, signal, untracked } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { BranchService } from './branch.service';
import { ToastService } from './toast.service';
import { FlyToCartService } from './fly-to-cart.service';
import type { Product } from './product.service';

export interface CartItem {
  id: string;
  userId: string;
  branchId: string | null;
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

  private lastBranchId: string | null = null;
  private readonly branchChange = effect(() => {
    const branchId = this.branchService.getSelectedId();
    if (branchId === this.lastBranchId) return;
    this.lastBranchId = branchId;
    untracked(() => this.load());
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
    private branchService: BranchService,
    private toast: ToastService,
    private flyToCart: FlyToCartService
  ) {}

  load(): void {
    this.stockIssues.set([]);
    this.stockCheckError.set(null);
    if (this.auth.isAuthed()) {
      if (!this.branchService.getSelectedId()) {
        this.items.set([]);
        return;
      }
      const branchId = this.branchService.getSelectedId();
      this.http
        .get<CartItem[]>(this.api.url(this.path), { params: this.branchParams() })
        .subscribe({
          next: (items) => {
            if (this.branchService.getSelectedId() !== branchId) return;
            this.items.set(items);
          },
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
    if (!this.branchService.getSelectedId()) {
      this.stockIssues.set([]);
      return of([]);
    }
    const branchId = this.branchService.getSelectedId();
    return this.fetchFreshItems().pipe(
      map((items) => {
        if (this.branchService.getSelectedId() !== branchId) return [];
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
    const params = this.branchParams();
    if (this.auth.isAuthed()) {
      return this.http.get<CartItem[]>(this.api.url(this.path), { params });
    }
    const items = this.readLocal();
    if (items.length === 0) return of([]);
    return forkJoin(
      items.map((item) =>
        this.http.get<Product>(this.api.url(`products/${item.productId}`), { params }).pipe(
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
        const freshById = new Map(freshItems.map((item) => [item.id, item]));
        this.writeLocal(
          this.readAllLocal().map((item) => freshById.get(item.id) ?? item),
        );
        return freshItems;
      }),
    );
  }

  add(product: AddToCartProduct, quantity = 1, source?: HTMLElement | null): void {
    this.error.set(null);
    if (this.auth.isAuthed()) {
      const payload: any = {
        productId: product.id,
        quantity,
        branchId: this.branchService.getSelectedId() ?? undefined,
      };
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

  private notifyAdded(_productName: string, source?: HTMLElement | null): void {
    this.flyToCart.fly(source);
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
      this.http
        .delete<void>(this.api.url(this.path), { params: this.branchParams() })
        .subscribe({
          next: () => this.items.set([]),
          error: (err) => {
            if (this.isUnauthorized(err)) {
              this.writeLocal(this.withoutCurrentBranch());
              this.fallbackToGuestCart();
              return;
            }
            const msg = err?.error?.message || 'No se pudo vaciar el carrito';
            this.error.set(msg);
          },
        });
      return;
    }
    this.writeLocal(this.withoutCurrentBranch());
    this.items.set([]);
  }

  mergeGuest(): void {
    if (!this.auth.isAuthed()) {
      this.items.set(this.readLocal());
      return;
    }
    const local = this.readAllLocal();
    if (local.length === 0) {
      this.load();
      return;
    }
    const currentBranchId = this.branchService.getSelectedId();
    const calls: Observable<unknown>[] = local.map((i) => {
      const branchId = i.branchId ?? currentBranchId ?? undefined;
      const payload: any = {
        productId: i.productId,
        quantity: i.quantity,
      };
      if (branchId) payload.branchId = branchId;
      return this.http.post<CartItem>(this.api.url(this.path), payload);
    });
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

  private branchParams(): HttpParams {
    const branchId = this.branchService.getSelectedId();
    return branchId ? new HttpParams().set('branchId', branchId) : new HttpParams();
  }

  private isUnauthorized(err: unknown): boolean {
    return (err as { status?: number })?.status === 401;
  }

  private fallbackToGuestCart(): void {
    this.auth.clearSession();
    this.items.set(this.readLocal());
  }

  private addToLocalCart(product: AddToCartProduct, quantity: number): void {
    const branchId = this.branchService.getSelectedId();
    const all = this.readAllLocal();
    const stock = product.stock;
    const existing = all.find(
      (i) => i.productId === product.id && (i.branchId ?? branchId) === branchId,
    );
    if (existing) {
      const next = existing.quantity + quantity;
      existing.quantity =
        stock != null ? Math.max(1, Math.min(next, stock)) : next;
      if (stock != null) existing.product.stock = stock;
      if (!existing.branchId && branchId) existing.branchId = branchId;
    } else {
      all.push({
        id: `local-${branchId ?? 'none'}-${product.id}`,
        userId: '',
        branchId,
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
    this.writeLocal(all);
    this.items.set(this.filterForBranch(all, branchId));
  }

  private updateLocalQuantity(itemId: string, quantity: number): void {
    const all = this.readAllLocal().map((i) => {
      if (i.id !== itemId) return i;
      const stock = i.product.stock;
      const capped =
        stock != null ? Math.max(1, Math.min(quantity, stock)) : quantity;
      return { ...i, quantity: capped };
    });
    this.writeLocal(all);
    this.items.set(this.filterForBranch(all, this.branchService.getSelectedId()));
  }

  private removeLocalItem(itemId: string): void {
    const all = this.readAllLocal().filter((i) => i.id !== itemId);
    this.writeLocal(all);
    this.items.set(this.filterForBranch(all, this.branchService.getSelectedId()));
  }

  private withoutCurrentBranch(): CartItem[] {
    const branchId = this.branchService.getSelectedId();
    if (!branchId) return [];
    return this.readAllLocal().filter((i) => i.branchId !== branchId);
  }

  private filterForBranch(items: CartItem[], branchId: string | null): CartItem[] {
    if (!branchId) return items;
    return items.filter((item) => item.branchId === branchId);
  }

  private readLocal(): CartItem[] {
    const branchId = this.branchService.getSelectedId();
    const all = this.readAllLocal();
    if (!branchId) return all;

    let changed = false;
    const normalized = all.map((item) => {
      if (item.branchId || !branchId) return item;
      changed = true;
      return { ...item, branchId };
    });
    if (changed) this.writeLocal(normalized);

    return this.filterForBranch(normalized, branchId);
  }

  private readAllLocal(): CartItem[] {
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
