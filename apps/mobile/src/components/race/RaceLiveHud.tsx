import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { RacerState } from '@runrace/shared';
import { colors, spacing } from '@/theme/colors';
import { formatKm, formatSpeedKmh, kmRemaining } from '@/utils/raceFormat';
import { displaySpeedMps } from '@/utils/gpsMotion';

interface Props {
  me?: RacerState;
  opponent?: RacerState;
  targetDistanceM?: number;
  localSpeedMps: number;
}

function KmLeftCard({
  label,
  name,
  distanceM,
  targetDistanceM,
  accent,
}: {
  label: string;
  name: string;
  distanceM: number;
  targetDistanceM?: number;
  accent: string;
}) {
  const left = kmRemaining(targetDistanceM, distanceM);
  return (
    <View style={[styles.kmCard, { borderColor: accent }]}>
      <Text style={styles.kmLabel}>{label}</Text>
      <Text style={styles.kmName} numberOfLines={1}>
        {name}
      </Text>
      <Text style={[styles.kmValue, { color: accent }]}>{formatKm(left)}</Text>
      <Text style={styles.kmUnit}>ק&quot;מ נשאר</Text>
    </View>
  );
}

export function RaceLiveHud({ me, opponent, targetDistanceM, localSpeedMps }: Props) {
  const rawSpeed = (me?.speedMps && me.speedMps > 0 ? me.speedMps : localSpeedMps) ?? 0;
  const speedMps = displaySpeedMps(rawSpeed);

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <LinearGradient
        colors={['rgba(10,14,20,0.85)', 'rgba(10,14,20,0.45)', 'transparent']}
        style={styles.topFade}
        pointerEvents="none"
      />

      <View style={styles.speedometer}>
        <Text style={styles.speedValue}>{formatSpeedKmh(speedMps)}</Text>
        <Text style={styles.speedUnit}>קמ&quot;ש</Text>
      </View>

      <View style={styles.kmRow}>
        <KmLeftCard
          label="אתה"
          name={me?.username ?? '—'}
          distanceM={me?.distanceM ?? 0}
          targetDistanceM={targetDistanceM}
          accent={colors.neon}
        />
        <KmLeftCard
          label="יריב"
          name={opponent?.username ?? '—'}
          distanceM={opponent?.distanceM ?? 0}
          targetDistanceM={targetDistanceM}
          accent={colors.neonAlt}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  speedometer: {
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10,14,20,0.88)',
    borderWidth: 2,
    borderColor: colors.neon,
    borderRadius: 999,
    width: 108,
    height: 108,
    justifyContent: 'center',
    paddingTop: 4,
    shadowColor: colors.neon,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  speedValue: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 36,
  },
  speedUnit: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  kmRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  kmCard: {
    flex: 1,
    backgroundColor: 'rgba(10,14,20,0.9)',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  kmLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  kmName: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
    maxWidth: '100%',
  },
  kmValue: {
    fontSize: 26,
    fontWeight: '900',
    marginTop: 4,
  },
  kmUnit: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
});
