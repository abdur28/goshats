import {
  RiderBottomSheetContent,
  type DashboardMode,
} from "@/components/dashboard/RiderBottomSheetContent";
import RoutePolyline from "@/components/map/RoutePolyline";
import UserLocationMarker from "@/components/map/UserLocationMarker";
import { COLORS } from "@/constants/theme";
import { useIncomingRequests } from "@/hooks/use-incoming-requests";
import { useLocation } from "@/hooks/use-location";
import { useLocationBroadcast } from "@/hooks/use-location-broadcast";
import { useNotifications } from "@/hooks/use-notifications";
import { useAuthStore } from "@/store/auth-store";
import { useDeliveryStore } from "@/store/delivery-store";
import BottomSheet from "@gorhom/bottom-sheet";
import {
  acceptOrder,
  updateConditionAtPickup,
  updateOrderStatus,
} from "@goshats/firebase/src/firestore/orders";
import { updateAvailability } from "@goshats/firebase/src/firestore/riders";
import type { ConditionAtPickup, Order, OrderStatus } from "@goshats/types";
import { Avatar } from "@goshats/ui";
import { router } from "expo-router";
import { Gps, Notification } from "iconsax-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LAGOS_REGION = {
  latitude: 6.5244,
  longitude: 3.3792,
  latitudeDelta: 0.05,
  longitudeDelta: 0.02,
};

type RoutePoints = {
  pickup: { latitude: number; longitude: number };
  dropoff: { latitude: number; longitude: number };
} | null;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user, riderProfile, setRiderProfile } = useAuthStore();
  const { activeOrder, clearDelivery } = useDeliveryStore();
  const { unreadCount } = useNotifications();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<MapView>(null);
  const snapPoints = useMemo(
    () => [Platform.OS === "ios" ? "25%" : "30%", "60%", "89%"],
    [],
  );

  const [showRecenter, setShowRecenter] = useState(false);
  const [isOnline, setIsOnline] = useState(!!riderProfile?.isOnline);

  // Keep the local toggle in sync with Firestore changes (mirror CF flips,
  // CF-driven isAvailable updates, admin actions, etc.) so the UI never lies.
  useEffect(() => {
    setIsOnline(!!riderProfile?.isOnline);
  }, [riderProfile?.isOnline]);
  const [selectedRoute, setSelectedRoute] = useState<RoutePoints>(null);
  const [deliveryComplete, setDeliveryComplete] = useState(false);
  const hasAnimatedRef = useRef(false);
  const prevRequestCount = useRef(0);
  const prevActiveOrderRef = useRef<Order | null>(null);

  const { location } = useLocation();
  const { isBroadcasting, start, stop } = useLocationBroadcast();
  const { requests, dismissRequest } = useIncomingRequests(isOnline);

  // Derive dashboard mode
  const mode: DashboardMode = deliveryComplete
    ? "complete"
    : activeOrder
      ? "delivery"
      : requests.length > 0
        ? "requests"
        : isOnline
          ? "online"
          : "offline";

  // Compute map route based on delivery state
  const deliveryRoute: RoutePoints = useMemo(() => {
    if (!activeOrder) return null;
    const pickup = activeOrder.pickup?.location;
    const dropoff = activeOrder.dropoff?.location;
    if (!pickup || !dropoff) return null;

    const status = activeOrder.status;
    if (status === "accepted" || status === "arrived_pickup") {
      // Route: rider's current location → pickup
      if (!location) return null;
      return { pickup: location, dropoff: pickup };
    }
    if (status === "picked_up" || status === "in_transit") {
      // Route: pickup → dropoff
      return { pickup, dropoff };
    }
    return null;
  }, [activeOrder, location]);

  // The route to show on map: delivery route takes priority over preview
  const mapRoute = deliveryRoute ?? selectedRoute;

  // Animate map to user location on first fix
  if (location && !hasAnimatedRef.current && mapRef.current) {
    hasAnimatedRef.current = true;
    mapRef.current.animateToRegion(
      {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.008,
      },
      800,
    );
  }

  // Auto-expand bottom sheet when new requests arrive
  useEffect(() => {
    if (requests.length > prevRequestCount.current) {
      bottomSheetRef.current?.snapToIndex(1);
    }
    prevRequestCount.current = requests.length;
  }, [requests.length]);

  // Fit map to delivery route when it changes
  useEffect(() => {
    if (!deliveryRoute || !mapRef.current) return;
    mapRef.current.fitToCoordinates(
      [
        {
          latitude: deliveryRoute.pickup.latitude,
          longitude: deliveryRoute.pickup.longitude,
        },
        {
          latitude: deliveryRoute.dropoff.latitude,
          longitude: deliveryRoute.dropoff.longitude,
        },
      ],
      {
        edgePadding: { top: 120, right: 50, bottom: 280, left: 50 },
        animated: true,
      },
    );
  }, [activeOrder?.status]);

  // Detect delivery completion: activeOrder goes non-null → null
  useEffect(() => {
    if (activeOrder) {
      prevActiveOrderRef.current = activeOrder;
      setDeliveryComplete(false);
    } else if (prevActiveOrderRef.current) {
      setDeliveryComplete(true);
    }
  }, [activeOrder]);

  // ── Handlers ──

  const handleToggleOnline = async (value: boolean) => {
    setIsOnline(value);
    if (!value) setSelectedRoute(null);
    if (riderProfile) {
      setRiderProfile({ ...riderProfile, isOnline: value, isAvailable: value });
    }
    if (!user?.uid) return;
    try {
      if (value) {
        start();
        await updateAvailability(user.uid, true, true);
      } else {
        stop();
        await updateAvailability(user.uid, false, false);
      }
    } catch {
      // silent
    }
  };

  useEffect(() => {
    // Broadcast location whenever rider is online OR has an active delivery
    // (delivery covers the cold-launch-after-force-quit case where the local
    // toggle is stale-false but the customer's tracking map needs live updates).
    const shouldBroadcast = isOnline || !!activeOrder;
    if (shouldBroadcast && !isBroadcasting) start();
    else if (!shouldBroadcast && isBroadcasting) stop();
  }, [isOnline, activeOrder, isBroadcasting, start, stop]);

  const handleRegionChange = useCallback(
    (region: { latitude: number; longitude: number }) => {
      if (!location) return;
      const drift =
        Math.abs(region.latitude - location.latitude) +
        Math.abs(region.longitude - location.longitude);
      setShowRecenter(drift > 0.003);
    },
    [location],
  );

  const handleRecenter = useCallback(() => {
    if (!location || !mapRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.008,
      },
      600,
    );
    setShowRecenter(false);
  }, [location]);

  const handleRequestPress = useCallback((order: Order) => {
    if (!order.pickup?.location || !order.dropoff?.location) return;
    setSelectedRoute({
      pickup: order.pickup.location,
      dropoff: order.dropoff.location,
    });
    bottomSheetRef.current?.snapToIndex(0);
    mapRef.current?.fitToCoordinates(
      [
        {
          latitude: order.pickup.location.latitude,
          longitude: order.pickup.location.longitude,
        },
        {
          latitude: order.dropoff.location.latitude,
          longitude: order.dropoff.location.longitude,
        },
      ],
      {
        edgePadding: { top: 120, right: 50, bottom: 280, left: 50 },
        animated: true,
      },
    );
  }, []);

  const handleAccept = useCallback(
    async (id: string) => {
      if (!user?.uid) return;
      try {
        await acceptOrder(id, user.uid);
        dismissRequest(id);
        setSelectedRoute(null);
        bottomSheetRef.current?.snapToIndex(1);
      } catch {
        // silent
      }
    },
    [user?.uid, dismissRequest],
  );

  const handleStatusUpdate = useCallback(
    async (nextStatus: OrderStatus) => {
      if (!activeOrder) return;
      try {
        await updateOrderStatus(activeOrder.id, nextStatus);
      } catch {
        // silent
      }
    },
    [activeOrder],
  );

  const handleConditionConfirm = useCallback(
    async (condition: ConditionAtPickup) => {
      if (!activeOrder) return;
      try {
        await updateConditionAtPickup(activeOrder.id, condition);
        await updateOrderStatus(activeOrder.id, "picked_up");
      } catch {
        // silent
      }
    },
    [activeOrder],
  );

  const handleDeliveryDone = useCallback(() => {
    setDeliveryComplete(false);
    prevActiveOrderRef.current = null;
    clearDelivery();
    setSelectedRoute(null);
  }, [clearDelivery]);

  return (
    <View style={{ flex: 1 }}>
      {/* Full-screen Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        initialRegion={
          location
            ? {
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.015,
                longitudeDelta: 0.008,
              }
            : LAGOS_REGION
        }
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsPointsOfInterests={false}
        mapPadding={{ top: 140, bottom: 240, left: 0, right: 0 }}
        onPress={() => bottomSheetRef.current?.snapToIndex(0)}
        onPanDrag={() => bottomSheetRef.current?.snapToIndex(0)}
        onRegionChangeComplete={handleRegionChange}
      >
        {location && !deliveryRoute && (
          <UserLocationMarker
            latitude={location.latitude}
            longitude={location.longitude}
          />
        )}
        {mapRoute && (
          <RoutePolyline
            pickup={mapRoute.pickup}
            dropoff={mapRoute.dropoff}
            showInfoChip
          />
        )}
      </MapView>

      {/* Recenter button */}
      {showRecenter && location && (
        <Pressable
          onPress={handleRecenter}
          style={{
            position: "absolute",
            right: 20,
            bottom: Platform.OS === "ios" ? 240 : 280,
            zIndex: 20,
            backgroundColor: "#fff",
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "#F3F4F6",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          <Gps size={22} color={COLORS.primary} variant="Bold" />
        </Pressable>
      )}

      {/* Header */}
      <View
        className="bg-white rounded-b-[32px] z-10 w-full absolute top-0"
        style={{
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: 24,
          paddingHorizontal: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 2,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <Avatar
              uri={riderProfile?.profilePhotoUrl as string | undefined}
              name={
                riderProfile?.otherName + " " + riderProfile?.surname || "Rider"
              }
              size="md"
            />
            <View>
              <Text className="text-xs font-sans text-gray-500 tracking-widest mb-0.5">
                {getGreeting()}
              </Text>
              <Text className="text-lg font-sans-bold text-gray-900 leading-tight">
                {riderProfile?.otherName + " " + riderProfile?.surname ||
                  "Rider"}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => router.push("/notifications" as any)}
              style={{
                backgroundColor: "#F9FAFB",
                padding: 12,
                borderRadius: 9999,
                borderWidth: 1,
                borderColor: "#F3F4F6",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              {unreadCount > 0 && (
                <View className="absolute top-3 right-3.5 w-2 h-2 rounded-full bg-red-500 z-10 border border-white" />
              )}
              <Notification size={20} color={COLORS.primary} variant="Bold" />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        enablePanDownToClose={false}
        handleIndicatorStyle={{
          backgroundColor: "#D1D5DB",
          width: 40,
          height: 4,
        }}
        containerStyle={{ zIndex: 99, elevation: 99 }}
        backgroundStyle={{
          borderRadius: 32,
          backgroundColor: "#F9FAFB",
          borderWidth: 1,
          borderColor: "#F3F4F6",
        }}
      >
        <RiderBottomSheetContent
          mode={mode}
          isOnline={isOnline}
          onToggle={handleToggleOnline}
          requests={requests}
          onAccept={handleAccept}
          onReject={(id) => {
            dismissRequest(id);
            setSelectedRoute(null);
          }}
          onRequestPress={handleRequestPress}
          activeOrder={activeOrder}
          onStatusUpdate={handleStatusUpdate}
          onConditionConfirm={handleConditionConfirm}
          onChat={() => {
            if (activeOrder)
              router.push(`/chat?orderId=${activeOrder.id}` as any);
          }}
          onDeliveryDone={handleDeliveryDone}
          completedEarningsKobo={
            prevActiveOrderRef.current
              ? (prevActiveOrderRef.current.fareAmountKobo ?? 0) +
                (prevActiveOrderRef.current.tipAmountKobo ?? 0)
              : 0
          }
        />
      </BottomSheet>
    </View>
  );
}
