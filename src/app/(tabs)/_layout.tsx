import { Tabs } from 'expo-router';
import { AppIcon } from '@/components/app-icon';
import { useAppTheme } from '@/providers/app-provider';
export default function TabLayout() {
  const { colors } = useAppTheme();
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.accent, tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, paddingTop: 9 }, tabBarLabelStyle: { fontSize: 11, fontWeight: '600' }, sceneStyle: { backgroundColor: colors.background } }}>
    <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: ({ color }) => <AppIcon name="home" color={color} /> }} />
    <Tabs.Screen name="care" options={{ title: 'Care', tabBarIcon: ({ color }) => <AppIcon name="care" color={color} /> }} />
    <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color }) => <AppIcon name="settings" color={color} /> }} />
    <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <AppIcon name="profile" color={color} /> }} />
  </Tabs>;
}
