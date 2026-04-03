import type { Order } from "@goshats/types";
import { TruckFast } from "iconsax-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

const STATUS_STEP: Record<string, number> = {
  pending: 0,
  accepted: 1,
  arrived_pickup: 1,
  picked_up: 2,
  in_transit: 2,
  delivered: 3,
  cancelled: 0,
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Waiting for Rider",
  accepted: "Rider En Route",
  arrived_pickup: "Now Arriving",
  picked_up: "Picked Up",
  in_transit: "Now Arriving",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function formatEta(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 1) return "< 1 min";
  return `ETA ${mins} min`;
}

interface TrackingTimelineCardProps {
  order: Order;
  onPress?: () => void;
}

export const TrackingTimelineCard = ({
  order,
  onPress,
}: TrackingTimelineCardProps) => {
  const step = STATUS_STEP[order.status] ?? 0;
  const progressPct = (step / 3) * 100;
  const statusLabel = STATUS_LABELS[order.status] ?? "Active";
  const etaLabel = order.estimatedDurationSeconds
    ? formatEta(order.estimatedDurationSeconds)
    : undefined;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.statusLabel}>{statusLabel}</Text>
          <Text style={styles.addressText} numberOfLines={1}>
            {order.dropoff?.address}
          </Text>
        </View>
        {etaLabel && (
          <View style={styles.etaBadge}>
            <Text style={styles.etaText}>{etaLabel}</Text>
          </View>
        )}
      </View>

      {/* Timeline graphic container */}
      <View style={styles.timelineContainer}>
        <View style={styles.relativeWrap}>
          {/* Line Background */}
          <View style={styles.lineBackground} />
          <View
            style={[
              styles.lineProgress,
              { width: `${progressPct * 0.9}%` as any },
            ]}
          />

          <View style={styles.stepsRow}>
            {(["Booked", "Pickup", "Transit", "Dropoff"] as const).map(
              (label, idx) => {
                const done = idx < step;
                const isCurrent = idx === step;
                return (
                  <View key={label} style={styles.stepItem}>
                    {isCurrent ? (
                      <View style={styles.currentDot}>
                        <TruckFast size={18} color="#FFF" variant="Bold" />
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.dot,
                          done ? styles.dotDone : styles.dotFuture,
                        ]}
                      />
                    )}
                    <Text
                      style={[
                        styles.stepLabel,
                        isCurrent || done
                          ? styles.stepLabelActive
                          : styles.stepLabelInactive,
                      ]}
                    >
                      {label}
                    </Text>
                  </View>
                );
              },
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(218,165,32,0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  headerLeft: {
    width: "70%",
  },
  statusLabel: {
    fontSize: 10,
    fontFamily: "PolySans-Bulky",
    color: "#DAA520",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 4,
    marginTop: 4,
  },
  addressText: {
    fontSize: 15,
    fontFamily: "PolySans-Bulky",
    color: "#111827",
    lineHeight: 20,
  },
  etaBadge: {
    backgroundColor: "rgba(218,165,32,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  etaText: {
    fontSize: 10,
    fontFamily: "PolySans-Bulky",
    letterSpacing: 1.5,
    color: "#DAA520",
    textTransform: "uppercase",
  },
  timelineContainer: {
    paddingHorizontal: 4,
    marginTop: 8,
  },
  relativeWrap: {
    position: "relative",
  },
  lineBackground: {
    position: "absolute",
    left: "5%",
    right: "5%",
    height: 3,
    backgroundColor: "#F3F4F6",
    top: 14,
    borderRadius: 4,
  },
  lineProgress: {
    position: "absolute",
    left: "5%",
    height: 3,
    backgroundColor: "#DAA520",
    top: 14,
    borderRadius: 4,
  },
  stepsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stepItem: {
    alignItems: "center",
    width: 56,
    zIndex: 10,
  },
  currentDot: {
    width: 40,
    height: 40,
    backgroundColor: "#DAA520",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    marginBottom: 8,
    marginTop: 8,
  },
  dotDone: {
    backgroundColor: "#DAA520",
  },
  dotFuture: {
    backgroundColor: "#E5E7EB",
  },
  stepLabel: {
    fontSize: 8,
    fontFamily: "PolySans-Bulky",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  stepLabelActive: {
    color: "#DAA520",
  },
  stepLabelInactive: {
    color: "#9CA3AF",
  },
});
