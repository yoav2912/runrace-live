import { useState } from 'react';
import { StyleSheet, Text, View, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { API_URL } from '@/config/serverUrls';
import { getRedirectUriForSupabaseDashboard } from '@/services/supabaseAuth';
import { colors, spacing } from '@/theme/colors';

export default function LoginScreen() {
  const { signInWithGoogle, signInWithApple, signInDev } = useAuthStore();
  const [busy, setBusy] = useState(false);

  const handle = async (fn: () => Promise<void>) => {
    try {
      setBusy(true);
      await fn();
      router.replace('/(tabs)');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'נסה שוב';
      Alert.alert('התחברות נכשלה', message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0E14', '#121820', '#0A0E14']} style={StyleSheet.absoluteFill} />
      <Text style={styles.badge}>LIVE COMPETITIVE RUNNING</Text>
      <Text style={styles.title}>RunRace Live</Text>
      <Text style={styles.subtitle}>Ranked mode for the real world. Race anyone, anywhere.</Text>

      <View style={styles.actions}>
        <Button title="Continue with Google" onPress={() => handle(signInWithGoogle)} disabled={busy} />
        <Button
          title="Continue with Apple"
          onPress={() => handle(signInWithApple)}
          disabled={busy}
          variant="ghost"
        />
        {__DEV__ && (
          <Button
            title="כניסה מהירה (פיתוח)"
            onPress={() => handle(signInDev)}
            disabled={busy}
            variant="ghost"
          />
        )}
      </View>

      {__DEV__ && (
        <Text style={styles.devHint}>
          API: {API_URL}
          {'\n'}
          ל-Google/Apple: Supabase → Auth → URL Configuration:{'\n'}
          {getRedirectUriForSupabaseDashboard()}
        </Text>
      )}

      <Text style={styles.legal}>By continuing you agree to fair play GPS validation.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  badge: { color: colors.neon, fontWeight: '800', letterSpacing: 2, fontSize: 11 },
  title: { color: colors.text, fontSize: 42, fontWeight: '900', marginTop: spacing.sm },
  subtitle: { color: colors.textMuted, fontSize: 16, lineHeight: 24, marginTop: spacing.md },
  actions: { marginTop: spacing.xl, gap: spacing.md },
  devHint: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: spacing.md,
    textAlign: 'center',
    lineHeight: 14,
  },
  legal: { color: colors.textMuted, fontSize: 12, marginTop: spacing.lg, textAlign: 'center' },
});
