import { COLORS } from "@/constants/theme";
import { Tabs } from "expo-router";
import { Home, Profile, Receipt21, Wallet } from "iconsax-react-native";
import { useEffect } from "react";
import { BackHandler, Platform, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_CONFIG = [
  { name: "dashboard", Icon: Home },
  { name: "orders", Icon: Receipt21 },
  { name: "earnings", Icon: Wallet },
  { name: "profile", Icon: Profile },
] as const;

const CIRCLE = 70;
const GAP = 0;
const BG_CIRCLE = 75;
const TRACK_HEIGHT = CIRCLE * 0.65;
const TRACK_HPAD = CIRCLE * 0.15;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const handler = BackHandler.addEventListener("hardwareBackPress", () => {
      return true;
    });
    return () => handler.remove();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={({ state, navigation }) => {
        return (
          <View
            pointerEvents="box-none"
            style={{
              position: "absolute",
              bottom: Math.max(
                insets.bottom,
                Platform.OS === "android" ? 60 : 12,
              ),
              left: 0,
              right: 0,
              alignItems: "center",
            }}
          >
            <View style={{ position: "relative" }}>
              {/* Pill track behind everything */}
              <View
                style={{
                  position: "absolute",
                  top: (BG_CIRCLE - TRACK_HEIGHT) / 2,
                  left: -TRACK_HPAD,
                  right: -TRACK_HPAD,
                  height: TRACK_HEIGHT,
                  borderRadius: TRACK_HEIGHT / 2,
                  backgroundColor: "#E0E0E0",
                  zIndex: 0,
                }}
              />
              {/* Circles row */}
              <View style={{ flexDirection: "row", gap: GAP, zIndex: 1 }}>
                {state.routes.map((route, index) => {
                  const isFocused = state.index === index;
                  const configItem = TAB_CONFIG.find(
                    (t) => t.name === route.name,
                  );

                  if (!configItem) return null;
                  const TabIcon = configItem.Icon;

                  const onPress = () => {
                    const event = navigation.emit({
                      type: "tabPress",
                      target: route.key,
                      canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                      navigation.navigate(route.name);
                    }
                  };

                  return (
                    <Pressable
                      key={route.key}
                      onPress={onPress}
                      style={{
                        width: BG_CIRCLE,
                        height: BG_CIRCLE,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {/* Background circle */}
                      <View
                        style={{
                          position: "absolute",
                          width: BG_CIRCLE,
                          height: BG_CIRCLE,
                          borderRadius: BG_CIRCLE / 2,
                          backgroundColor: "#E0E0E0",
                        }}
                      />
                      {/* Foreground circle */}
                      <View
                        style={{
                          width: CIRCLE,
                          height: CIRCLE,
                          borderRadius: CIRCLE / 2,
                          backgroundColor: isFocused
                            ? COLORS.primary
                            : "#F5F5F5",
                          borderWidth: 2,
                          borderColor: isFocused ? COLORS.primary : "#DCDCDC",
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 1,
                        }}
                      >
                        <TabIcon
                          size={26}
                          color={isFocused ? "#FFFFFF" : "#777777"}
                          variant={isFocused ? "Bold" : "Linear"}
                        />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        );
      }}
    >
      {TAB_CONFIG.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} />
      ))}
    </Tabs>
  );
}
