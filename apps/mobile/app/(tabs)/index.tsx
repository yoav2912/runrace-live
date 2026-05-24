import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { HomeHeader } from '@/components/home/HomeHeader';
import { StatRow } from '@/components/home/StatRow';
import { LiveRaceHero } from '@/components/home/LiveRaceHero';
import { QuickRaceRow } from '@/components/home/QuickRaceRow';
import { MissionCard } from '@/components/home/MissionCard';
import { useAuthStore } from '@/store/authStore';
import { colors, spacing } from '@/theme/colors';
import { RACE_DISTANCE_PRESETS } from '@runrace/shared';

const QUICK_RACES = RACE_DISTANCE_PRESETS.map((p) => ({
  label: p.label,
  meters: p.meters,
  subtitle: p.meters >= 10000 ? '~60 min' : p.meters >= 5000 ? '~30 min' : '~8 min',
}));

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);

  const goMatchmaking = (distance?: number) => {
    if (distance) {
      router.push({ pathname: '/race/matchmaking', params: { distance: String(distance) } });
    } else {
      router.push('/race/matchmaking');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader user={user} />

        <View style={styles.section}>
          <StatRow
            stats={[
              { label: 'אמון', value: `${Math.round(user?.trustScore ?? 100)}%`, accent: colors.neon },
              { label: 'ניצחונות', value: String(user?.wins ?? 0), accent: colors.gold },
              { label: 'רצף', value: String(user?.winStreak ?? 0), accent: colors.neonAlt },
            ]}
          />
        </View>

        <View style={styles.section}>
          <LiveRaceHero onMatchmaking={() => goMatchmaking()} onCreate={() => router.push('/race/create')} />
        </View>

        <View style={styles.section}>
          <QuickRaceRow options={QUICK_RACES} onSelect={goMatchmaking} />
        </View>

        <View style={styles.section}>
          <MissionCard
            title="משימה יומית"
            description="השלם מרוץ חי אחד היום"
            progress={0}
            target={1}
            xpReward={120}
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  section: {
    marginTop: spacing.lg,
  },
  bottomSpacer: {
    height: spacing.lg,
  },
});
