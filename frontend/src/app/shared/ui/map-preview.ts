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

const DEFAULT_ZOOM = environment.mapZoom;

@Component({
  selector: 'app-map-preview',
  template: `
    @if (hasCoords()) {
      <div
        #mapContainer
        class="map-preview"
        data-testid="delivery-map-preview"
      ></div>
    } @else {
      <div class="map-preview map-preview--empty" data-testid="delivery-map-preview-empty">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <span>Sin mapa</span>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
      isolation: isolate;
    }

    .map-preview {
      width: 100%;
      height: 100%;
      min-height: 112px;
      background-color: var(--color-canvas-soft);
    }

    .map-preview--empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      color: var(--color-mute);
      font-size: 11px;
    }
  `,
})
export class MapPreviewComponent implements OnDestroy {
  readonly latitude = input<number | null>(null);
  readonly longitude = input<number | null>(null);

  readonly mapContainer = viewChild<ElementRef<HTMLElement>>('mapContainer');

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;

  constructor() {
    effect(() => {
      const container = this.mapContainer()?.nativeElement;
      const lat = this.latitude();
      const lng = this.longitude();

      if (!container || lat === null || lng === null) return;
      if (!this.map) {
        this.initMap(container, lat, lng);
      } else {
        this.setPosition(lat, lng);
      }
    });
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
  }

  protected hasCoords(): boolean {
    return this.latitude() !== null && this.longitude() !== null;
  }

  private initMap(container: HTMLElement, lat: number, lng: number): void {
    this.map = L.map(container, {
      center: [lat, lng],
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
    });

    L.tileLayer(environment.mapTileUrl, {
      maxZoom: 19,
    }).addTo(this.map);

    this.addMarker(lat, lng);
    setTimeout(() => this.map?.invalidateSize(), 200);
  }

  private setPosition(lat: number, lng: number): void {
    if (!this.map) return;
    this.map.setView([lat, lng], DEFAULT_ZOOM, { animate: false });
    this.addMarker(lat, lng);
  }

  private addMarker(lat: number, lng: number): void {
    if (!this.map) return;
    const icon = L.divIcon({
      className: 'preview-marker',
      html: `<div style="width:18px;height:18px;background:#1C8057;border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 5px rgba(0,0,0,0.35);"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 18],
    });
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng], { icon }).addTo(this.map);
    }
  }
}
