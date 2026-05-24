import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { UserProfile } from '@runrace/shared';
import { colors, spacing } from '@/theme/colors';
import { leagueColor, leagueLabel } from '@/theme/league';

interface Props {
  user: UserProfile | null;
}

export function HomeHeader({ user }: Props) {
  const name = user?.displayName?.split(' ')[0] ?? 'Runner';
  const tier = leagueColor(user?.league);
  const initial = (user?.displayName?.[0] ?? 'R').toUpperCase();

  return (
    <View style={styles.row}>
      <LinearGradient colors={['#00F5A0', '#00D4FF']} style={styles.avatar}>
        <Text style={styles.initial}>{initial}</Text>
      </LinearGradient>

      <View style={styles.textBlock}>
        <Text style={styles.hello}>שלום, {name}</Text>
        <View style={styles.metaRow}>
          <View style={[styles.leagueBadge, { borderColor: tier }]}>
            <View style={[styles.leagueDot, { backgroundColor: tier }]} />
            <Text style={[styles.leagueText, { color: tier }]}>{leagueLabel(user?.league)}</Text>
          </View>
          <Text style={styles.rank}>Rank {user?.competitiveRank ?? 1000}</Text>
        </View>
      </View>

      <View style={styles.levelBox}>
        <Text style={styles.levelLabel}>LVL</Text>
        <Text style={styles.levelValue}>{user?.level ?? 1}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: '#041018',
    fontSize: 20,
    fontWeight: '900',
  },
  textBlock: { flex: 1 },
  hello: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  leagueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  leagueDot: { width: 6, height: 6, borderRadius: 3 },
  leagueText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  rank: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  levelBox: {
    alignItems: 'center',
    minWidth: 44,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  levelLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  levelValue: {
    color: colors.neon,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
});
