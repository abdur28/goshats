import {
  geohashForLocation,
  geohashQueryBounds,
  distanceBetween,
} from "geofire-common";

export function encodeGeohash(
  latitude: number,
  longitude: number,
  precision: number = 10
): string {
  return geohashForLocation([latitude, longitude], precision);
}

export function getGeohashQueryBounds(
  center: { latitude: number; longitude: number },
  radiusKm: number
): [string, string][] {
  return geohashQueryBounds(
    [center.latitude, center.longitude],
    radiusKm * 1000
  );
}

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  return distanceBetween([lat1, lng1], [lat2, lng2]);
}
