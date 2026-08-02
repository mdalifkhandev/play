import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CreatorCard } from '../../components/profile/CreatorCard';
import { CreatorTools } from '../../components/profile/CreatorTools';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { ProfileInfo } from '../../components/profile/ProfileInfo';
import { ProfileTabs } from '../../components/profile/ProfileTabs';

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const isCreator = params.creatorMode === 'true';

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <ProfileHeader />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        <ProfileInfo />

        {isCreator ? (
          <Pressable
            onPress={() => router.push('/screens/menu/analytic')}
            className="mx-4 my-6 bg-[#151515] rounded-xl flex-row items-center justify-between p-5 border border-[#333]"
          >
            <View>
              <Text className="text-white text-[18px] font-bold">Creator Dashboard</Text>
              <Text className="text-[#888] text-[13px] mt-1">Monitor your growth and earnings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </Pressable>
        ) : (
          <>
            <CreatorCard />
            <CreatorTools />
          </>
        )}

        <ProfileTabs />
      </ScrollView>
    </View>
  );
}
