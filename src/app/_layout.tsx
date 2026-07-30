import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { 
  useFonts, 
  Inter_100Thin, 
  Inter_400Regular, 
  Inter_600SemiBold, 
  Inter_700Bold 
} from "@expo-google-fonts/inter";
import "../../global.css";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
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

  if (!loaded && !error) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
