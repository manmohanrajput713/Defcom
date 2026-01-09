import '@/lib/crypto-polyfill';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Only import CallProvider on native platforms (WebRTC doesn't work on web)
let CallProvider: React.ComponentType<{ children: React.ReactNode }> | null = null;
let IncomingCallModal: React.ComponentType | null = null;

if (Platform.OS !== 'web') {
  CallProvider = require('@/contexts/CallContext').CallProvider;
  IncomingCallModal = require('@/components/IncomingCallModal').default;
}

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const protectedSegments = ['(tabs)', 'chat', 'call'];
    const currentRoot = segments[0];
    const inAuthGroup =
      typeof currentRoot === 'string' && protectedSegments.includes(currentRoot);

    if (!session && inAuthGroup) {
      router.replace('/login');
    } else if (session && !inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, loading, segments]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="verify-otp" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="call/[id]" />
        <Stack.Screen name="+not-found" />
      </Stack>
      {IncomingCallModal && <IncomingCallModal />}
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  // Wrap with CallProvider only on native platforms
  const content = (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );

  if (CallProvider) {
    return (
      <AuthProvider>
        <CallProvider>
          <RootLayoutNav />
        </CallProvider>
      </AuthProvider>
    );
  }

  return content;
}

