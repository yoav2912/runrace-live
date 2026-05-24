import Constants from 'expo-constants';

const CLOUD = 'https://runrace-api.onrender.com';

const extra = Constants.expoConfig?.extra as
  | { apiUrl?: string; socketUrl?: string }
  | undefined;

export const API_URL = extra?.apiUrl ?? CLOUD;
export const SOCKET_URL = extra?.socketUrl ?? API_URL;
