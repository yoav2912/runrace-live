import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/theme/colors';

export default function RootLayout() {
  const { loading, loadSession } = useAuthStore();

  useEffect(() => {
    loadSession();
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={colors.neon} size="large" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
    </>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
});
