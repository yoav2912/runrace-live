import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/theme/colors';

interface Props {
  title: string;
  description: string;
  progress: number;
  target: number;
  xpReward: number;
}

export function MissionCard({ title, description, progress, target, xpReward }: Props) {
  const pct = Math.min(1, progress / target);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="flag-outline" size={18} color={colors.neon} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.desc}>{description}</Text>
        </View>
        <Text style={styles.xp}>+{xpReward} XP</Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>
        {progress}/{target}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0,245,160,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  desc: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
  xp: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '800',
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.neon,
    borderRadius: 2,
  },
  progressText: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 6,
    fontWeight: '600',
  },
});
