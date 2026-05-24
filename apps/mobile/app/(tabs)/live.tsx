import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, Alert } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { LiveLeaderboard } from '@/components/race/LiveLeaderboard';
import { LiveRaceMap } from '@/components/race/LiveRaceMap';
import { RaceLiveHud } from '@/components/race/RaceLiveHud';
import { useLiveGpsStore } from '@/store/liveGpsStore';
import { MatchFoundLobby } from '@/components/race/MatchFoundLobby';
import { RaceCountdownOverlay } from '@/components/race/RaceCountdownOverlay';
import { RaceEndScreen } from '@/components/race/RaceEndScreen';
import { useAuthStore } from '@/store/authStore';
import { useRaceStore } from '@/store/raceStore';
import { startRaceTracking, stopRaceTracking } from '@/services/locationTracker';
import { getSocket } from '@/services/socket';
import { colors, spacing } from '@/theme/colors';

export default function LiveRaceScreen() {
  const user = useAuthStore((s) => s.user);
  const {
    activeRace,
    leaderboard,
    countdown,
    cheatWarning,
    lastRaceTrustBonus,
    setReady,
    devFinishRace,
    clear,
  } = useRaceStore();
  const localSpeedMps = useLiveGpsStore((s) => s.speedMps);
  const [tracking, setTracking] = useState(false);
  const targetDistanceM = activeRace?.config.targetDistanceM;
  const [readyLoading, setReadyLoading] = useState(false);

  const me = useMemo(
    () => leaderboard.find((r) => r.userId === user?.id),
    [leaderboard, user?.id],
  );
  const opponent = useMemo(
    () => leaderboard.find((r) => r.userId !== user?.id),
    [leaderboard, user?.id],
  );
  const iAmReady = me?.ready ?? false;

  const showPregame = activeRace?.status === 'lobby';
  const showCountdown =
    activeRace?.status === 'countdown' || (countdown !== null && countdown >= 0);
  const showRace = activeRace?.status === 'live';
  const showResults = activeRace?.status === 'finished' || me?.disqualified;

  useEffect(() => {
    return () => {
      stopRaceTracking();
    };
  }, []);

  useEffect(() => {
    if (activeRace?.status === 'finished' && tracking) {
      stopRaceTracking();
      setTracking(false);
    }
  }, [activeRace?.status, tracking]);

  useEffect(() => {
    if (activeRace?.status === 'live' && !tracking) {
      (async () => {
        const socket = await getSocket();
        await startRaceTracking({
          raceId: activeRace.id,
          socket,
          onWarning: (msg) => {
            useRaceStore.setState({ cheatWarning: msg });
          },
          onDisqualified: (msg) => {
            stopRaceTracking();
            const uid = user?.id;
            useRaceStore.setState((s) => {
              const racers = s.leaderboard.map((r) =>
                r.userId === uid ? { ...r, disqualified: true, finished: true } : r,
              );
              return {
                cheatWarning: msg,
                leaderboard: racers,
                activeRace: s.activeRace
                  ? { ...s.activeRace, status: 'finished', racers }
                  : null,
              };
            });
          },
        });
        setTracking(true);
      })();
    }
  }, [activeRace?.status, activeRace?.id, tracking]);

  const handleReady = async () => {
    if (iAmReady || readyLoading) return;
    setReadyLoading(true);
    try {
      await setReady();
    } catch (e) {
      Alert.alert('שגיאה', e instanceof Error ? e.message : 'לא הצלחנו לשלוח מוכן');
    } finally {
      setReadyLoading(false);
    }
  };

  if (!activeRace) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>אין מירוץ פעיל</Text>
        <Button title="מצא מרוץ" onPress={() => router.push('/race/matchmaking')} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.code}>RACE {activeRace.code}</Text>
        {cheatWarning && !showResults && (
          <View style={styles.warningBox}>
            {cheatWarning.split('\n').map((line, i) => (
              <Text key={`${i}-${line}`} style={styles.warningLine}>
                {line}
              </Text>
            ))}
          </View>
        )}
      </View>

      {showPregame && (
        <MatchFoundLobby
          opponent={opponent}
          me={me}
          myProfile={user ? { username: user.username, avatarUrl: user.avatarUrl } : undefined}
          iAmReady={iAmReady}
          onReady={handleReady}
          readyLoading={readyLoading}
        />
      )}

      {showCountdown && (
        <RaceCountdownOverlay secondsLeft={countdown ?? 5} />
      )}

      {showResults && activeRace && (
        <RaceEndScreen
          race={{ ...activeRace, racers: leaderboard, status: 'finished' }}
          me={me}
          userId={user?.id}
          trustBonus={lastRaceTrustBonus}
          onDone={() => {
            clear();
            stopRaceTracking();
            router.replace('/(tabs)');
          }}
        />
      )}

      {showRace && (
        <>
          <View style={styles.mapWrap}>
            <LiveRaceMap racers={leaderboard} userId={user?.id} />
            <RaceLiveHud
              me={me}
              opponent={opponent}
              targetDistanceM={targetDistanceM}
              localSpeedMps={localSpeedMps}
            />
          </View>
          <View style={styles.panel}>
            <LiveLeaderboard racers={leaderboard} targetDistanceM={targetDistanceM} />
            {__DEV__ && (
              <View style={styles.devRow}>
                <Button
                  title="בדיקה: אני מנצח"
                  onPress={() => user?.id && devFinishRace(user.id)}
                  style={styles.devBtn}
                />
                <Button
                  title="בדיקה: יריב מנצח"
                  variant="ghost"
                  onPress={() => opponent?.userId && devFinishRace(opponent.userId)}
                  style={styles.devBtn}
                />
              </View>
            )}
            <Button
              title="עזוב"
              variant="ghost"
              onPress={() => {
                clear();
                stopRaceTracking();
              }}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        </>
      )}

      {showPregame && (
        <View style={styles.pregameFooter}>
          <Button
            title="עזוב"
            variant="ghost"
            onPress={() => {
              clear();
              stopRaceTracking();
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '800', marginBottom: spacing.lg },
  header: { paddingTop: 56, paddingHorizontal: spacing.lg, zIndex: 10 },
  code: { color: colors.neon, fontWeight: '800', letterSpacing: 2 },
  warningBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: 'rgba(255, 80, 80, 0.12)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  warningLine: { color: colors.danger, fontSize: 12, lineHeight: 18 },
  mapWrap: {
    flex: 1,
    margin: spacing.md,
    minHeight: 320,
    position: 'relative',
  },
  panel: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  pregameFooter: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  devRow: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  devBtn: {
    marginTop: spacing.xs,
  },
});
