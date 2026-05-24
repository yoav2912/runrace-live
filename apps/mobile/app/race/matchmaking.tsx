import { useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  MATCHMAKING_DISTANCES,
  useMatchmakingStore,
} from '@/store/matchmakingStore';
import { useRaceStore } from '@/store/raceStore';
import { colors, spacing } from '@/theme/colors';

export default function MatchmakingScreen() {
  const { distance } = useLocalSearchParams<{ distance?: string }>();
  const preselect = distance ? Number(distance) : undefined;

  const {
    counts,
    status,
    searchers,
    selectedDistanceM,
    error,
    startWatching,
    stopWatching,
    joinDistance,
    leaveQueue,
  } = useMatchmakingStore();

  const activeRace = useRaceStore((s) => s.activeRace);
  const autoJoined = useRef(false);

  const goLive = useCallback(() => {
    router.replace('/(tabs)/live');
  }, []);

  useEffect(() => {
    void startWatching();
    return () => {
      void leaveQueue();
      void stopWatching();
    };
  }, []);

  useEffect(() => {
    if (activeRace) goLive();
  }, [activeRace, goLive]);

  useEffect(() => {
    if (preselect && !autoJoined.current && status === 'idle') {
      autoJoined.current = true;
      void joinDistance(preselect);
    }
  }, [preselect, status, joinDistance]);

  const onSelect = async (meters: number) => {
    if (status === 'searching') return;
    try {
      const race = await joinDistance(meters);
      if (race) goLive();
    } catch {
      /* error in store */
    }
  };

  const onCancel = async () => {
    await leaveQueue();
    router.back();
  };

  const searching = status === 'searching';
  const selectedLabel = MATCHMAKING_DISTANCES.find((d) => d.meters === selectedDistanceM)?.labelHe;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={onCancel} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>מצא מרוץ</Text>
        <View style={styles.backBtn} />
      </View>

      <Text style={styles.subtitle}>בחר מרחק — נחבר אותך לרץ נוסף באותו מסלול</Text>

      <View style={styles.list}>
        {MATCHMAKING_DISTANCES.map((d) => {
          const count = counts[d.meters] ?? 0;
          const isSelected = selectedDistanceM === d.meters && searching;

          return (
            <Pressable
              key={d.meters}
              onPress={() => onSelect(d.meters)}
              disabled={searching && !isSelected}
              style={({ pressed }) => [
                styles.card,
                isSelected && styles.cardSelected,
                pressed && !searching && styles.cardPressed,
              ]}
            >
              <View style={styles.cardMain}>
                <Text style={styles.cardTitle}>{d.labelHe}</Text>
                <Text style={styles.cardSub}>{d.subtitle}</Text>
              </View>
              <View style={styles.cardMeta}>
                <View style={styles.searchersBadge}>
                  <View style={styles.searchersDot} />
                  <Text style={styles.searchersText}>
                    {count === 0
                      ? 'אין מחפשים כרגע'
                      : count === 1
                        ? 'רץ אחד מחפש'
                        : `${count} רצים מחפשים`}
                  </Text>
                </View>
                {!searching && (
                  <Ionicons name="arrow-back" size={20} color={colors.neon} style={styles.arrow} />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {searching && (
        <View style={styles.searchingOverlay}>
          <LinearGradient
            colors={['rgba(0,245,160,0.12)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          <ActivityIndicator size="large" color={colors.neon} />
          <Text style={styles.searchingTitle}>מחפש יריב...</Text>
          <Text style={styles.searchingSub}>
            {selectedLabel} · {searchers > 0 ? `${searchers} מחפשים על המרחק הזה` : 'ממתין לרץ נוסף'}
          </Text>
          <Pressable onPress={onCancel} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>ביטול חיפוש</Text>
          </Pressable>
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  list: {
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardSelected: {
    borderColor: colors.neon,
    backgroundColor: 'rgba(0,245,160,0.08)',
  },
  cardPressed: {
    opacity: 0.9,
  },
  cardMain: {
    flex: 1,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  cardSub: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  cardMeta: {
    alignItems: 'flex-end',
    gap: spacing.sm,
    maxWidth: '48%',
  },
  searchersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchersDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.neon,
  },
  searchersText: {
    color: colors.neon,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  arrow: {
    transform: [{ scaleX: -1 }],
  },
  searchingOverlay: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    padding: spacing.xl,
    borderRadius: 20,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.neon,
    alignItems: 'center',
    overflow: 'hidden',
  },
  searchingTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: spacing.md,
  },
  searchingSub: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  cancelBtn: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  cancelText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '700',
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
