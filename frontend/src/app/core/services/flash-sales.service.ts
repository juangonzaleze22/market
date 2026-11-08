import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

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
  constructor(private http: HttpClient, private api: ApiService) {}

  getActive(): Observable<FlashSale[]> {
    return this.http.get<FlashSale[]>(this.api.url('flash-sales/active'));
  }
}
