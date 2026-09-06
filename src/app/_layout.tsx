import { useRouter, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
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
import { StripeProvider } from '@stripe/stripe-react-native';
import { useAppStore } from "../store";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { useRegisterPushNotifications } from "../hooks/notifications/useRegisterPushNotifications";
import { MaintenanceGate } from "../components/settings/MaintenanceGate";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const defaultErrorHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
  console.error('Unhandled JS Exception:', error);
  defaultErrorHandler(error, isFatal);
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const isKidsModeActive = useAppStore((state) => state.isKidsModeActive);
  const kidsModeExpireTimestamp = useAppStore((state) => state.kidsModeExpireTimestamp);
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const token = useAppStore((state) => state.token);
  const user = useAppStore((state) => state.user);
  const userId = user?.id || user?._id || null;
  const [fontWaitExpired, setFontWaitExpired] = useState(false);

  useRegisterPushNotifications(hasHydrated && isAuthenticated && Boolean(token), userId);

  const [loaded, error] = useFonts({
    Inter_100Thin,
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFontWaitExpired(true);
    }, 1200);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if ((loaded || error || fontWaitExpired) && hasHydrated) {
      SplashScreen.hideAsync();
    }
  }, [fontWaitExpired, hasHydrated, loaded, error]);

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

  if ((!loaded && !error && !fontWaitExpired) || !hasHydrated) {
    return null;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <StripeProvider
            publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_not_configured'}
            merchantIdentifier={process.env.EXPO_PUBLIC_APPLE_MERCHANT_ID || 'merchant.com.anonymous.play'}
          >
            <StatusBar style="light" />
            <MaintenanceGate />
            <Toaster />
          </StripeProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
