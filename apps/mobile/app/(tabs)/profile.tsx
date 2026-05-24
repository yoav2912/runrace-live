import { StyleSheet, Text, View } from 'react-native';

import { router } from 'expo-router';

import { trustScoreStatusHe } from '@runrace/shared';

import { Button } from '@/components/ui/Button';

import { Card } from '@/components/ui/Card';

import { TrustRulesCard } from '@/components/trust/TrustRulesCard';

import { useAuthStore } from '@/store/authStore';

import { colors, spacing } from '@/theme/colors';



export default function ProfileScreen() {

  const { user, signOut } = useAuthStore();

  const trust = Math.round(user?.trustScore ?? 100);



  return (

    <View style={styles.container}>

      <Text style={styles.name}>{user?.displayName}</Text>

      <Text style={styles.handle}>@{user?.username}</Text>



      <Card style={styles.card}>

        <Text style={styles.statLabel}>Level {user?.level}</Text>

        <Text style={styles.statValue}>{user?.xp} XP</Text>

        <Text style={[styles.statLabel, { marginTop: 12 }]}>ציון אמון</Text>

        <Text style={styles.trust}>{trust}%</Text>

        <Text style={styles.trustHint}>{trustScoreStatusHe(trust)}</Text>

      </Card>



      <TrustRulesCard />



      <Button
        title="מירוצים והיסטוריית אמון"
        onPress={() => router.push('/profile/history')}
        variant="ghost"
      />
      <Button title="טורנירים" onPress={() => router.push('/tournaments')} variant="ghost" style={{ marginTop: spacing.sm }} />

      <Button title="הגדרות" onPress={() => router.push('/settings')} variant="ghost" style={{ marginTop: spacing.sm }} />

      <Button title="התנתק" onPress={signOut} variant="danger" style={{ marginTop: spacing.lg }} />

    </View>

  );

}



const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg, paddingTop: 56 },

  name: { color: colors.text, fontSize: 28, fontWeight: '900' },

  handle: { color: colors.textMuted, marginBottom: spacing.lg },

  card: { marginBottom: spacing.md },

  statLabel: { color: colors.textMuted, fontSize: 12, textTransform: 'uppercase' },

  statValue: { color: colors.neon, fontSize: 24, fontWeight: '800' },

  trust: { color: colors.neonAlt, fontSize: 22, fontWeight: '800' },

  trustHint: { color: colors.textMuted, fontSize: 12, marginTop: 4 },

});


