import { ActivityIndicator, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { usePublicPlatformSettingsQuery, type PublicPlatformSettings } from '../../api/settings';

type FeatureKey = keyof PublicPlatformSettings['featureFlags'];

export function usePlatformFeature(feature: FeatureKey) {
  const query = usePublicPlatformSettingsQuery();
  return {
    ...query,
    enabled: query.data?.featureFlags?.[feature] !== false,
  };
}

export function FeatureGuard({
  feature,
  title,
  children,
}: {
  feature: FeatureKey;
  title: string;
  children: React.ReactNode;
}) {
  const query = usePublicPlatformSettingsQuery();

  if (query.isLoading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#A3FF12" />
      </View>
    );
  }

  if (query.data?.featureFlags?.[feature] === false) {
    return (
      <View className="flex-1 bg-black px-8 items-center justify-center">
        <View className="w-20 h-20 rounded-full bg-white/10 items-center justify-center mb-5">
          <Ionicons name="lock-closed-outline" size={34} color="#A3FF12" />
        </View>
        <Text className="text-white text-2xl font-inter-bold text-center mb-3">{title}</Text>
        <Text className="text-[#A0A0A0] text-base font-inter text-center leading-6">
          This feature is currently disabled by admin.
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}
