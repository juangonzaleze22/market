import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Banner {
  id: string;
  title: string | null;
  subtitle: string | null;
  imageUrl: string;
  link: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
}

export interface BannerSettings {
  id: string;
  transitionEffect: string;
  autoplayDelay: number;
  animationType: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class BannerService {
  private readonly path = 'banners';

  constructor(private http: HttpClient, private api: ApiService) {}

  getAll(): Observable<Banner[]> {
    return this.http.get<Banner[]>(this.api.url(this.path));
  }

  getActive(): Observable<Banner[]> {
    return this.http.get<Banner[]>(this.api.url(`${this.path}/active`));
  }

  getSettings(): Observable<BannerSettings> {
    return this.http.get<BannerSettings>(this.api.url(`${this.path}/settings`));
  }

  create(data: Partial<Banner>): Observable<Banner> {
    return this.http.post<Banner>(this.api.url(this.path), data);
  }

  update(id: string, data: Partial<Banner>): Observable<Banner> {
    return this.http.patch<Banner>(this.api.url(`${this.path}/${id}`), data);
  }

  delete(id: string): Observable<{ deleted: boolean; id: string }> {
    return this.http.delete<{ deleted: boolean; id: string }>(this.api.url(`${this.path}/${id}`));
  }

  reorder(ids: string[]): Observable<void> {
    return this.http.post<void>(this.api.url(`${this.path}/reorder`), { ids });
  }

  updateSettings(data: Partial<BannerSettings>): Observable<BannerSettings> {
    return this.http.patch<BannerSettings>(this.api.url(`${this.path}/settings/update`), data);
  }
}
