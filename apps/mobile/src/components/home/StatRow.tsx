import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/theme/colors';

interface Stat {
  label: string;
  value: string;
  accent?: string;
}

interface Props {
  stats: Stat[];
}

export function StatRow({ stats }: Props) {
  return (
    <View style={styles.row}>
      {stats.map((s, i) => (
        <View key={s.label} style={[styles.cell, i < stats.length - 1 && styles.cellBorder]}>
          <Text style={[styles.value, s.accent ? { color: s.accent } : undefined]}>{s.value}</Text>
          <Text style={styles.label}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  cellBorder: {
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  value: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  label: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
