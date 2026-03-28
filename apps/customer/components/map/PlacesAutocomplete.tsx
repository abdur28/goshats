import { CloseCircle, Location } from "iconsax-react-native";
import React, { useCallback, useRef, useState } from "react";
import {
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  getPlaceDetails,
  getPlaceSuggestions,
  type PlaceDetails,
  type PlaceSuggestion,
} from "@/lib/maps";
import { useLocationStore } from "@/store/location-store";
import { COLORS } from "@/constants/theme";

interface PlacesAutocompleteProps {
  placeholder?: string;
  onPlaceSelected: (place: PlaceDetails) => void;
  onClear?: () => void;
  initialValue?: string;
  autoFocus?: boolean;
  containerClassName?: string;
}

export default function PlacesAutocomplete({
  placeholder = "Search for a location",
  onPlaceSelected,
  onClear,
  initialValue = "",
  autoFocus = false,
  containerClassName = "",
}: PlacesAutocompleteProps) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentLocation = useLocationStore((s) => s.currentLocation);

  const searchPlaces = useCallback(
    (text: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (text.length < 2) {
        setSuggestions([]);
        setShowResults(false);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          const results = await getPlaceSuggestions(
            text,
            currentLocation ?? undefined
          );
          setSuggestions(results);
          setShowResults(results.length > 0);
        } catch {
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    },
    [currentLocation]
  );

  const handleChangeText = useCallback(
    (text: string) => {
      setQuery(text);
      searchPlaces(text);
    },
    [searchPlaces]
  );

  const handleSelect = useCallback(
    async (suggestion: PlaceSuggestion) => {
      Keyboard.dismiss();
      setQuery(suggestion.mainText);
      setShowResults(false);
      setSuggestions([]);

      const details = await getPlaceDetails(suggestion.placeId);
      if (details) {
        onPlaceSelected(details);
      }
    },
    [onPlaceSelected]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    setSuggestions([]);
    setShowResults(false);
    onClear?.();
  }, [onClear]);

  return (
    <View className={`relative ${containerClassName}`} style={{ zIndex: 1000 }}>
      {/* Search Input */}
      <View className="flex-row items-center bg-white rounded-full px-4 border border-gray-100 shadow-sm">
        <Location size={20} color={COLORS.primary} variant="Bold" />
        <TextInput
          style={{
            flex: 1,
            marginLeft: 12,
            fontSize: 14,
            fontFamily: "PolySans-Neutral",
            color: "#111827",
            paddingVertical: 14,
          }}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={handleChangeText}
          autoFocus={autoFocus}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Pressable onPress={handleClear} className="ml-2 active:opacity-80">
            <CloseCircle size={20} color="#9CA3AF" variant="Bold" />
          </Pressable>
        )}
      </View>

      {/* Results Dropdown */}
      {showResults && (
        <View
          className="absolute left-0 right-0 bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden"
          style={{ top: 56, zIndex: 1001 }}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: 260 }}
          >
            {suggestions.map((item) => (
              <Pressable
                key={item.placeId}
                onPress={() => handleSelect(item)}
                className="flex-row items-center px-4 py-3 border-b border-gray-50 active:bg-gray-50"
              >
                <View className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center mr-3">
                  <Location size={16} color={COLORS.primary} variant="TwoTone" />
                </View>
                <View className="flex-1">
                  <Text
                    className="font-sans-semibold text-sm text-gray-900"
                    numberOfLines={1}
                  >
                    {item.mainText}
                  </Text>
                  <Text
                    className="font-sans text-xs text-gray-500 mt-0.5"
                    numberOfLines={1}
                  >
                    {item.secondaryText}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>

          {isLoading && (
            <View className="py-3 items-center">
              <Text className="font-sans text-xs text-gray-400">
                Searching...
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
