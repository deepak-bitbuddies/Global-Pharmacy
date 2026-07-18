const EARTH_RADIUS_METERS = 6_371_000

export interface GeoPoint {
  lat: number
  lng: number
}

export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/** Haversine great-circle distance between two points, in meters. */
export function distanceInMeters(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRadians(b.lat - a.lat)
  const dLng = toRadians(b.lng - a.lng)
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h))
}

export function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
}

export interface GeoJsonPoint {
  type: "Point"
  coordinates: [number, number]
}

/** MongoDB/GeoJSON expects [lng, lat] order — reversed from the usual lat/lng. */
export function toGeoJsonPoint(lat: number, lng: number): GeoJsonPoint {
  return {
    type: "Point",
    coordinates: [lng, lat],
  }
}
