import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import type { TrustHistoryItem, UserRaceHistoryItem } from '@runrace/shared';
import { TRUST_BONUS_CLEAN_RACE, trustReasonHe } from '@runrace/shared';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { api } from '@/services/api';
import { colors, spacing } from '@/theme/colors';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatKm(m: number): string {
  return (m / 1000).toFixed(2);
}

export default function ProfileHistoryScreen() {
  const [races, setRaces] = useState<UserRaceHistoryItem[]>([]);
  const [trustHistory, setTrustHistory] = useState<TrustHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [racesRes, trustRes] = await Promise.all([
        api<{ races: UserRaceHistoryItem[] }>('/api/users/me/races'),
        api<{ history: TrustHistoryItem[] }>('/api/users/me/trust-history'),
      ]);
      setRaces(racesRes.races);
      setTrustHistory(trustRes.history);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'טעינה נכשלה');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  if (loading && races.length === 0 && trustHistory.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.neon} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.neon} />}
    >
      <Button title="← חזרה" onPress={() => router.back()} variant="ghost" />
      <Text style={styles.title}>היסטוריה</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.sectionTitle}>מירוצים שלי</Text>
      {races.length === 0 ? (
        <Text style={styles.empty}>עדיין אין מירוצים שהושלמו</Text>
      ) : (
        races.map((item) => (
          <Card key={item.raceId} style={styles.row}>
            <View style={styles.rowTop}>
              <Text style={styles.code}>{item.code}</Text>
              <Text style={styles.date}>{formatDate(item.finishedAt)}</Text>
            </View>
            <Text style={styles.meta}>
              {item.targetDistanceM ? `${formatKm(item.targetDistanceM)} ק"מ` : 'מירוץ'} · מקום{' '}
              {item.finalRank ?? '—'}
              {item.won ? ' · ניצחון' : ''}
              {item.disqualified ? ' · פסילה' : ''}
            </Text>
            {item.cleanRace ? (
              <Text style={styles.bonus}>
                מירוץ נקי +{item.trustBonusEarned || TRUST_BONUS_CLEAN_RACE} אמון
              </Text>
            ) : !item.disqualified ? (
              <Text style={styles.muted}>לא זכאי לבונוס נקי (היו אזהרות)</Text>
            ) : null}
          </Card>
        ))
      )}

      <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>שינויי ציון אמון</Text>
      {trustHistory.length === 0 ? (
        <Text style={styles.empty}>אין עדיין רשומות</Text>
      ) : (
        trustHistory.map((item) => {
          const up = item.delta > 0;
          return (
            <Card key={item.id} style={styles.row}>
              <View style={styles.rowTop}>
                <Text style={[styles.delta, up ? styles.deltaUp : styles.deltaDown]}>
                  {up ? '+' : ''}
                  {Math.round(item.delta)}
                </Text>
                <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
              </View>
              <Text style={styles.meta}>{trustReasonHe(item.reason)}</Text>
              <Text style={styles.muted}>ציון אחרי: {Math.round(item.newScore)}</Text>
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingTop: 48, paddingBottom: spacing.xl },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 26, fontWeight: '900', marginVertical: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: spacing.sm },
  error: { color: colors.danger, marginBottom: spacing.sm },
  empty: { color: colors.textMuted, marginBottom: spacing.md },
  row: { marginBottom: spacing.sm },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  code: { color: colors.neonAlt, fontWeight: '800', fontSize: 16 },
  date: { color: colors.textMuted, fontSize: 12 },
  meta: { color: colors.text, marginTop: 6, fontSize: 14 },
  muted: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  bonus: { color: colors.neon, fontSize: 13, fontWeight: '700', marginTop: 6 },
  delta: { fontSize: 20, fontWeight: '900' },
  deltaUp: { color: colors.neon },
  deltaDown: { color: colors.danger },
});
