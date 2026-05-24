import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { RacerState } from '@runrace/shared';
import { Button } from '@/components/ui/Button';
import { colors, spacing } from '@/theme/colors';

interface Props {
  opponent: RacerState | undefined;
  me: RacerState | undefined;
  myProfile?: { username: string; avatarUrl?: string };
  iAmReady: boolean;
  onReady: () => void;
  readyLoading?: boolean;
}

function Avatar({ name, uri, size = 72 }: { name: string; uri?: string; size?: number }) {
  const initial = (name[0] ?? '?').toUpperCase();
  if (uri) {
    return <Image source={{ uri }} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} />;
  }
  return (
    <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarInitial, { fontSize: size * 0.38 }]}>{initial}</Text>
    </View>
  );
}

function ReadyBadge({ ready, label }: { ready: boolean; label: string }) {
  return (
    <View style={[styles.readyBadge, ready ? styles.readyBadgeOn : styles.readyBadgeOff]}>
      <Ionicons name={ready ? 'checkmark-circle' : 'time-outline'} size={14} color={ready ? colors.neon : colors.textMuted} />
      <Text style={[styles.readyBadgeText, ready && styles.readyBadgeTextOn]}>{label}</Text>
    </View>
  );
}

export function MatchFoundLobby({
  opponent,
  me,
  myProfile,
  iAmReady,
  onReady,
  readyLoading,
}: Props) {
  const opponentName = opponent?.username ?? 'יריב';
  const myName = me?.username ?? myProfile?.username ?? 'אתה';
  const opponentReady = opponent?.ready ?? false;

  return (
    <View style={styles.container}>
      <View style={styles.matchTag}>
        <Ionicons name="flash" size={16} color={colors.neon} />
        <Text style={styles.matchTagText}>MATCH FOUND</Text>
      </View>
      <Text style={styles.title}>נמצא יריב!</Text>
      <Text style={styles.sub}>לחץ מוכן כשאתה מוכן להתחיל</Text>

      <View style={styles.vsRow}>
        <View style={styles.playerCol}>
          <Avatar name={myName} uri={me?.avatarUrl ?? myProfile?.avatarUrl} />
          <Text style={styles.playerName} numberOfLines={1}>
            {myName}
          </Text>
          <Text style={styles.playerLabel}>אתה</Text>
          <ReadyBadge ready={iAmReady} label={iAmReady ? 'מוכן' : 'לא מוכן'} />
        </View>

        <Text style={styles.vs}>VS</Text>

        <View style={styles.playerCol}>
          <Avatar name={opponentName} uri={opponent?.avatarUrl} />
          <Text style={styles.playerName} numberOfLines={1}>
            {opponentName}
          </Text>
          <Text style={styles.playerLabel}>יריב</Text>
          <ReadyBadge
            ready={opponentReady}
            label={opponentReady ? 'מוכן' : 'ממתין...'}
          />
        </View>
      </View>

      {!iAmReady ? (
        <Button
          title="אני מוכן!"
          onPress={onReady}
          disabled={readyLoading}
          style={styles.readyBtn}
        />
      ) : (
        <View style={styles.waitingBox}>
          <Text style={styles.waitingText}>
            {opponentReady ? 'שניכם מוכנים — מתחילים בקרוב...' : 'ממתין שהיריב ילחץ מוכן...'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  matchTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,245,160,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0,245,160,0.35)',
    marginBottom: spacing.md,
  },
  matchTagText: {
    color: colors.neon,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
  sub: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  vsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.xl,
    width: '100%',
  },
  playerCol: {
    flex: 1,
    alignItems: 'center',
    maxWidth: 140,
  },
  vs: {
    color: colors.textMuted,
    fontSize: 18,
    fontWeight: '900',
    opacity: 0.6,
  },
  playerName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  playerLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  avatar: {
    borderWidth: 2,
    borderColor: colors.neon,
  },
  avatarFallback: {
    backgroundColor: colors.bgElevated,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: colors.neon,
    fontWeight: '900',
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  readyBadgeOn: {
    borderColor: 'rgba(0,245,160,0.5)',
    backgroundColor: 'rgba(0,245,160,0.1)',
  },
  readyBadgeOff: {
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  readyBadgeText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  readyBadgeTextOn: {
    color: colors.neon,
  },
  readyBtn: {
    width: '100%',
    marginTop: spacing.md,
  },
  waitingBox: {
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
  },
  waitingText: {
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
});
