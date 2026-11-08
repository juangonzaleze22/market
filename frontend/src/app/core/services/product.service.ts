import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { ApiService } from './api.service';
import { BranchService } from './branch.service';

export interface Tag {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  sku: string;
  images: string[];
  featuredImage?: string;
  isActive: boolean;
  categoryId: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  tags?: Tag[];
  discountPercent?: number;
  discountPrice?: number;
  hasDiscount?: boolean;
  flashPrice?: number | null;
  flashSaleId?: string | null;
  soldCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductQuery {
  categoryId?: string;
  tagId?: string;
  tagIds?: string[];
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: string;
  bestDeals?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly path = 'products';

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private branchService: BranchService,
  ) {}

  getAll(query: ProductQuery = {}): Observable<Product[]> {
    let params = new HttpParams();
    const branchId = this.branchService.getSelectedId();
    if (branchId) params = params.set('branchId', branchId);
    if (query.categoryId) params = params.set('categoryId', query.categoryId);
    if (query.tagId) params = params.set('tagId', query.tagId);
    if (query.tagIds && query.tagIds.length > 0) {
      params = params.set('tagIds', query.tagIds.join(','));
    }
    if (query.search) params = params.set('search', query.search);
    if (query.minPrice !== undefined) params = params.set('minPrice', String(query.minPrice));
    if (query.maxPrice !== undefined) params = params.set('maxPrice', String(query.maxPrice));
    if (query.inStock) params = params.set('inStock', 'true');
    if (query.sort) params = params.set('sort', query.sort);
    if (query.bestDeals) params = params.set('bestDeals', 'true');
    return this.http.get<Product[]>(this.api.url(this.path), { params }).pipe(
      catchError(() => of([]))
    );
  }

  getBestSellers(limit = 8): Observable<Product[]> {
    let params = new HttpParams().set('limit', String(limit));
    const branchId = this.branchService.getSelectedId();
    if (branchId) params = params.set('branchId', branchId);
    return this.http.get<Product[]>(this.api.url(`${this.path}/best-sellers`), { params }).pipe(
      catchError(() => of([]))
    );
  }

  getById(id: string): Observable<Product> {
    let params = new HttpParams();
    const branchId = this.branchService.getSelectedId();
    if (branchId) params = params.set('branchId', branchId);
    return this.http.get<Product>(this.api.url(`${this.path}/${id}`), { params }).pipe(
      catchError(() => of({} as Product))
    );
  }

  getTags(): Observable<Tag[]> {
    return this.http.get<Tag[]>(this.api.url('tags/public')).pipe(
      catchError(() => of([]))
    );
  }
}
