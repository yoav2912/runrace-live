import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { UserProfile } from '@runrace/shared';
import { api, loginWithBackend } from '../services/api';
import { supabase } from '../services/supabase';
import { signInWithOAuthProvider } from '../services/supabaseAuth';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  setSession: (token: string, user: UserProfile) => Promise<void>;
  loadSession: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInDev: () => Promise<void>;
  signOut: () => Promise<void>;
}

async function syncUserWithBackend(authUser: User, provider: 'google' | 'apple' | 'email') {
  const username =
    authUser.email?.split('@')[0]?.replace(/[^a-zA-Z0-9_]/g, '') ||
    `runner_${authUser.id.slice(0, 8)}`;

  const res = await loginWithBackend({
    authProviderId: authUser.id,
    email: authUser.email ?? undefined,
    username: username.slice(0, 24),
    displayName:
      (authUser.user_metadata?.full_name as string | undefined) ??
      (authUser.user_metadata?.name as string | undefined) ??
      username,
    avatarUrl: authUser.user_metadata?.avatar_url as string | undefined,
    provider,
  });

  return res;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: true,

  setSession: async (token, user) => {
    await SecureStore.setItemAsync('auth_token', token);
    set({ token, user, loading: false });
  },

  loadSession: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) {
        set({ loading: false });
        return;
      }
      const data = await api<{ profile: UserProfile }>('/api/users/me');
      set({ token, user: data.profile, loading: false });
    } catch {
      await SecureStore.deleteItemAsync('auth_token');
      set({ token: null, user: null, loading: false });
    }
  },

  signInWithGoogle: async () => {
    const authUser = await signInWithOAuthProvider('google');
    const res = await syncUserWithBackend(authUser, 'google');
    await get().setSession(res.token, res.user as UserProfile);
  },

  signInWithApple: async () => {
    const authUser = await signInWithOAuthProvider('apple');
    const res = await syncUserWithBackend(authUser, 'apple');
    await get().setSession(res.token, res.user as UserProfile);
  },

  /** כניסה מהירה לפיתוח — בלי Google/Apple */
  signInDev: async () => {
    const devId = `dev_${Date.now()}`;
    const username = `runner_${Math.floor(Math.random() * 9000) + 1000}`;
    const res = await loginWithBackend({
      authProviderId: devId,
      email: `${username}@runrace.dev`,
      username,
      displayName: 'Runner Dev',
      provider: 'email',
    });
    await get().setSession(res.token, res.user as UserProfile);
  },

  signOut: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    if (supabase) await supabase.auth.signOut();
    set({ user: null, token: null });
  },
}));
