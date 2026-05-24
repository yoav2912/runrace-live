import { Platform } from 'react-native';
import Constants from 'expo-constants';

const envKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const extraKey =
  (Constants.expoConfig?.extra as { googleMapsApiKey?: string } | undefined)?.googleMapsApiKey ?? '';

export const GOOGLE_MAPS_API_KEY = envKey || extraKey;

export const HAS_VALID_GOOGLE_MAPS_KEY =
  GOOGLE_MAPS_API_KEY.length > 12 && !GOOGLE_MAPS_API_KEY.includes('your-google');

/** Android requires Google Maps SDK + API key for tiles */
export const PREFER_GOOGLE_MAPS = Platform.OS === 'android' || HAS_VALID_GOOGLE_MAPS_KEY;
