import { ProfileSync } from '@/components/profile-sync';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { AppProvider, useAppTheme } from '@/providers/app-provider';
import { BackendProvider, useBackend } from '@/providers/backend-provider';
function Navigation() {
  const { colors } = useAppTheme(); const { session, ready } = useBackend();
  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.accent} /></View>;
  const complete = !!session?.user.profileComplete;
  return <><StatusBar style={colors.dark ? 'light' : 'dark'} /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}><Stack.Screen name="index" /><Stack.Protected guard={!session}><Stack.Screen name="login" /><Stack.Screen name="register" /></Stack.Protected><Stack.Protected guard={!!session && !complete}><Stack.Screen name="complete-profile" /></Stack.Protected><Stack.Protected guard={!!session && complete}><Stack.Screen name="(tabs)" /><Stack.Screen name="wallet" /><Stack.Screen name="checkup" /><Stack.Screen name="medications" /><Stack.Screen name="lab-tests" /><Stack.Screen name="explore" /></Stack.Protected></Stack></>;
}
export default function RootLayout() { return <AppProvider><BackendProvider><ProfileSync /><Navigation /></BackendProvider></AppProvider>; }
