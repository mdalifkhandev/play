import { Stack, useRouter, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { 
  useFonts, 
  Inter_100Thin, 
  Inter_400Regular, 
  Inter_600SemiBold, 
  Inter_700Bold 
} from "@expo-google-fonts/inter";
import { Toaster } from 'sonner-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import "../../global.css";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from "../store";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const isKidsModeActive = useAppStore((state) => state.isKidsModeActive);
  const kidsModeExpireTimestamp = useAppStore((state) => state.kidsModeExpireTimestamp);

  const [loaded, error] = useFonts({
    Inter_100Thin,
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // Kids Mode Watchdog Timer
  useEffect(() => {
    if (!isKidsModeActive || !kidsModeExpireTimestamp) return;

    const checkTime = () => {
      if (Date.now() >= kidsModeExpireTimestamp) {
        // Prevent redirect loop if already on the time-up screen or trying to enter a PIN
        const isUnlocking = 
          pathname.includes('/screens/kids-mode/time-up') ||
          pathname.includes('/screens/kids-mode/confirm-pin') ||
          pathname.includes('/screens/kids-mode/forgot-pin') ||
          pathname.includes('/screens/kids-mode/verify-otp') ||
          pathname.includes('/screens/kids-mode/reset-pin');
          
        if (!isUnlocking) {
          router.push('/screens/kids-mode/time-up');
        }
      }
    };

    // Check immediately
    checkTime();

    // Then check every 5 seconds
    const interval = setInterval(checkTime, 5000);

    return () => clearInterval(interval);
  }, [isKidsModeActive, kidsModeExpireTimestamp, router, pathname]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }} />
        <Toaster />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
