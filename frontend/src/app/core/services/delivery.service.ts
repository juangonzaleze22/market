import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface DeliveryPosition {
  latitude: number;
  longitude: number;
  at: string | null;
}

export interface DeliveryOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  paymentMethod: string | null;
  deliveryId: string | null;
  deliveryAcceptedAt: string | null;
  deliveredAt: string | null;
  deliveryPosition: DeliveryPosition | null;
  totalItems?: number;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryOrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  productId: string;
  productImage: string | null;
}

export interface DeliveryOrderDetail extends DeliveryOrder {
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
  } | null;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  } | null;
  delivery: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  } | null;
  items: DeliveryOrderItem[];
}

export interface DeliveryListResponse {
  data: DeliveryOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type DeliveryScope = 'available' | 'mine' | 'delivered';

@Injectable({
  providedIn: 'root',
})
export class DeliveryService {
  private readonly path = 'delivery';

  constructor(private http: HttpClient, private api: ApiService) {}

  getOrders(
    scope: DeliveryScope = 'available',
    page = 1,
    limit = 10,
    search = '',
  ): Observable<DeliveryListResponse> {
    let params = new HttpParams()
      .set('scope', scope)
      .set('page', page.toString())
      .set('limit', limit.toString());
    if (search) params = params.set('search', search);
    return this.http.get<DeliveryListResponse>(
      this.api.url(`${this.path}/orders`),
      { params },
    );
  }

  getOrder(id: string): Observable<DeliveryOrderDetail> {
    return this.http.get<DeliveryOrderDetail>(
      this.api.url(`${this.path}/orders/${id}`),
    );
  }

  accept(id: string): Observable<DeliveryOrder> {
    return this.http.post<DeliveryOrder>(
      this.api.url(`${this.path}/orders/${id}/accept`),
      {},
    );
  }

  complete(id: string): Observable<DeliveryOrder> {
    return this.http.post<DeliveryOrder>(
      this.api.url(`${this.path}/orders/${id}/complete`),
      {},
    );
  }

  updateLocation(
    id: string,
    latitude: number,
    longitude: number,
  ): Observable<DeliveryPosition> {
    return this.http.patch<DeliveryPosition>(
      this.api.url(`${this.path}/orders/${id}/location`),
      { latitude, longitude },
    );
  }
}
