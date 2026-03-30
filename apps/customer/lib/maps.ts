const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface DirectionsResult {
  distanceMeters: number;
  durationSeconds: number;
  polyline: string;
}

export async function getPlaceSuggestions(
  input: string,
  location?: { latitude: number; longitude: number },
): Promise<PlaceSuggestion[]> {
  if (!input || input.length < 2) return [];

  const params = new URLSearchParams({
    input,
    key: GOOGLE_MAPS_API_KEY ?? "",
    components: "country:ng",
  });

  if (location) {
    params.set("location", `${location.latitude},${location.longitude}`);
    params.set("radius", "50000");
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`,
  );
  const data = await response.json();

  if (data.status !== "OK") return [];

  return data.predictions.map((p: any) => ({
    placeId: p.place_id,
    description: p.description,
    mainText: p.structured_formatting.main_text,
    secondaryText: p.structured_formatting.secondary_text,
  }));
}

export async function getPlaceDetails(
  placeId: string,
): Promise<PlaceDetails | null> {
  const params = new URLSearchParams({
    place_id: placeId,
    fields: "place_id,name,formatted_address,geometry",
    key: GOOGLE_MAPS_API_KEY ?? "",
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?${params}`,
  );
  const data = await response.json();

  if (data.status !== "OK" || !data.result) return null;

  return {
    placeId: data.result.place_id,
    name: data.result.name,
    address: data.result.formatted_address,
    latitude: data.result.geometry.location.lat,
    longitude: data.result.geometry.location.lng,
  };
}

export async function getDirections(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  waypoints?: { latitude: number; longitude: number }[],
): Promise<DirectionsResult | null> {
  const params = new URLSearchParams({
    origin: `${origin.latitude},${origin.longitude}`,
    destination: `${destination.latitude},${destination.longitude}`,
    key: GOOGLE_MAPS_API_KEY ?? "",
    mode: "driving",
  });

  if (waypoints && waypoints.length > 0) {
    params.set(
      "waypoints",
      `optimize:true|${waypoints.map((w) => `${w.latitude},${w.longitude}`).join("|")}`,
    );
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/directions/json?${params}`,
  );
  const data = await response.json();

  if (data.status !== "OK" || !data.routes?.length) return null;

  const route = data.routes[0];
  const leg = route.legs[0];

  return {
    distanceMeters: leg.distance.value,
    durationSeconds: leg.duration.value,
    polyline: route.overview_polyline.points,
  };
}

export async function calculateRouteDistance(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
): Promise<{ distanceMeters: number; durationSeconds: number } | null> {
  const result = await getDirections(origin, destination);
  if (!result) return null;
  return {
    distanceMeters: result.distanceMeters,
    durationSeconds: result.durationSeconds,
  };
}

/**
 * Decode a Google Encoded Polyline string into an array of coordinates.
 * Standard algorithm: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
export function decodePolyline(
  encoded: string,
): { latitude: number; longitude: number }[] {
  const points: { latitude: number; longitude: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return points;
}

/**
 * Get directions and return decoded coordinates alongside the raw result.
 */
export async function getDirectionsWithCoordinates(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  waypoints?: { latitude: number; longitude: number }[],
): Promise<{
  distanceMeters: number;
  durationSeconds: number;
  coordinates: { latitude: number; longitude: number }[];
} | null> {
  const result = await getDirections(origin, destination, waypoints);
  if (!result) return null;

  return {
    distanceMeters: result.distanceMeters,
    durationSeconds: result.durationSeconds,
    coordinates: decodePolyline(result.polyline),
  };
}
