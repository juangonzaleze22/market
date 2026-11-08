export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface GeoZone {
  polygon?: GeoPoint[] | null;
  centerLat?: number | string | null;
  centerLng?: number | string | null;
  radiusKm?: number | string | null;
}

export function pointInPolygon(point: GeoPoint, polygon: GeoPoint[]): boolean {
  if (!Array.isArray(polygon) || polygon.length < 3) return false;

  const x = point.lng;
  const y = point.lat;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = Number(polygon[i].lng);
    const yi = Number(polygon[i].lat);
    const xj = Number(polygon[j].lng);
    const yj = Number(polygon[j].lat);

    const intersects =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi || Number.EPSILON) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
}

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRadians(Number(b.lat) - Number(a.lat));
  const dLng = toRadians(Number(b.lng) - Number(a.lng));
  const lat1 = toRadians(Number(a.lat));
  const lat2 = toRadians(Number(b.lat));

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

export function pointInZone(point: GeoPoint, zone: GeoZone): boolean {
  if (zone.polygon && zone.polygon.length >= 3) {
    return pointInPolygon(point, zone.polygon);
  }

  if (
    zone.centerLat != null &&
    zone.centerLng != null &&
    zone.radiusKm != null &&
    Number(zone.radiusKm) > 0
  ) {
    return (
      haversineKm(point, {
        lat: Number(zone.centerLat),
        lng: Number(zone.centerLng),
      }) <= Number(zone.radiusKm)
    );
  }

  return false;
}

export function isInsideAnyZone(point: GeoPoint, zones: GeoZone[]): boolean {
  return zones.some((zone) => pointInZone(point, zone));
}
