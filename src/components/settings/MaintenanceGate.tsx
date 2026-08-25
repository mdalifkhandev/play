import { ActivityIndicator, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { usePublicPlatformSettingsQuery } from '../../api/settings';

export function MaintenanceGate() {
  const query = usePublicPlatformSettingsQuery();
  const settings = query.data;

  if (query.isLoading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#A3FF12" />
      </View>
    );
  }

  if (settings?.maintenanceMode) {
    return (
      <View className="flex-1 bg-black px-8 items-center justify-center">
        <View className="w-20 h-20 rounded-full bg-[#A3FF12] items-center justify-center mb-6">
          <Ionicons name="warning-outline" size={42} color="#000" />
        </View>
        <Text className="text-white text-2xl font-inter-bold text-center mb-3">Maintenance mode</Text>
        <Text className="text-[#A0A0A0] text-base font-inter text-center leading-6">
          {settings.maintenanceMessage || 'Play is under maintenance. Please try again soon.'}
        </Text>
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
