import { COLORS } from "@/constants/theme";
import { usePathname } from "expo-router";
import { TabList, TabSlot, TabTrigger, Tabs } from "expo-router/ui";
import type { IconProps } from "iconsax-react-native";
import { Home, Profile, Receipt21, Routing2 } from "iconsax-react-native";
import type { FC } from "react";
import { useEffect } from "react";
import { BackHandler, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_CONFIG = [
  { name: "index", href: "/", Icon: Home },
  { name: "orders", href: "/orders", Icon: Receipt21 },
  { name: "activity", href: "/activity", Icon: Routing2 },
  { name: "profile", href: "/profile", Icon: Profile },
] satisfies { name: string; href: string; Icon: FC<IconProps> }[];

const CIRCLE = 70;
const GAP = 0;
const BG_CIRCLE = 75;
const TRACK_HEIGHT = CIRCLE * 0.65;
const TRACK_HPAD = CIRCLE * 0.15;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  useEffect(() => {
    const handler = BackHandler.addEventListener("hardwareBackPress", () => {
      return true;
    });
    return () => handler.remove();
  }, []);

  const activeIndex = TAB_CONFIG.findIndex((tab) => {
    if (tab.name === "index") return pathname === "/" || pathname === "";
    return pathname.startsWith(`/${tab.name}`);
  });

  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />

      {/* Hidden TabList — registers routes */}
      <TabList style={{ display: "none" }}>
        {TAB_CONFIG.map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href as any} />
        ))}
      </TabList>

      {/* Floating chain tab bar */}
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          bottom: Math.max(insets.bottom, 12),
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
            {TAB_CONFIG.map((tab, i) => {
              const isFocused = i === activeIndex;
              const TabIcon = tab.Icon;

              return (
                <TabTrigger key={tab.name} name={tab.name}>
                  <View
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
                        backgroundColor: isFocused ? COLORS.primary : "#F5F5F5",
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
                  </View>
                </TabTrigger>
              );
            })}
          </View>
        </View>
      </View>
    </Tabs>
  );
}
