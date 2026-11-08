import { Component, effect, ElementRef, input, OnDestroy, viewChild } from '@angular/core';
import * as L from 'leaflet';
import { environment } from '../../../environments/environment';

const MAP_CENTER: L.LatLngTuple = [environment.mapCenterLat, environment.mapCenterLng];
const DEFAULT_ZOOM = environment.mapZoom;

@Component({
  selector: 'app-map-view',
  template: `
    <div
      #mapContainer
      class="rounded-xl border border-surface-pressed"
      style="height: 200px; width: 100%;"
    ></div>
  `,
  styles: `
    :host {
      display: block;
      isolation: isolate;
    }
  `,
})
export class MapViewComponent implements OnDestroy {
  readonly latitude = input<number | null>(null);
  readonly longitude = input<number | null>(null);

  readonly mapContainer = viewChild.required<ElementRef>('mapContainer');

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;

  constructor() {
    effect(() => {
      const lat = this.latitude();
      const lng = this.longitude();
      const container = this.mapContainer();

      if (!this.map && container) {
        this.initMap(container.nativeElement);
      }

      if (this.map && lat !== null && lng !== null) {
        this.updateMarker(lat, lng);
      }
    });
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
  }

  private initMap(container: HTMLElement): void {
    this.map = L.map(container, {
      center: MAP_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer(environment.mapTileUrl, {
      maxZoom: 19,
    }).addTo(this.map);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
  }

  private updateMarker(lat: number, lng: number): void {
    if (!this.map) return;

    const position: L.LatLngTuple = [lat, lng];

    if (this.marker) {
      this.marker.setLatLng(position);
    } else {
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          width: 24px;
          height: 24px;
          background-color: #1C8057;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      this.marker = L.marker(position, { icon }).addTo(this.map);
    }

    this.map.setView(position, DEFAULT_ZOOM);
  }
}
