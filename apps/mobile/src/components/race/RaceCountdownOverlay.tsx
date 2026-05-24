import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '@/theme/colors';

interface Props {
  secondsLeft: number;
}

export function RaceCountdownOverlay({ secondsLeft }: Props) {
  const display = secondsLeft > 0 ? String(secondsLeft) : 'GO!';

  return (
    <View style={styles.overlay}>
      <Text style={styles.label}>המירוץ מתחיל</Text>
      <Text style={styles.number}>{display}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,14,20,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  label: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
  },
  number: {
    color: colors.neon,
    fontSize: 120,
    fontWeight: '900',
    lineHeight: 130,
  },
});
