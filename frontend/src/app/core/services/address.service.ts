import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { ApiService } from './api.service';

export interface Address {
  id: string;
  userId: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  label: string | null;
  latitude: number | null;
  longitude: number | null;
  branchId: string | null;
  zoneId: string | null;
  isDefault: boolean;
}

export interface AddressPayload {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  label?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isDefault?: boolean;
  branchId?: string | null;
  zoneId?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class AddressService {
  private readonly path = 'addresses';

  constructor(private http: HttpClient, private api: ApiService) {}

  getMine(): Observable<Address[]> {
    return this.http.get<Address[]>(this.api.url(this.path)).pipe(
      catchError(() => of([]))
    );
  }

  create(payload: AddressPayload): Observable<Address> {
    return this.http.post<Address>(this.api.url(this.path), payload);
  }

  update(id: string, payload: Partial<AddressPayload>): Observable<Address> {
    return this.http.patch<Address>(this.api.url(`${this.path}/${id}`), payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(this.api.url(`${this.path}/${id}`)).pipe(
      catchError(() => of(undefined))
    );
  }
}
