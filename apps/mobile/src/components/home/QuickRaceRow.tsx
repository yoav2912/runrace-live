import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/theme/colors';

export interface QuickRaceOption {
  label: string;
  meters: number;
  subtitle: string;
}

interface Props {
  options: QuickRaceOption[];
  onSelect: (meters: number) => void;
}

export function QuickRaceRow({ options, onSelect }: Props) {
  return (
    <View>
      <Text style={styles.sectionTitle}>מרוצים מהירים</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {options.map((o) => (
          <Pressable
            key={o.meters}
            onPress={() => onSelect(o.meters)}
            style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
          >
            <Text style={styles.chipLabel}>{o.label}</Text>
            <Text style={styles.chipSub}>{o.subtitle}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: spacing.sm,
    letterSpacing: -0.2,
  },
  scroll: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  chip: {
    minWidth: 100,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipPressed: {
    borderColor: colors.neon,
    backgroundColor: 'rgba(0,245,160,0.06)',
  },
  chipLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  chipSub: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
});
