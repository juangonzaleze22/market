import {
  Component,
  EventEmitter,
  OnDestroy,
  Output,
  computed,
  input,
  signal,
} from '@angular/core';
import * as L from 'leaflet';
import { environment } from '../../../environments/environment';
import type { Branch, DeliveryZone } from '../../core/services/branch.service';
import { isInsideAnyZone } from '../../core/utils/geo.util';

const DEFAULT_ZOOM = environment.mapPickerZoom;

@Component({
  selector: 'app-map-picker',
  template: `
    @if (isOpen()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        (click)="close()"
      >
        <div
          class="bg-canvas rounded-xl shadow-2xl w-full max-w-[42rem] mx-4 overflow-hidden"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-center justify-between px-2xl py-lg border-b border-surface-pressed">
            <div>
              <h3 class="text-body-lg-strong">Seleccioná tu ubicación</h3>
              @if (branch(); as selectedBranch) {
                <p class="text-body-sm text-body">
                  Entrega en {{ selectedBranch.name }}
                </p>
              }
            </div>
            <button
              type="button"
              class="icon-btn-circular"
              (click)="close()"
              aria-label="Cerrar"
            >✕</button>
          </div>

          <div class="px-2xl py-lg">
            <p class="text-body-sm text-body mb-lg">
              Hacé clic dentro de la zona de cobertura para elegir la dirección de entrega
            </p>

            <div
              #mapContainer
              id="delivery-map"
              class="rounded-xl border border-surface-pressed"
              style="height: 360px; width: 100%;"
            ></div>

            @if (coverageError()) {
              <p class="form-error mt-md" data-testid="map-coverage-error">
                {{ coverageError() }}
              </p>
            }

            @if (markerPosition()) {
              <div class="mt-lg bg-canvas-soft rounded-xl px-xl py-lg">
                <p class="text-body-sm-strong">Ubicación seleccionada</p>
                <p class="text-body-sm text-body">
                  Lat: {{ markerPosition()![0].toFixed(6) }},
                  Lng: {{ markerPosition()![1].toFixed(6) }}
                </p>
              </div>
            }

            @if (!markerPosition()) {
              <p class="text-body-sm text-mute mt-lg text-center">
                Aún no seleccionaste ubicación
              </p>
            }
          </div>

          <div class="flex justify-end gap-lg px-2xl py-lg border-t border-surface-pressed">
            <button type="button" class="btn-secondary" (click)="close()">Cancelar</button>
            <button
              type="button"
              class="btn-primary"
              [disabled]="!markerPosition()"
              (click)="confirm()"
            >
              Confirmar ubicación
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class MapPicker implements OnDestroy {
  @Output() locationSelected = new EventEmitter<{ lat: number; lng: number }>();

  readonly branch = input<Branch | null>(null);
  readonly zones = input<DeliveryZone[]>([]);

  readonly isOpen = signal(false);
  readonly markerPosition = signal<L.LatLngTuple | null>(null);
  readonly coverageError = signal('');

  private readonly center = computed<L.LatLngTuple>(() => {
    const selected = this.branch();
    if (selected) {
      return [Number(selected.latitude), Number(selected.longitude)];
    }
    return [environment.mapCenterLat, environment.mapCenterLng];
  });

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;

  open(): void {
    this.isOpen.set(true);
    this.markerPosition.set(null);
    this.coverageError.set('');
    setTimeout(() => this.initMap(), 100);
  }

  close(): void {
    this.isOpen.set(false);
    this.destroyMap();
  }

  confirm(): void {
    const pos = this.markerPosition();
    if (pos) {
      this.locationSelected.emit({ lat: pos[0], lng: pos[1] });
    }
    this.close();
  }

  private initMap(): void {
    if (this.map) return;

    this.map = L.map('delivery-map').setView(this.center(), DEFAULT_ZOOM);

    L.tileLayer(environment.mapTileUrl, {
      attribution: environment.mapTileAttribution,
      maxZoom: 19,
    }).addTo(this.map);

    this.drawCoverage();
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.handleMapClick(e.latlng.lat, e.latlng.lng);
    });

    setTimeout(() => this.map?.invalidateSize(), 300);
    setTimeout(() => this.map?.invalidateSize(), 800);
  }

  private drawCoverage(): void {
    if (!this.map) return;

    const zones = this.zones();
    const bounds = L.latLngBounds([this.center()]);

    for (const zone of zones) {
      if (zone.polygon && zone.polygon.length >= 3) {
        const points = zone.polygon.map(
          (point) => [Number(point.lat), Number(point.lng)] as L.LatLngTuple,
        );
        L.polygon(points, {
          color: '#000000',
          weight: 2,
          fillColor: '#000000',
          fillOpacity: 0.08,
        }).addTo(this.map);
        bounds.extend(points);
      } else if (
        zone.centerLat != null &&
        zone.centerLng != null &&
        zone.radiusKm != null
      ) {
        const center: L.LatLngTuple = [
          Number(zone.centerLat),
          Number(zone.centerLng),
        ];
        L.circle(center, {
          radius: Number(zone.radiusKm) * 1000,
          color: '#000000',
          weight: 2,
          fillColor: '#000000',
          fillOpacity: 0.08,
        }).addTo(this.map);
        bounds.extend(center);
      }
    }

    if (zones.length > 0) {
      this.map.fitBounds(bounds.pad(0.15), { maxZoom: DEFAULT_ZOOM + 1 });
    }
  }

  private handleMapClick(lat: number, lng: number): void {
    const zones = this.zones();
    if (zones.length > 0 && !isInsideAnyZone({ lat, lng }, zones)) {
      this.coverageError.set(
        'Esa ubicación está fuera de la zona de cobertura de la sucursal seleccionada.',
      );
      this.removeMarker();
      return;
    }

    this.coverageError.set('');
    this.setMarker(lat, lng);
  }

  private setMarker(lat: number, lng: number): void {
    if (!this.map) return;

    const icon = L.divIcon({
      className: 'map-marker',
      html: `<div style="width:24px;height:24px;background:#000;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng], { icon }).addTo(this.map!);
    }

    this.markerPosition.set([lat, lng]);
  }

  private removeMarker(): void {
    if (this.marker) {
      this.marker.remove();
      this.marker = null;
    }
    this.markerPosition.set(null);
  }

  private destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
    }
    this.markerPosition.set(null);
  }

  ngOnDestroy(): void {
    this.destroyMap();
  }
}
