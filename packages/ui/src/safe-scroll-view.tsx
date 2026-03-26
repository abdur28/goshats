import React from "react";
import { ScrollView, type ScrollViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface SafeScrollViewProps extends ScrollViewProps {
  children: React.ReactNode;
  className?: string;
  scrollEnabled?: boolean;
}

export function SafeScrollView({
  children,
  className = "",
  scrollEnabled = true,
  ...props
}: SafeScrollViewProps) {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className={`flex-1 ${className}`}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={scrollEnabled}
        {...props}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
