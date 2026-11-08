import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { ApiService } from './api.service';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  icon: string;
}

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly path = 'categories';

  constructor(private http: HttpClient, private api: ApiService) {}

  getAll(): Observable<Category[]> {
    return this.http.get<Category[]>(this.api.url(this.path)).pipe(
      catchError(() => of([]))
    );
  }

  getById(id: string): Observable<Category> {
    return this.http.get<Category>(this.api.url(`${this.path}/${id}`)).pipe(
      catchError(() => of({} as Category))
    );
  }
}
