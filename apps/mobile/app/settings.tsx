import { StyleSheet, Switch, Text, View } from 'react-native';
import { useState } from 'react';
import { colors, spacing } from '@/theme/colors';

export default function SettingsScreen() {
  const [ghostMode, setGhostMode] = useState(false);
  const [voiceChat, setVoiceChat] = useState(true);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Row label="Ghost race overlay" value={ghostMode} onChange={setGhostMode} />
      <Row label="Voice chat in races" value={voiceChat} onChange={setVoiceChat} />
      <Text style={styles.note}>Wearable sync: Apple Health, Google Fit, Garmin (coming soon)</Text>
    </View>
  );
}

function Row({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.neon }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg, paddingTop: 56 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', marginBottom: spacing.lg },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  label: { color: colors.text },
  note: { color: colors.textMuted, marginTop: spacing.lg, lineHeight: 20 },
});
