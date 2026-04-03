/**
 * Custom Google Maps style for GO SHATS.
 * Clean, modern aesthetic — slightly muted so brand-green markers pop,
 * but with enough contrast to clearly show roads, buildings, and landmarks.
 */
export const MAP_STYLE = [
  // Slightly desaturate overall
  {
    elementType: "geometry",
    stylers: [{ saturation: -10 }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#4B5563" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#FFFFFF" }, { weight: 2 }],
  },

  // Water — soft blue
  {
    featureType: "water",
    elementType: "geometry.fill",
    stylers: [{ color: "#BFD9F0" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#7BA8CF" }],
  },

  // Landscape — warm light gray (not washed-out white)
  {
    featureType: "landscape.natural",
    elementType: "geometry.fill",
    stylers: [{ color: "#EEF0F2" }],
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry.fill",
    stylers: [{ color: "#E8EAED" }],
  },

  // Roads — visible with good contrast
  {
    featureType: "road.highway",
    elementType: "geometry.fill",
    stylers: [{ color: "#FAFAFA" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#C8CDD3" }, { weight: 1.5 }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry.fill",
    stylers: [{ color: "#FFFFFF" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry.stroke",
    stylers: [{ color: "#D6DAE0" }, { weight: 1 }],
  },
  {
    featureType: "road.local",
    elementType: "geometry.fill",
    stylers: [{ color: "#FFFFFF" }],
  },
  {
    featureType: "road.local",
    elementType: "geometry.stroke",
    stylers: [{ color: "#E0E3E8" }, { weight: 0.8 }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6B7280" }],
  },

  // Parks — subtle green tint
  {
    featureType: "poi.park",
    elementType: "geometry.fill",
    stylers: [{ color: "#D5EDDC" }],
  },

  // Hide POI labels (restaurants, shops) — keep map clean for riders
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  // But keep POI geometry visible (buildings, parks show as shapes)
  {
    featureType: "poi.business",
    elementType: "geometry",
    stylers: [{ color: "#E8EAED" }],
  },

  // Transit — hide labels only, keep lines visible
  {
    featureType: "transit",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit.line",
    elementType: "geometry",
    stylers: [{ color: "#D6DAE0" }],
  },

  // Admin boundaries
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#C8CDD3" }, { weight: 0.8 }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#374151" }],
  },
  {
    featureType: "administrative.neighborhood",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6B7280" }],
  },
];
