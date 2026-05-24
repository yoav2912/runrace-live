import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

interface Props {
  label: string;
  value: string;
  accent?: string;
}

export function StatPill({ label, value, accent = colors.neon }: Props) {
  return (
    <View style={styles.pill}>
      <Text style={[styles.value, { color: accent }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    alignItems: 'center',
  },
  value: { fontSize: 18, fontWeight: '800' },
  label: { color: colors.textMuted, fontSize: 11, marginTop: 4, textTransform: 'uppercase' },
});
