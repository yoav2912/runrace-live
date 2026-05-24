import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { useRaceStore } from '@/store/raceStore';
import { colors, spacing } from '@/theme/colors';

export default function LobbyScreen() {
  const { distance } = useLocalSearchParams<{ distance?: string }>();
  const { joinByCode } = useRaceStore();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const matchmake = () => {
    router.push({
      pathname: '/race/matchmaking',
      params: distance ? { distance: String(distance) } : {},
    });
  };

  const join = async () => {
    setBusy(true);
    try {
      await joinByCode(code.trim().toUpperCase());
      router.push('/(tabs)/live');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Race Lobby</Text>
      <Button title="מצא מרוץ" onPress={matchmake} />
      <Text style={styles.or}>— or join with code —</Text>
      <TextInput
        style={styles.input}
        placeholder="RACE CODE"
        placeholderTextColor={colors.textMuted}
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
      />
      <Button title="Join Race" onPress={join} disabled={busy || code.length < 4} variant="ghost" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg, paddingTop: 56 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', marginBottom: spacing.lg },
  or: { color: colors.textMuted, textAlign: 'center', marginVertical: spacing.lg },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: spacing.md,
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
