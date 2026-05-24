import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { LiveRace, RacerState } from '@runrace/shared';
import { Button } from '@/components/ui/Button';
import { computeDisplayRaceStats, formatDuration, formatKm } from '@/utils/raceFormat';
import { colors, spacing } from '@/theme/colors';

interface Props {
  race: LiveRace;
  me?: RacerState;
  userId?: string;
  onDone: () => void;
}

export function RaceEndScreen({ race, me, userId, onDone }: Props) {
  const winner = race.racers[0];
  const disqualified = me?.disqualified ?? false;
  const didWin = !disqualified && winner?.userId === userId;
  const distanceKm = (me?.distanceM ?? 0) / 1000;
  const { elapsedSec, avgKmh } = computeDisplayRaceStats(
    me?.distanceM ?? 0,
    race.startedAt,
    me?.finishTime,
    race.finishedAt,
    me?.paceSecPerKm,
  );

  const headline = disqualified ? 'DISQUALIFIED' : didWin ? 'YOU WON' : 'YOU LOSE';
  const headlineColor = didWin ? colors.neon : colors.danger;
  const gradientColors = didWin
    ? (['rgba(0,245,160,0.25)', 'rgba(10,14,20,0.98)'] as const)
    : (['rgba(255,77,109,0.2)', 'rgba(10,14,20,0.98)'] as const);

  const subline = disqualified ? 'זוהתה רמאות — המירוץ הסתיים' : undefined;

  return (
    <View style={styles.wrap}>
      <LinearGradient colors={[...gradientColors]} style={StyleSheet.absoluteFill} />

      <View style={styles.content}>
        <Text
          style={[
            styles.headline,
            disqualified && styles.headlineSmall,
            { color: headlineColor },
          ]}
        >
          {headline}
        </Text>
        {subline && <Text style={styles.subline}>{subline}</Text>}

        <Text style={styles.statsLine}>
          {formatKm(distanceKm)} km · {formatDuration(elapsedSec)}
        </Text>

        <Text style={styles.avgLabel}>מהירות ממוצעת</Text>
        <Text style={styles.avgValue}>{avgKmh.toFixed(1)} קמ&quot;ש</Text>

        {winner && !didWin && (
          <Text style={styles.opponentNote}>
            ניצח: {winner.username} · {formatKm(winner.distanceM / 1000)} km
          </Text>
        )}

        <Text style={styles.code}>RACE {race.code}</Text>
      </View>

      <View style={styles.footer}>
        <Button title="חזרה לבית" onPress={onDone} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  headline: {
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  headlineSmall: {
    fontSize: 34,
    letterSpacing: 1,
  },
  subline: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  statsLine: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  avgLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    marginTop: spacing.xl,
    letterSpacing: 0.5,
  },
  avgValue: {
    color: colors.neonAlt,
    fontSize: 32,
    fontWeight: '900',
    marginTop: spacing.sm,
  },
  opponentNote: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  code: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xl,
    letterSpacing: 2,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
});
