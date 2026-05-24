/** @type {import('expo/config').ExpoConfig} */
module.exports = () => {
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

  return {
    name: 'RunRace Live',
    slug: 'runrace-live',
    version: '1.0.0',
    orientation: 'portrait',
    scheme: 'runrace',
    userInterfaceStyle: 'dark',
    newArchEnabled: true,
    splash: {
      resizeMode: 'contain',
      backgroundColor: '#0A0E14',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.runrace.live',
      config: {
        googleMapsApiKey,
      },
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'RunRace Live needs your location for live competitive races.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'Background location is used during active live races.',
        NSMotionUsageDescription:
          'Motion sensors help validate running activity and prevent cheating.',
      },
    },
    android: {
      package: 'com.runrace.live',
      config: {
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'ACTIVITY_RECOGNITION',
      ],
    },
    plugins: [
      ['expo-router', { root: './app' }],
      'expo-secure-store',
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'Allow RunRace Live to use your location during live races.',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      eas: {
        projectId: 'runrace-live',
      },
      googleMapsApiKey,
    },
  };
};
