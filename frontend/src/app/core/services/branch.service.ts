import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';
import { ApiService } from './api.service';
import { haversineKm } from '../utils/geo.util';

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
  readonly locating = signal(false);
  readonly locationError = signal('');
  private zonesCache = new Map<string, DeliveryZone[]>();
  private userChoseBranch = false;

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

        if (!stored) {
          void this.detectNearest();
        }
      });
  }

  setSelected(branch: Branch | null, markAsUserChoice = true): void {
    if (markAsUserChoice) {
      this.userChoseBranch = true;
    }
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

  async detectNearest(force = false): Promise<Branch | null> {
    if (!this.branches().length || typeof navigator === 'undefined') {
      return null;
    }
    if (!navigator.geolocation) {
      this.locationError.set('Este dispositivo no permite obtener la ubicación.');
      return null;
    }

    this.locating.set(true);
    this.locationError.set('');

    try {
      const position = await this.getCurrentPosition();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      const resolved = await new Promise<BranchResolveResult>((resolve) => {
        this.resolve(lat, lng).subscribe((result) => resolve(result));
      });

      let branch: Branch | null = resolved.branch ?? null;

      if (!branch) {
        branch = this.nearestBranch(lat, lng);
      }

      if (branch && (force || !this.userChoseBranch)) {
        this.setSelected(branch, force);
      }

      return branch;
    } catch {
      this.locationError.set(
        'No pudimos obtener tu ubicación. Elegí una sucursal manualmente.',
      );
      return null;
    } finally {
      this.locating.set(false);
    }
  }

  nearestBranch(lat: number, lng: number): Branch | null {
    const branches = this.branches().filter((branch) => branch.isActive);
    if (branches.length === 0) return null;

    let closest: Branch | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (const branch of branches) {
      const distance = haversineKm(
        { lat, lng },
        { lat: Number(branch.latitude), lng: Number(branch.longitude) },
      );
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = branch;
      }
    }

    return closest;
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

  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 5 * 60 * 1000,
      });
    });
  }
}
