import {
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { AdminService, BranchPayload, ZonePayload } from '../../../core/services/admin.service';
import type { Branch, DeliveryZone, ZonePoint } from '../../../core/services/branch.service';
import { environment } from '../../../../environments/environment';

const EMPTY_BRANCH: BranchPayload = {
  name: '',
  slug: '',
  code: '',
  addressLine: '',
  city: '',
  state: '',
  country: 'Venezuela',
  latitude: 9.0422,
  longitude: -69.7423,
  phone: '',
  deliveryHours: '',
  isActive: true,
  isDefault: false,
};

@Component({
  selector: 'app-admin-branches',
  imports: [FormsModule],
  template: `
    <div class="flex flex-col gap-xl" data-testid="admin-branches">
      <div class="flex flex-wrap items-center justify-between gap-md">
        <div>
          <h1 class="text-display-sm font-bold">Sucursales</h1>
          <p class="text-body-sm text-body">
            Configurá las sucursales y sus zonas de cobertura.
          </p>
        </div>
        <button type="button" class="btn-primary" (click)="openCreateBranch()" data-testid="new-branch">
          Nueva sucursal
        </button>
      </div>

      @if (error()) {
        <p class="form-error" data-testid="branches-error">{{ error() }}</p>
      }
      @if (success()) {
        <p class="text-body-sm text-body" data-testid="branches-success">{{ success() }}</p>
      }

      @if (showBranchForm()) {
        <form
          class="bg-canvas rounded-xl border border-surface-pressed p-xl flex flex-col gap-lg"
          (ngSubmit)="saveBranch()"
          data-testid="branch-form"
        >
          <h2 class="text-body-lg-strong">
            {{ editingBranchId() ? 'Editar sucursal' : 'Nueva sucursal' }}
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <div>
              <label class="form-label">Nombre</label>
              <input class="form-input" [(ngModel)]="branchForm.name" name="name" required />
            </div>
            <div>
              <label class="form-label">Slug</label>
              <input class="form-input" [(ngModel)]="branchForm.slug" name="slug" placeholder="guanare" />
            </div>
            <div>
              <label class="form-label">Código</label>
              <input class="form-input" [(ngModel)]="branchForm.code" name="code" />
            </div>
            <div>
              <label class="form-label">Teléfono</label>
              <input class="form-input" [(ngModel)]="branchForm.phone" name="phone" />
            </div>
            <div>
              <label class="form-label">Ciudad</label>
              <input class="form-input" [(ngModel)]="branchForm.city" name="city" required />
            </div>
            <div>
              <label class="form-label">Estado</label>
              <input class="form-input" [(ngModel)]="branchForm.state" name="state" required />
            </div>
            <div>
              <label class="form-label">Latitud</label>
              <input class="form-input" type="number" step="0.0000001" [(ngModel)]="branchForm.latitude" name="latitude" required />
            </div>
            <div>
              <label class="form-label">Longitud</label>
              <input class="form-input" type="number" step="0.0000001" [(ngModel)]="branchForm.longitude" name="longitude" required />
            </div>
            <div>
              <label class="form-label">Horario de entrega</label>
              <input class="form-input" [(ngModel)]="branchForm.deliveryHours" name="deliveryHours" />
            </div>
            <div>
              <label class="form-label">Dirección</label>
              <input class="form-input" [(ngModel)]="branchForm.addressLine" name="addressLine" />
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-xl">
            <label class="flex items-center gap-sm text-body-sm">
              <input type="checkbox" [(ngModel)]="branchForm.isActive" name="isActive" class="accent-primary" />
              Activa
            </label>
            <label class="flex items-center gap-sm text-body-sm">
              <input type="checkbox" [(ngModel)]="branchForm.isDefault" name="isDefault" class="accent-primary" />
              Sucursal por defecto
            </label>
          </div>

          <div class="flex gap-md">
            <button type="submit" class="btn-primary" [disabled]="saving()">
              {{ saving() ? 'Guardando...' : 'Guardar sucursal' }}
            </button>
            <button type="button" class="btn-secondary" (click)="closeBranchForm()">Cancelar</button>
          </div>
        </form>
      }

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-xl">
        <div class="lg:col-span-1 flex flex-col gap-md" data-testid="branch-list">
          @for (branch of branches(); track branch.id) {
            <button
              type="button"
              class="text-left rounded-xl border p-lg bg-canvas transition-colors"
              [class.border-primary]="selected()?.id === branch.id"
              [class.border-surface-pressed]="selected()?.id !== branch.id"
              (click)="selectBranch(branch)"
              [attr.data-testid]="'branch-' + branch.id"
            >
              <div class="flex items-center justify-between gap-sm">
                <p class="text-body-sm-strong">{{ branch.name }}</p>
                @if (branch.isDefault) {
                  <span class="text-caption px-2 py-1 rounded-full bg-canvas-soft">Por defecto</span>
                }
              </div>
              <p class="text-body-sm text-body">{{ branch.city }}, {{ branch.state }}</p>
              <p class="text-caption text-mute">
                {{ branch.isActive ? 'Activa' : 'Inactiva' }}
              </p>
            </button>
          } @empty {
            <p class="text-body-sm text-body">Todavía no hay sucursales.</p>
          }
        </div>

        <div class="lg:col-span-2 flex flex-col gap-lg">
          @if (selected(); as branch) {
            <div class="rounded-xl border border-surface-pressed p-xl bg-canvas">
              <div class="flex flex-wrap items-center justify-between gap-md">
                <div>
                  <h2 class="text-body-lg-strong">{{ branch.name }}</h2>
                  <p class="text-body-sm text-body">
                    {{ branch.addressLine || branch.city }}, {{ branch.state }}
                  </p>
                </div>
                <div class="flex gap-sm">
                  <button type="button" class="btn-secondary" (click)="openEditBranch(branch)">
                    Editar
                  </button>
                  <button type="button" class="btn-secondary" (click)="deleteBranch(branch)">
                    Eliminar
                  </button>
                </div>
              </div>
            </div>

            <div class="rounded-xl border border-surface-pressed p-xl bg-canvas">
              <div class="flex flex-wrap items-center justify-between gap-md mb-lg">
                <h3 class="text-body-md-strong">Zonas de cobertura</h3>
                <button type="button" class="btn-primary" (click)="openCreateZone()" data-testid="new-zone">
                  Nueva zona
                </button>
              </div>

              @if (showZoneEditor()) {
                <div class="flex flex-col gap-lg mb-xl" data-testid="zone-form">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-lg">
                    <div>
                      <label class="form-label">Nombre de la zona</label>
                      <input class="form-input" [(ngModel)]="zoneForm.name" name="zoneName" />
                    </div>
                    <div>
                      <label class="form-label">Costo de envío</label>
                      <input class="form-input" type="number" step="0.01" [(ngModel)]="zoneForm.deliveryFee" name="zoneFee" />
                    </div>
                  </div>

                  <p class="form-hint">
                    Hacé clic en el mapa para agregar los vértices del polígono (mínimo 3).
                  </p>
                  <div id="zone-editor-map" class="rounded-xl border border-surface-pressed" style="height: 320px; width: 100%;"></div>
                  <p class="text-body-sm text-body">
                    Vértices: {{ polygon().length }}
                  </p>

                  <div class="flex flex-wrap gap-md">
                    <button type="submit" class="btn-primary" (click)="saveZone()" [disabled]="saving()">
                      {{ saving() ? 'Guardando...' : 'Guardar zona' }}
                    </button>
                    <button type="button" class="btn-secondary" (click)="undoPoint()">Deshacer punto</button>
                    <button type="button" class="btn-secondary" (click)="clearPolygon()">Limpiar</button>
                    <button type="button" class="btn-secondary" (click)="closeZoneEditor()">Cancelar</button>
                  </div>
                </div>
              }

              <div class="flex flex-col gap-sm" data-testid="zone-list">
                @for (zone of zones(); track zone.id) {
                  <div class="flex items-center justify-between gap-md rounded-lg bg-canvas-soft px-lg py-md">
                    <div>
                      <p class="text-body-sm-strong">{{ zone.name }}</p>
                      <p class="text-caption text-mute">
                        {{ zone.polygon?.length || 0 }} vértices · Envío {{ zone.deliveryFee }}
                      </p>
                    </div>
                    <div class="flex gap-sm">
                      <button type="button" class="btn-secondary" (click)="openEditZone(zone)">Editar</button>
                      <button type="button" class="btn-secondary" (click)="deleteZone(zone)">Eliminar</button>
                    </div>
                  </div>
                } @empty {
                  <p class="text-body-sm text-body">Esta sucursal no tiene zonas aún.</p>
                }
              </div>
            </div>
          } @else {
            <p class="text-body-sm text-body">Seleccioná una sucursal para ver sus zonas.</p>
          }
        </div>
      </div>
    </div>
  `,
})
export class AdminBranches implements OnInit, OnDestroy {
  private readonly admin = inject(AdminService);

  protected readonly branches = signal<Branch[]>([]);
  protected readonly zones = signal<DeliveryZone[]>([]);
  protected readonly selected = signal<Branch | null>(null);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');

  protected readonly showBranchForm = signal(false);
  protected readonly editingBranchId = signal<string | null>(null);
  protected branchForm: BranchPayload = { ...EMPTY_BRANCH };

  protected readonly showZoneEditor = signal(false);
  protected readonly editingZoneId = signal<string | null>(null);
  protected readonly polygon = signal<ZonePoint[]>([]);
  protected zoneForm = { name: '', deliveryFee: 0 };

  private map: L.Map | null = null;
  private polygonLayer: L.Polygon | null = null;
  private markers: L.CircleMarker[] = [];

  ngOnInit(): void {
    this.loadBranches();
  }

  ngOnDestroy(): void {
    this.destroyMap();
  }

  protected selectBranch(branch: Branch): void {
    this.selected.set(branch);
    this.loadZones(branch.id);
  }

  protected openCreateBranch(): void {
    this.editingBranchId.set(null);
    this.branchForm = { ...EMPTY_BRANCH };
    this.showBranchForm.set(true);
    this.error.set('');
  }

  protected openEditBranch(branch: Branch): void {
    this.editingBranchId.set(branch.id);
    this.branchForm = {
      name: branch.name,
      slug: branch.slug,
      code: branch.code ?? '',
      addressLine: branch.addressLine ?? '',
      city: branch.city,
      state: branch.state,
      country: branch.country,
      latitude: Number(branch.latitude),
      longitude: Number(branch.longitude),
      phone: branch.phone ?? '',
      deliveryHours: branch.deliveryHours ?? '',
      isActive: branch.isActive,
      isDefault: branch.isDefault,
    };
    this.showBranchForm.set(true);
    this.error.set('');
  }

  protected closeBranchForm(): void {
    this.showBranchForm.set(false);
    this.editingBranchId.set(null);
  }

  protected saveBranch(): void {
    if (!this.branchForm.name.trim() || !this.branchForm.city.trim() || !this.branchForm.state.trim()) {
      this.error.set('Nombre, ciudad y estado son obligatorios');
      return;
    }

    const payload: BranchPayload = {
      ...this.branchForm,
      slug:
        this.branchForm.slug.trim() ||
        this.branchForm.name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
    };

    this.saving.set(true);
    const id = this.editingBranchId();
    const request = id
      ? this.admin.updateBranch(id, payload)
      : this.admin.createBranch(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set(id ? 'Sucursal actualizada' : 'Sucursal creada');
        this.closeBranchForm();
        this.loadBranches();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message || 'No se pudo guardar la sucursal');
      },
    });
  }

  protected deleteBranch(branch: Branch): void {
    if (!confirm(`¿Eliminar la sucursal "${branch.name}"?`)) return;
    this.admin.deleteBranch(branch.id).subscribe({
      next: () => {
        this.success.set('Sucursal eliminada');
        this.selected.set(null);
        this.zones.set([]);
        this.loadBranches();
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'No se pudo eliminar la sucursal');
      },
    });
  }

  protected openCreateZone(): void {
    this.destroyMap();
    this.editingZoneId.set(null);
    this.zoneForm = { name: '', deliveryFee: 0 };
    this.polygon.set([]);
    this.showZoneEditor.set(true);
    this.error.set('');
    setTimeout(() => this.initMap(), 120);
  }

  protected openEditZone(zone: DeliveryZone): void {
    this.destroyMap();
    this.editingZoneId.set(zone.id);
    this.zoneForm = {
      name: zone.name,
      deliveryFee: Number(zone.deliveryFee ?? 0),
    };
    this.polygon.set(zone.polygon ? [...zone.polygon] : []);
    this.showZoneEditor.set(true);
    this.error.set('');
    setTimeout(() => this.initMap(), 120);
  }

  protected closeZoneEditor(): void {
    this.showZoneEditor.set(false);
    this.editingZoneId.set(null);
    this.destroyMap();
  }

  protected undoPoint(): void {
    const next = this.polygon().slice(0, -1);
    this.polygon.set(next);
    this.redraw();
  }

  protected clearPolygon(): void {
    this.polygon.set([]);
    this.redraw();
  }

  protected saveZone(): void {
    const branch = this.selected();
    if (!branch) return;
    if (!this.zoneForm.name.trim()) {
      this.error.set('El nombre de la zona es obligatorio');
      return;
    }
    if (this.polygon().length < 3) {
      this.error.set('El polígono debe tener al menos 3 vértices');
      return;
    }

    const payload: ZonePayload = {
      name: this.zoneForm.name.trim(),
      polygon: this.polygon(),
      deliveryFee: this.zoneForm.deliveryFee || 0,
      isActive: true,
    };

    this.saving.set(true);
    const zoneId = this.editingZoneId();
    const request = zoneId
      ? this.admin.updateZone(branch.id, zoneId, payload)
      : this.admin.createZone(branch.id, payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set(zoneId ? 'Zona actualizada' : 'Zona creada');
        this.closeZoneEditor();
        this.loadZones(branch.id);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message || 'No se pudo guardar la zona');
      },
    });
  }

  protected deleteZone(zone: DeliveryZone): void {
    const branch = this.selected();
    if (!branch) return;
    if (!confirm(`¿Eliminar la zona "${zone.name}"?`)) return;

    this.admin.deleteZone(branch.id, zone.id).subscribe({
      next: () => {
        this.success.set('Zona eliminada');
        this.loadZones(branch.id);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'No se pudo eliminar la zona');
      },
    });
  }

  private loadBranches(): void {
    this.loading.set(true);
    this.admin.getBranches().subscribe({
      next: (branches) => {
        this.branches.set(branches);
        this.loading.set(false);

        const current = this.selected();
        const nextSelected =
          branches.find((branch) => branch.id === current?.id) ??
          branches.find((branch) => branch.isDefault) ??
          branches[0] ??
          null;
        this.selected.set(nextSelected);
        if (nextSelected) this.loadZones(nextSelected.id);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudieron cargar las sucursales');
      },
    });
  }

  private loadZones(branchId: string): void {
    this.admin.getBranchZones(branchId).subscribe({
      next: (zones) => this.zones.set(zones),
      error: () => this.zones.set([]),
    });
  }

  private initMap(): void {
    if (this.map) return;
    const container = document.getElementById('zone-editor-map');
    if (!container) return;

    const branch = this.selected();
    const center: L.LatLngTuple = branch
      ? [Number(branch.latitude), Number(branch.longitude)]
      : [environment.mapCenterLat, environment.mapCenterLng];

    this.map = L.map('zone-editor-map').setView(center, 13);
    L.tileLayer(environment.mapTileUrl, {
      attribution: environment.mapTileAttribution,
      maxZoom: 19,
    }).addTo(this.map);

    this.map.on('click', (event: L.LeafletMouseEvent) => {
      this.polygon.update((points) => [
        ...points,
        { lat: event.latlng.lat, lng: event.latlng.lng },
      ]);
      this.redraw();
    });

    this.redraw();
    setTimeout(() => this.map?.invalidateSize(), 250);
  }

  private redraw(): void {
    if (!this.map) return;

    this.polygonLayer?.remove();
    this.polygonLayer = null;
    for (const marker of this.markers) marker.remove();
    this.markers = [];

    const points = this.polygon();
    for (const point of points) {
      const marker = L.circleMarker([point.lat, point.lng], {
        radius: 6,
        color: '#000000',
        fillColor: '#000000',
        fillOpacity: 1,
      }).addTo(this.map);
      this.markers.push(marker);
    }

    if (points.length >= 2) {
      this.polygonLayer = L.polygon(
        points.map((point) => [point.lat, point.lng] as L.LatLngTuple),
        {
          color: '#000000',
          weight: 2,
          fillColor: '#000000',
          fillOpacity: 0.1,
        },
      ).addTo(this.map);
    }
  }

  private destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.polygonLayer = null;
      this.markers = [];
    }
  }
}
