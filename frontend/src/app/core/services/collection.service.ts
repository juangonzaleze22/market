import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { ApiService } from './api.service';
import { BranchService } from './branch.service';
import { Product } from './product.service';

export interface CollectionSection {
  id: string;
  title: string;
  slug: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  maxItems?: number;
  sortOrder?: number;
  productCount?: number;
  productIds?: string[];
  products?: Product[];
}

export interface CollectionProductLink {
  productId: string;
  position: number;
  productName?: string;
  productImage?: string | null;
  productPrice?: number;
  productStock?: number;
}

export interface AdminCollection {
  id: string;
  title: string;
  slug: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  placements: string[];
  maxItems: number;
  sortOrder: number;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  productCount: number;
  createdAt?: string;
}

export interface AdminCollectionDetail {
  id: string;
  title: string;
  slug: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  placements: string[];
  maxItems: number;
  sortOrder: number;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  products: CollectionProductLink[];
}

export interface CollectionProductInput {
  productId: string;
  position?: number;
}

export interface CollectionPayload {
  title: string;
  slug: string;
  subtitle?: string;
  imageUrl?: string;
  placements?: string[];
  maxItems?: number;
  sortOrder?: number;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  products?: CollectionProductInput[];
}

export interface AdminCollectionListResponse {
  data: AdminCollection[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type SuggestionRule =
  | 'NEWEST'
  | 'BEST_SELLERS'
  | 'ON_SALE'
  | 'CATEGORY'
  | 'TAG';

export interface SuggestionQuery {
  limit?: number;
  search?: string;
  categoryId?: string;
  tagId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CollectionService {
  private readonly path = 'collections';
  private readonly adminPath = 'admin/collections';

  constructor(
    private http: HttpClient,
    private api: ApiService,
    private branchService: BranchService,
  ) {}

  getSections(placement: 'home' | 'shop'): Observable<CollectionSection[]> {
    let params = new HttpParams().set('placement', placement);
    const branchId = this.branchService.getSelectedId();
    if (branchId) params = params.set('branchId', branchId);
    return this.http
      .get<CollectionSection[]>(this.api.url(this.path), { params })
      .pipe(catchError(() => of([])));
  }

  getBySlug(slug: string): Observable<CollectionSection> {
    let params = new HttpParams();
    const branchId = this.branchService.getSelectedId();
    if (branchId) params = params.set('branchId', branchId);
    return this.http.get<CollectionSection>(
      this.api.url(`${this.path}/${slug}`),
      { params },
    );
  }

  getAll(
    page = 1,
    limit = 10,
    search = '',
  ): Observable<AdminCollectionListResponse> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));
    if (search) params = params.set('search', search);
    return this.http.get<AdminCollectionListResponse>(
      this.api.url(this.adminPath),
      { params },
    );
  }

  getOne(id: string): Observable<AdminCollectionDetail> {
    return this.http.get<AdminCollectionDetail>(
      this.api.url(`${this.adminPath}/${id}`),
    );
  }

  create(payload: CollectionPayload): Observable<AdminCollectionDetail> {
    return this.http.post<AdminCollectionDetail>(
      this.api.url(this.adminPath),
      payload,
    );
  }

  update(
    id: string,
    payload: Partial<CollectionPayload>,
  ): Observable<AdminCollectionDetail> {
    return this.http.patch<AdminCollectionDetail>(
      this.api.url(`${this.adminPath}/${id}`),
      payload,
    );
  }

  replaceProducts(
    id: string,
    products: CollectionProductInput[],
  ): Observable<AdminCollectionDetail> {
    return this.http.put<AdminCollectionDetail>(
      this.api.url(`${this.adminPath}/${id}/products`),
      { products },
    );
  }

  remove(id: string): Observable<{ deleted: boolean; id: string }> {
    return this.http.delete<{ deleted: boolean; id: string }>(
      this.api.url(`${this.adminPath}/${id}`),
    );
  }

  getSuggestions(
    rule: SuggestionRule,
    query: SuggestionQuery = {},
  ): Observable<Product[]> {
    let params = new HttpParams().set('rule', rule);
    const branchId = this.branchService.getSelectedId();
    if (branchId) params = params.set('branchId', branchId);
    params = params.set('limit', String(query.limit ?? 12));
    if (query.search) params = params.set('search', query.search);
    if (query.categoryId) params = params.set('categoryId', query.categoryId);
    if (query.tagId) params = params.set('tagId', query.tagId);
    return this.http
      .get<Product[]>(this.api.url(`${this.adminPath}/suggestions`), { params })
      .pipe(catchError(() => of([])));
  }
}
