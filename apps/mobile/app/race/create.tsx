import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { useRaceStore } from '@/store/raceStore';
import { RACE_DISTANCE_PRESETS } from '@runrace/shared';
import { colors, spacing } from '@/theme/colors';

export default function CreateRaceScreen() {
  const { createRace } = useRaceStore();
  const [selected, setSelected] = useState(5000);
  const [busy, setBusy] = useState(false);

  const onCreate = async () => {
    setBusy(true);
    try {
      const race = await createRace({
        type: 'distance',
        targetDistanceM: selected,
        visibility: 'private',
        maxParticipants: 16,
      });
      router.push({ pathname: '/race/lobby', params: { code: race.code } });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Private Race</Text>
      {RACE_DISTANCE_PRESETS.map((p) => (
        <Button
          key={p.meters}
          title={p.label}
          variant={selected === p.meters ? 'primary' : 'ghost'}
          onPress={() => setSelected(p.meters)}
          style={{ marginBottom: spacing.sm }}
        />
      ))}
      <Button title="Create & Share Code" onPress={onCreate} disabled={busy} style={{ marginTop: spacing.lg }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg, paddingTop: 56 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', marginBottom: spacing.lg },
});
