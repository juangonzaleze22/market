import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface StockSubscription {
  id: string;
  productId: string;
  email: string;
  notifiedAt: string | null;
  createdAt: string;
}

export interface SubscribeStockResponse {
  subscribed: boolean;
  alreadySubscribed: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class StockSubscriptionService {
  private readonly path = 'stock-subscriptions';

  constructor(private http: HttpClient, private api: ApiService) {}

  subscribe(productId: string, email: string): Observable<SubscribeStockResponse> {
    return this.http.post<SubscribeStockResponse>(this.api.url(this.path), {
      productId,
      email,
    });
  }

  getByProduct(productId: string): Observable<StockSubscription[]> {
    return this.http.get<StockSubscription[]>(
      this.api.url(`${this.path}/product/${productId}`),
    );
  }
}
