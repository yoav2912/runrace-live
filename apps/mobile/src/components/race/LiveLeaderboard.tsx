import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { RacerState } from '@runrace/shared';
import { colors } from '@/theme/colors';
import { formatKm, kmRemaining } from '@/utils/raceFormat';

interface Props {
  racers: RacerState[];
  targetDistanceM?: number;
}

function formatPaceDisplay(secPerKm: number): string {
  if (!secPerKm || secPerKm > 3600) return '--:--';
  const m = Math.floor(secPerKm / 60);
  const s = Math.floor(secPerKm % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function LiveLeaderboard({ racers, targetDistanceM }: Props) {
  return (
    <FlatList
      data={racers}
      keyExtractor={(item) => item.userId}
      style={styles.list}
      renderItem={({ item, index }) => {
        const leftKm = kmRemaining(targetDistanceM, item.distanceM);
        return (
          <View style={[styles.row, index === 0 && styles.leader]}>
            <Text style={styles.rank}>#{item.rank || index + 1}</Text>
            <View style={styles.info}>
              <Text style={styles.name}>{item.username}</Text>
              <Text style={styles.meta}>
                {(item.distanceM / 1000).toFixed(2)} km · {formatPaceDisplay(item.paceSecPerKm)}/km
              </Text>
              {targetDistanceM ? (
                <Text style={styles.left}>נשאר {formatKm(leftKm)} ק&quot;מ</Text>
              ) : null}
            </View>
            <Text style={styles.gap}>
              {index === 0 && item.distanceM > 0
                ? 'LEAD'
                : item.gapToLeaderM > 0
                  ? `+${item.gapToLeaderM.toFixed(0)}m`
                  : '—'}
            </Text>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { maxHeight: 200 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leader: { backgroundColor: 'rgba(0,245,160,0.08)' },
  rank: { width: 36, color: colors.neon, fontWeight: '800' },
  info: { flex: 1 },
  name: { color: colors.text, fontWeight: '700' },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  left: { color: colors.neonAlt, fontSize: 11, fontWeight: '700', marginTop: 4 },
  gap: { color: colors.neonAlt, fontWeight: '700', fontSize: 12 },
});
