import { router } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { RaceEndScreen } from '@/components/race/RaceEndScreen';
import { useAuthStore } from '@/store/authStore';
import { useRaceStore } from '@/store/raceStore';
import { colors } from '@/theme/colors';

export default function RaceSummaryScreen() {
  const user = useAuthStore((s) => s.user);
  const { activeRace, leaderboard, clear } = useRaceStore();

  if (!activeRace) {
    router.replace('/(tabs)');
    return null;
  }

  const me = leaderboard.find((r) => r.userId === user?.id);
  const race = { ...activeRace, racers: leaderboard };

  return (
    <View style={styles.container}>
      <RaceEndScreen
        race={race}
        me={me}
        userId={user?.id}
        onDone={() => {
          clear();
          router.replace('/(tabs)');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
});
