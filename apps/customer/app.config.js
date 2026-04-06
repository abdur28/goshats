// No EXPO_PUBLIC_ prefix — these are only needed for native config (injected
// into Info.plist / AndroidManifest.xml at build time via config plugins).
// They are NOT embedded in the JS bundle.
// Local: set in .env.local  |  EAS builds: set as EAS Secrets in the dashboard.
const iosKey = process.env.GOOGLE_MAPS_API_KEY_IOS ?? "";
const androidKey = process.env.GOOGLE_MAPS_API_KEY_ANDROID ?? "";
const iosPlist =
  process.env.GOOGLE_SERVICE_INFO_PLIST ?? "./GoogleService-Info.plist";

export default ({ config }) => {
  return {
    ...config,
    ios: {
      ...config.ios,
      googleServicesFile: iosPlist,
      config: {
        ...config.ios?.config,
        googleMapsApiKey: iosKey,
      },
    },
    android: {
      ...config.android,
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey: androidKey,
        },
      },
    },
    // Pass keys explicitly to react-native-maps plugin so it doesn't
    // have to fall back to the ios/android config objects
    plugins: (config.plugins ?? []).map((plugin) => {
      if (
        plugin === "react-native-maps" ||
        (Array.isArray(plugin) && plugin[0] === "react-native-maps")
      ) {
        return [
          "react-native-maps",
          { androidGoogleMapsApiKey: androidKey, iosGoogleMapsApiKey: iosKey },
        ];
      }
      return plugin;
    }),
  };
};
