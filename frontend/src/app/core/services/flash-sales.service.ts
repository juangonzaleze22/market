import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { BranchService } from './branch.service';

export interface FlashSaleProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  featuredImage: string | null;
  images: string[];
  discountPercent: number | null;
  discountPrice: number | null;
  hasDiscount: boolean;
  category: { id: string; name: string; slug: string } | null;
  stock: number;
}

export interface FlashSaleItem {
  id: string;
  productId: string;
  product: FlashSaleProduct;
  flashPrice: number;
  flashSaleId: string;
  quantity: number;
}

export interface FlashSale {
  id: string;
  title: string;
  discountPercent: number;
  startTime: string;
  endTime: string;
  maxItems: number;
  items: FlashSaleItem[];
}

@Injectable({
  providedIn: 'root',
})
export class FlashSalesService {
  constructor(
    private http: HttpClient,
    private api: ApiService,
    private branchService: BranchService,
  ) {}

  getActive(): Observable<FlashSale[]> {
    let params = new HttpParams();
    const branchId = this.branchService.getSelectedId();
    if (branchId) params = params.set('branchId', branchId);
    return this.http.get<FlashSale[]>(this.api.url('flash-sales/active'), { params });
  }
}
