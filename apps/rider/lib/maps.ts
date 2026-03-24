const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export interface DirectionsResult {
  distanceMeters: number;
  durationSeconds: number;
  polyline: string;
}

export async function getDirections(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  waypoints?: { latitude: number; longitude: number }[]
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
      `optimize:true|${waypoints.map((w) => `${w.latitude},${w.longitude}`).join("|")}`
    );
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/directions/json?${params}`
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
