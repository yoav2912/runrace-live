import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';
import { colors, spacing } from '@/theme/colors';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{user?.displayName}</Text>
      <Text style={styles.handle}>@{user?.username}</Text>

      <Card style={styles.card}>
        <Text style={styles.statLabel}>Level {user?.level}</Text>
        <Text style={styles.statValue}>{user?.xp} XP</Text>
        <Text style={[styles.statLabel, { marginTop: 12 }]}>Trust Score</Text>
        <Text style={styles.trust}>{user?.trustScore}%</Text>
      </Card>

      <Button title="Tournaments" onPress={() => router.push('/tournaments')} variant="ghost" />
      <Button title="Settings" onPress={() => router.push('/settings')} variant="ghost" style={{ marginTop: spacing.sm }} />
      <Button title="Sign Out" onPress={signOut} variant="danger" style={{ marginTop: spacing.lg }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg, paddingTop: 56 },
  name: { color: colors.text, fontSize: 28, fontWeight: '900' },
  handle: { color: colors.textMuted, marginBottom: spacing.lg },
  card: { marginBottom: spacing.lg },
  statLabel: { color: colors.textMuted, fontSize: 12, textTransform: 'uppercase' },
  statValue: { color: colors.neon, fontSize: 24, fontWeight: '800' },
  trust: { color: colors.neonAlt, fontSize: 22, fontWeight: '800' },
});
