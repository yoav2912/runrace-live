import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

const redirectTo = makeRedirectUri({ scheme: 'runrace' });

export async function signInWithOAuthProvider(provider: 'google' | 'apple'): Promise<User> {
  if (!supabase) throw new Error('הגדר Supabase בקובץ .env');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error('לא התקבלה כתובת התחברות');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('ההתחברות בוטלה');
  }

  if (result.type !== 'success') {
    throw new Error('ההתחברות לא הושלמה');
  }

  const { error: sessionError } = await supabase.auth.exchangeCodeForSession(result.url);
  if (sessionError) throw sessionError;

  const { data: sessionData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!sessionData.user) throw new Error('לא נמצא משתמש אחרי ההתחברות');

  return sessionData.user;
}

export function getRedirectUriForSupabaseDashboard(): string {
  return redirectTo;
}
