import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CreatorCard } from '../../components/profile/CreatorCard';
import { CreatorTools } from '../../components/profile/CreatorTools';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { ProfileInfo } from '../../components/profile/ProfileInfo';
import { ProfileTabs } from '../../components/profile/ProfileTabs';

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getMyProfileData } from '../../api/profile/profile.api';
import type { MyProfileData } from '../../api/profile/profile.types';
import { handleApiError } from '../../api/client';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const isCreator = params.creatorMode === 'true';
  const [profileData, setProfileData] = useState<MyProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const data = await getMyProfileData();
      setProfileData(data);
      setError(null);
    } catch (profileError) {
      setError(handleApiError(profileError, 'Could not load profile.'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const user = profileData?.user;
  const profile = user?.profile;
  const displayName = profile?.displayName || profile?.username || user?.email?.split('@')[0] || 'User';
  const username = profile?.username || user?.email?.split('@')[0] || 'user';

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <ProfileHeader />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadProfile(true)}
            tintColor="#98FF2F"
            colors={["#98FF2F"]}
          />
        }
      >
        {isLoading && !profileData ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#98FF2F" />
          </View>
        ) : (
          <ProfileInfo
            avatarUrl={profile?.photoUrl}
            displayName={displayName}
            username={username}
            bio={profile?.bio}
            followingCount={profileData?.stats.followingCount}
            followersCount={profileData?.stats.followersCount}
            likesCount={profileData?.stats.likesCount}
          />
        )}

        {error && (
          <Text className="text-red-400 text-center text-sm mt-4 px-4">{error}</Text>
        )}

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

        <ProfileTabs posts={profileData?.reels || []} />
      </ScrollView>
    </View>
  );
}
