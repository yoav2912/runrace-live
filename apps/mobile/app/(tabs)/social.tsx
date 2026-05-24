import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { api } from '@/services/api';
import { colors, spacing } from '@/theme/colors';
import { Card } from '@/components/ui/Card';

export default function SocialScreen() {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    api<{ items: Record<string, unknown>[] }>('/api/social/feed')
      .then((d) => setItems(d.items))
      .catch(() => setItems([]));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Live Feed</Text>
      <FlatList
        data={items}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding: spacing.lg }}
        ListEmptyComponent={<Text style={styles.empty}>Follow friends to see live race activity</Text>}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: spacing.sm }}>
            <Text style={styles.activity}>{String(item.activity_type)}</Text>
            <Text style={styles.user}>@{String(item.username ?? 'runner')}</Text>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingTop: 56 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', padding: spacing.lg },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  activity: { color: colors.neon, fontWeight: '800', textTransform: 'uppercase', fontSize: 12 },
  user: { color: colors.text, marginTop: 6, fontWeight: '700' },
});
