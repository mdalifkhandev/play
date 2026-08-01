import React from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { ProfileInfo } from '../../components/profile/ProfileInfo';
import { CreatorCard } from '../../components/profile/CreatorCard';
import { CreatorTools } from '../../components/profile/CreatorTools';
import { ProfileTabs } from '../../components/profile/ProfileTabs';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <ProfileHeader />
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        <ProfileInfo />
        <CreatorCard />
        <CreatorTools />
        <ProfileTabs />
      </ScrollView>
    </View>
  );
}
