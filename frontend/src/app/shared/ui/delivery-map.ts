import {
  Component,
  effect,
  ElementRef,
  input,
  OnDestroy,
  viewChild,
} from '@angular/core';
import * as L from 'leaflet';
import { environment } from '../../../environments/environment';

const FALLBACK_CENTER: L.LatLngTuple = [environment.mapCenterLat, environment.mapCenterLng];
const DEFAULT_ZOOM = environment.mapZoom;

@Component({
  selector: 'app-delivery-map',
  template: `
    <div class="map-shell">
      <div
        #mapContainer
        class="rounded-xl border border-surface-pressed"
        style="height: 260px; width: 100%;"
        data-testid="delivery-map"
      ></div>
      @if (!hasDestination()) {
        <div class="map-empty" data-testid="delivery-map-empty">
          La dirección del pedido no tiene coordenadas.
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .map-shell {
      position: relative;
      z-index: 0;
      isolation: isolate;
    }

    .map-empty {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 16px;
      border-radius: 12px;
      background-color: rgba(255, 255, 255, 0.85);
      font-size: 13px;
      color: var(--color-body);
    }
  `,
})
export class DeliveryMapComponent implements OnDestroy {
  readonly destLat = input<number | null>(null);
  readonly destLng = input<number | null>(null);
  readonly deliveryLat = input<number | null>(null);
  readonly deliveryLng = input<number | null>(null);
  readonly showRoute = input(true);

  readonly mapContainer = viewChild.required<ElementRef>('mapContainer');

  private map: L.Map | null = null;
  private destMarker: L.Marker | null = null;
  private deliveryMarker: L.Marker | null = null;
  private routeLine: L.Polyline | null = null;
  private lastRouteKey = '';
  private lastRouteAt = 0;

  constructor() {
    effect(() => {
      const container = this.mapContainer();
      const dLat = this.destLat();
      const dLng = this.destLng();
      const vLat = this.deliveryLat();
      const vLng = this.deliveryLng();

      if (!this.map && container) {
        this.initMap(container.nativeElement);
      }
      if (!this.map) return;

      if (dLat !== null && dLng !== null) {
        this.updateDestMarker(dLat, dLng);
      }
      if (vLat !== null && vLng !== null) {
        this.updateDeliveryMarker(vLat, vLng);
      }
      this.fitBounds();
      this.maybeDrawRoute();
    });
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
  }

  protected hasDestination(): boolean {
    return this.destLat() !== null && this.destLng() !== null;
  }

  private initMap(container: HTMLElement): void {
    this.map = L.map(container, {
      center: FALLBACK_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer(environment.mapTileUrl, {
      maxZoom: 19,
    }).addTo(this.map);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
  }

  private updateDestMarker(lat: number, lng: number): void {
    if (!this.map) return;
    const icon = L.divIcon({
      className: 'dest-marker',
      html: `<div style="width:26px;height:26px;background:#000;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 26],
    });
    if (this.destMarker) {
      this.destMarker.setLatLng([lat, lng]);
    } else {
      this.destMarker = L.marker([lat, lng], { icon }).addTo(this.map);
    }
  }

  private updateDeliveryMarker(lat: number, lng: number): void {
    if (!this.map) return;
    const icon = L.divIcon({
      className: 'delivery-marker',
      html: `<div style="width:24px;height:24px;background:#1C8057;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
    if (this.deliveryMarker) {
      this.deliveryMarker.setLatLng([lat, lng]);
    } else {
      this.deliveryMarker = L.marker([lat, lng], { icon }).addTo(this.map);
    }
  }

  private fitBounds(): void {
    if (!this.map) return;
    const points: L.LatLngTuple[] = [];
    const dLat = this.destLat();
    const dLng = this.destLng();
    const vLat = this.deliveryLat();
    const vLng = this.deliveryLng();
    if (dLat !== null && dLng !== null) points.push([dLat, dLng]);
    if (vLat !== null && vLng !== null) points.push([vLat, vLng]);
    if (points.length === 2) {
      this.map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
    } else if (points.length === 1) {
      this.map.setView(points[0], DEFAULT_ZOOM);
    }
  }

  private maybeDrawRoute(): void {
    if (!this.map || !this.showRoute()) return;
    const dLat = this.destLat();
    const dLng = this.destLng();
    const vLat = this.deliveryLat();
    const vLng = this.deliveryLng();
    if (dLat === null || dLng === null || vLat === null || vLng === null) return;

    const key = `${vLat.toFixed(4)},${vLng.toFixed(4)}->${dLat.toFixed(4)},${dLng.toFixed(4)}`;
    const now = Date.now();
    if (key === this.lastRouteKey || now - this.lastRouteAt < 4000) return;
    this.lastRouteKey = key;
    this.lastRouteAt = now;

    this.fetchRoute(vLat, vLng, dLat, dLng)
      .then((coords) => this.drawRoute(coords))
      .catch(() => this.drawRoute([[vLat, vLng], [dLat, dLng]]));
  }

  private async fetchRoute(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number,
  ): Promise<L.LatLngTuple[]> {
    const base = (environment.osrmUrl || '').replace(/\/+$/, '');
    const url = `${base}/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('osrm');
    const data = (await res.json()) as {
      routes?: { geometry?: { coordinates?: [number, number][] } }[];
    };
    const coords = data.routes?.[0]?.geometry?.coordinates;
    if (!coords || coords.length === 0) throw new Error('osrm-empty');
    return coords.map(([lng, lat]) => [lat, lng] as L.LatLngTuple);
  }

  private drawRoute(coords: L.LatLngTuple[]): void {
    if (!this.map) return;
    if (this.routeLine) {
      this.routeLine.setLatLngs(coords);
    } else {
      this.routeLine = L.polyline(coords, {
        color: '#1C8057',
        weight: 4,
        opacity: 0.8,
      }).addTo(this.map);
    }
  }
}
