import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme/colors';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  style?: ViewStyle;
  disabled?: boolean;
}

export function Button({ title, onPress, variant = 'primary', style, disabled }: Props) {
  if (variant === 'primary') {
    return (
      <Pressable onPress={onPress} disabled={disabled} style={[styles.wrap, style, disabled && styles.disabled]}>
        <LinearGradient colors={['#00F5A0', '#00D4FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
          <Text style={styles.primaryText}>{title}</Text>
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.ghost,
        variant === 'danger' && styles.danger,
        style,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.ghostText, variant === 'danger' && styles.dangerText]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 14, overflow: 'hidden' },
  gradient: { paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center' },
  primaryText: { color: '#041018', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
  ghost: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.bgCard,
  },
  ghostText: { color: colors.text, fontWeight: '700', fontSize: 15 },
  danger: { borderColor: colors.danger },
  dangerText: { color: colors.danger },
  disabled: { opacity: 0.5 },
});
