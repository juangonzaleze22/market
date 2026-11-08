import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';
import { ApiService } from './api.service';

export interface ZonePoint {
  lat: number;
  lng: number;
}

export interface DeliveryZone {
  id: string;
  branchId: string;
  name: string;
  polygon: ZonePoint[] | null;
  centerLat: number | string | null;
  centerLng: number | string | null;
  radiusKm: number | string | null;
  deliveryFee: number | string;
  isActive: boolean;
}

export interface Branch {
  id: string;
  name: string;
  slug: string;
  code: string | null;
  addressLine: string | null;
  city: string;
  state: string;
  country: string;
  latitude: number | string;
  longitude: number | string;
  phone: string | null;
  deliveryHours: string | null;
  isActive: boolean;
  isDefault: boolean;
}

export interface BranchResolveResult {
  branch: Branch | null;
  zone: DeliveryZone | null;
  inCoverage: boolean;
}

const STORAGE_KEY = 'market_branch_id';

@Injectable({
  providedIn: 'root',
})
export class BranchService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiService);
  private readonly path = 'branches';

  readonly branches = signal<Branch[]>([]);
  readonly selectedBranch = signal<Branch | null>(null);
  readonly loaded = signal(false);
  private zonesCache = new Map<string, DeliveryZone[]>();

  load(force = false): void {
    if (this.loaded() && !force) return;

    this.http
      .get<Branch[]>(this.api.url(this.path))
      .pipe(catchError(() => of([] as Branch[])))
      .subscribe((branches) => {
        this.branches.set(branches);
        this.loaded.set(true);

        const storedId = this.readStoredId();
        const stored = branches.find((branch) => branch.id === storedId);
        const fallback =
          branches.find((branch) => branch.isDefault) ?? branches[0] ?? null;
        this.selectedBranch.set(stored ?? fallback);
      });
  }

  setSelected(branch: Branch | null): void {
    this.selectedBranch.set(branch);
    if (branch) {
      try {
        localStorage.setItem(STORAGE_KEY, branch.id);
      } catch {
        // storage unavailable
      }
    } else {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // storage unavailable
      }
    }
  }

  getSelectedId(): string | null {
    return this.selectedBranch()?.id ?? null;
  }

  getZones(branchId: string, force = false): Observable<DeliveryZone[]> {
    const cached = this.zonesCache.get(branchId);
    if (cached && !force) return of(cached);

    return this.http
      .get<DeliveryZone[]>(this.api.url(`${this.path}/${branchId}/zones`))
      .pipe(
        catchError(() => of([] as DeliveryZone[])),
        tap((zones) => this.zonesCache.set(branchId, zones)),
      );
  }

  resolve(lat: number, lng: number): Observable<BranchResolveResult> {
    return this.http
      .get<BranchResolveResult>(
        this.api.url(`${this.path}/resolve?lat=${lat}&lng=${lng}`),
      )
      .pipe(
        catchError(() =>
          of({ branch: null, zone: null, inCoverage: false }),
        ),
      );
  }

  private readStoredId(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }
}
