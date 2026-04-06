import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DashboardScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }} edges={["top"]}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
        <Text style={{ fontFamily: "PolySans-Bulky", fontSize: 18, color: "#111827", textAlign: "center", marginBottom: 8 }}>
          Rider Dashboard
        </Text>
        <Text style={{ fontFamily: "PolySans-Neutral", fontSize: 14, color: "#6B7280", textAlign: "center" }}>
          The rider dashboard with live map is only available on the mobile app.
        </Text>
      </View>
    </SafeAreaView>
  );
}
