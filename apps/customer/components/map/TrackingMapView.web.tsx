import { Text, View } from "react-native";

interface TrackingMapViewProps {
  orderId: string | null;
  destination: { latitude: number; longitude: number };
  pickup?: { latitude: number; longitude: number };
  riderLocation?: { latitude: number; longitude: number };
  status?: string;
}

export default function TrackingMapView(_props: TrackingMapViewProps) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#E5E7EB",
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontFamily: "PolySans-Neutral", fontSize: 14, color: "#6B7280" }}>
        Map not available on web
      </Text>
    </View>
  );
}
