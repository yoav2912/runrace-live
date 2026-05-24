import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { api } from '@/services/api';
import { colors, spacing } from '@/theme/colors';
import { Card } from '@/components/ui/Card';

interface Row {
  username: string;
  competitive_rank: number;
  league: string;
  wins: number;
}

export default function RankingsScreen() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    api<{ leaderboard: Row[] }>('/api/gamification/leaderboard/global')
      .then((d) => setRows(d.leaderboard))
      .catch(() => setRows([]));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Global Rankings</Text>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.username}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0 }}
        renderItem={({ item, index }) => (
          <Card style={styles.row}>
            <Text style={styles.rank}>#{index + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.username}</Text>
              <Text style={styles.meta}>{item.league} · {item.wins} wins</Text>
            </View>
            <Text style={styles.score}>{item.competitive_rank}</Text>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingTop: 56 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', padding: spacing.lg, paddingBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  rank: { width: 40, color: colors.neon, fontWeight: '800' },
  name: { color: colors.text, fontWeight: '700' },
  meta: { color: colors.textMuted, fontSize: 12 },
  score: { color: colors.neonAlt, fontWeight: '800', fontSize: 18 },
});
