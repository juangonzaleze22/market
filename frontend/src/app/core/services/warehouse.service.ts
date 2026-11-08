import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface WarehouseOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  paymentMethod: string | null;
  createdAt: string;
  updatedAt: string;
  totalItems: number;
  pickedItems: number;
  customerName: string | null;
}

export interface WarehouseOrderItem {
  id: string;
  productName: string;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  productId: string;
  productImage: string | null;
  picked: boolean;
  pickedAt: string | null;
  pickedById: string | null;
}

export interface WarehouseCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}

export interface WarehouseOrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  paymentMethod: string | null;
  createdAt: string;
  updatedAt: string;
  preparedAt: string | null;
  preparedById: string | null;
  totalItems: number;
  pickedItems: number;
  user: WarehouseCustomer | null;
  items: WarehouseOrderItem[];
}

export interface WarehouseQueueResponse {
  data: WarehouseOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface WarehouseOrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  preparedAt: string | null;
  preparedById: string | null;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class WarehouseService {
  private readonly path = 'warehouse';

  constructor(private http: HttpClient, private api: ApiService) {}

  getOrders(
    options: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      minItems?: number | null;
      maxItems?: number | null;
    } = {},
  ): Observable<WarehouseQueueResponse> {
    let params = new HttpParams()
      .set('page', (options.page ?? 1).toString())
      .set('limit', (options.limit ?? 10).toString());
    if (options.search) {
      params = params.set('search', options.search);
    }
    if (options.status) {
      params = params.set('status', options.status);
    }
    if (options.dateFrom) {
      params = params.set('dateFrom', options.dateFrom);
    }
    if (options.dateTo) {
      params = params.set('dateTo', options.dateTo);
    }
    if (options.minItems != null) {
      params = params.set('minItems', options.minItems.toString());
    }
    if (options.maxItems != null) {
      params = params.set('maxItems', options.maxItems.toString());
    }
    return this.http.get<WarehouseQueueResponse>(
      this.api.url(`${this.path}/orders`),
      { params },
    );
  }

  getOrder(id: string): Observable<WarehouseOrderDetail> {
    return this.http.get<WarehouseOrderDetail>(
      this.api.url(`${this.path}/orders/${id}`),
    );
  }

  startOrder(id: string): Observable<WarehouseOrderSummary> {
    return this.http.post<WarehouseOrderSummary>(
      this.api.url(`${this.path}/orders/${id}/start`),
      {},
    );
  }

  setItemPicked(
    orderId: string,
    itemId: string,
    picked: boolean,
  ): Observable<{
    id: string;
    orderId: string;
    picked: boolean;
    pickedAt: string | null;
    pickedById: string | null;
    totalItems: number;
    pickedItems: number;
  }> {
    return this.http.patch<{
      id: string;
      orderId: string;
      picked: boolean;
      pickedAt: string | null;
      pickedById: string | null;
      totalItems: number;
      pickedItems: number;
    }>(this.api.url(`${this.path}/orders/${orderId}/items/${itemId}`), {
      picked,
    });
  }

  completeOrder(id: string): Observable<WarehouseOrderSummary> {
    return this.http.post<WarehouseOrderSummary>(
      this.api.url(`${this.path}/orders/${id}/complete`),
      {},
    );
  }
}
