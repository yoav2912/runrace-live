import * as SecureStore from 'expo-secure-store';
import { API_URL } from '@/config/serverUrls';


/** Render free tier may sleep — first request can take ~60s */
const FETCH_TIMEOUT_MS = 90_000;

async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync('auth_token');
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getToken();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers as Record<string, string>),
      },
    });
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error(
        'השרת לא הגיב בזמן — אם זו הפעם הראשונה היום, חכה דקה ונסה שוב (Render מתעורר)',
      );
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(typeof err.error === 'string' ? err.error : 'Request failed');
    }

  return res.json() as Promise<T>;
}

export async function loginWithBackend(payload: {
  authProviderId: string;
  email?: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  provider: 'google' | 'apple' | 'email' | 'supabase';
}): Promise<{ token: string; user: unknown }> {
  return api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
