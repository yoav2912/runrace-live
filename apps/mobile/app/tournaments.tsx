import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { colors, spacing } from '@/theme/colors';

export default function TournamentsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tournaments</Text>
      <Card>
        <Text style={styles.cardTitle}>Weekend Elite Cup</Text>
        <Text style={styles.sub}>Entry fee architecture ready · Sponsored prizes</Text>
        <Text style={styles.badge}>KYC required for cash prizes</Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg, paddingTop: 56 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', marginBottom: spacing.lg },
  cardTitle: { color: colors.text, fontWeight: '800', fontSize: 18 },
  sub: { color: colors.textMuted, marginTop: 6 },
  badge: { color: colors.gold, marginTop: spacing.md, fontWeight: '700' },
});
