import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync('auth_token');
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Request failed');
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
