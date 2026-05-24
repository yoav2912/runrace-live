import { StyleSheet, Text, View } from 'react-native';
import { TRUST_RULES_HE } from '@runrace/shared';
import { Card } from '@/components/ui/Card';
import { colors, spacing } from '@/theme/colors';

export function TrustRulesCard() {
  return (
    <Card style={styles.card}>
      <Text style={styles.title}>איך ציון האמון יורד?</Text>
      <Text style={styles.intro}>
        ציון האמון (0–100) יורד כשהשרת מזהה תנועה חשודה במירוץ live. 3 אזהרות באותו מירוץ →
        פסילה.
      </Text>
      {TRUST_RULES_HE.map((rule) => (
        <View key={rule.title} style={styles.row}>
          <Text style={styles.ruleTitle}>{rule.title}</Text>
          <Text style={styles.ruleDetail}>{rule.detail}</Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  title: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: spacing.sm },
  intro: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginBottom: spacing.md },
  row: { marginBottom: spacing.sm },
  ruleTitle: { color: colors.neon, fontSize: 13, fontWeight: '700' },
  ruleDetail: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 2 },
});
