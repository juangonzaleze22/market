import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { ApiService } from './api.service';

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: string;
  totalAmount: number;
  paymentMethod: string | null;
  receiptUrl: string | null;
  rejectionReason: string | null;
  rejectedAt: string | null;
  deliveryId?: string | null;
  createdAt: string;
}

export interface OrderDeliveryInfo {
  assigned: boolean;
  status: string;
  delivery: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  } | null;
  position: {
    latitude: number;
    longitude: number;
    at: string | null;
  } | null;
  destination: {
    latitude: number | null;
    longitude: number | null;
  } | null;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  productImage: string | null;
  flashSaleId: string | null;
  originalPrice: number | null;
  hasFlashDiscount: boolean;
}

export interface CreateOrderPayload {
  shippingAddressId: string;
  branchId?: string;
  paymentMethod?: string;
  paymentReference?: string;
  receipt?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  createdAt: string;
}

export interface UserStats {
  totalOrders: number;
  totalSpent: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
}

export interface OrderFull extends Order {
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  } | null;
  items: OrderItem[];
}

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly path = 'orders';

  constructor(private http: HttpClient, private api: ApiService) {}

  getMine(): Observable<Order[]> {
    return this.http.get<Order[]>(this.api.url(this.path)).pipe(
      catchError(() => of([]))
    );
  }

  getById(id: string): Observable<Order> {
    return this.http.get<Order>(this.api.url(`${this.path}/${id}`)).pipe(
      catchError(() => of({} as Order))
    );
  }

  getItems(id: string): Observable<OrderItem[]> {
    return this.http.get<OrderItem[]>(this.api.url(`${this.path}/${id}/items`)).pipe(
      catchError(() => of([]))
    );
  }

  getFullById(id: string): Observable<OrderFull> {
    return this.http.get<OrderFull>(this.api.url(`${this.path}/${id}/full`)).pipe(
      catchError(() => of({} as OrderFull))
    );
  }

  getDeliveryInfo(id: string): Observable<OrderDeliveryInfo> {
    return this.http
      .get<OrderDeliveryInfo>(this.api.url(`${this.path}/${id}/delivery`))
      .pipe(
        catchError(() =>
          of({
            assigned: false,
            status: '',
            delivery: null,
            position: null,
            destination: null,
          } as OrderDeliveryInfo),
        ),
      );
  }

  create(payload: CreateOrderPayload): Observable<Order> {
    return this.http.post<Order>(this.api.url(this.path), payload);
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.api.url('users/profile')).pipe(
      catchError(() => of({} as UserProfile))
    );
  }

  getStats(): Observable<UserStats> {
    return this.http.get<UserStats>(this.api.url('users/stats')).pipe(
      catchError(() => of({
        totalOrders: 0,
        totalSpent: 0,
        pendingOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
      }))
    );
  }
}
