import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/theme/colors';

interface Props {
  onMatchmaking: () => void;
  onCreate: () => void;
}

export function LiveRaceHero({ onMatchmaking, onCreate }: Props) {
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={['rgba(0,245,160,0.18)', 'rgba(0,212,255,0.08)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.glow}
      />

      <View style={styles.content}>
        <View style={styles.liveTag}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE NOW</Text>
        </View>

        <Text style={styles.title}>הצטרף למרוץ חי</Text>
        <Text style={styles.sub}>התאמה מהירה מול רצים אמיתיים · GPS בזמן אמת</Text>

        <Pressable onPress={onMatchmaking} style={({ pressed }) => [pressed && styles.pressed]}>
          <LinearGradient colors={['#00F5A0', '#00D4FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryBtn}>
            <Ionicons name="flash" size={20} color="#041018" />
            <Text style={styles.primaryText}>מצא מרוץ</Text>
          </LinearGradient>
        </Pressable>

        <Pressable onPress={onCreate} style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
          <Ionicons name="people-outline" size={18} color={colors.textMuted} />
          <Text style={styles.secondaryText}>מרוץ פרטי עם חברים</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    overflow: 'hidden',
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    padding: spacing.lg,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  liveText: {
    color: colors.neon,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  sub: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: spacing.lg,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  primaryText: {
    color: '#041018',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.sm,
    paddingVertical: 14,
  },
  secondaryText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  pressed: { opacity: 0.85 },
});
