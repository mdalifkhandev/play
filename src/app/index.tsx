import { Redirect } from "expo-router";
import { useAppStore } from "../store";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    useAppStore.persist.onFinishHydration(() => setIsHydrated(true));
    setIsHydrated(useAppStore.persist.hasHydrated());
  }, []);

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#121212" }}>
        <ActivityIndicator size="large" color="#98D83A" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/home" />;
  }

  return <Redirect href="/(auth)/onboarding" />;
}
