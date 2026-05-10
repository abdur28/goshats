import PlacesAutocomplete from "@/components/map/PlacesAutocomplete";
import type { PlaceDetails } from "@/lib/maps";
import { useCallback } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface RegionPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (place: PlaceDetails) => void;
}

export default function RegionPickerModal({
  visible,
  onClose,
  onSelect,
}: RegionPickerModalProps) {
  const handlePlaceSelected = useCallback(
    (place: PlaceDetails) => {
      onSelect(place);
      onClose();
    },
    [onSelect, onClose],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
        <View className="px-5 pt-10">
          <View className="flex-row items-center mb-4">
            <View className="flex-1">
              <Text className="font-sans-bold text-xl text-gray-900">
                Browse another region
              </Text>
              <Text className="font-sans text-xs text-gray-500 mt-1">
                Search any city to see available riders there
              </Text>
            </View>
            <Pressable onPress={onClose} className="active:opacity-80">
              <Text className="font-sans-semibold text-sm text-primary">
                Cancel
              </Text>
            </Pressable>
          </View>

          <PlacesAutocomplete
            placeholder="City, area, or landmark"
            onPlaceSelected={handlePlaceSelected}
            autoFocus
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
