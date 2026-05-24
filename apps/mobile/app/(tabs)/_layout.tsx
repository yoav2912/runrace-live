import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.neon,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="live"
        options={{ title: 'Live', tabBarIcon: ({ color, size }) => <Ionicons name="radio" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="rankings"
        options={{ title: 'Rank', tabBarIcon: ({ color, size }) => <Ionicons name="trophy" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="social"
        options={{ title: 'Social', tabBarIcon: ({ color, size }) => <Ionicons name="people" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} /> }}
      />
    </Tabs>
  );
}
