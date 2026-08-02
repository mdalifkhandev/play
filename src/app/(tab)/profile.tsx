import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { ProfileInfo } from '../../components/profile/ProfileInfo';
import { CreatorCard } from '../../components/profile/CreatorCard';
import { CreatorTools } from '../../components/profile/CreatorTools';
import { ProfileTabs } from '../../components/profile/ProfileTabs';

import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
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
          <View className="mx-4 my-6 bg-[#151515] rounded-xl flex-row items-center justify-between p-5 border border-[#333]">
            <View>
              <Text className="text-white text-[18px] font-bold">Creator Dashboard</Text>
              <Text className="text-[#888] text-[13px] mt-1">Monitor your growth and earnings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </View>
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
