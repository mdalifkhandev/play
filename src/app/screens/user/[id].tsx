import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { handleApiError } from '../../../api/client';
import {
  followUser,
  getPublicProfileData,
  getPublicProfileDataByUsername,
  unfollowUser,
} from '../../../api/profile/profile.api';
import type { PublicProfileData } from '../../../api/profile/profile.types';
import { ProfileInfo } from '../../../components/profile/ProfileInfo';
import { ProfileTabs } from '../../../components/profile/ProfileTabs';
import { ReportSheet } from '../../../components/moderation/ReportSheet';
import { useAppStore } from '../../../store';

const objectIdPattern = /^[a-f\d]{24}$/i;

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profileData, setProfileData] = useState<PublicProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowBusy, setIsFollowBusy] = useState(false);
  const [isReportSheetOpen, setIsReportSheetOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const currentUser = useAppStore((state: any) => state.user);

  useEffect(() => {
    const profileKey = id ? decodeURIComponent(id).replace(/^@/, '').toLowerCase() : '';
    const currentUsername = currentUser?.profile?.username?.toLowerCase();
    if (
      id &&
      currentUser?.id &&
      (id === currentUser.id || (currentUsername && profileKey === currentUsername))
    ) {
      router.replace('/(tab)/profile');
    }
  }, [id, currentUser?.id, currentUser?.profile?.username, router]);

  const loadProfile = useCallback(async (refresh = false) => {
    if (!id) return;

    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const profileKey = decodeURIComponent(id);
      const data = objectIdPattern.test(profileKey)
        ? await getPublicProfileData(profileKey)
        : await getPublicProfileDataByUsername(profileKey.replace(/^@/, ''));

      if (currentUser?.id && data.user.id === currentUser.id) {
        router.replace('/(tab)/profile');
        return;
      }

      setProfileData(data);
      setIsFollowing(data.followState.isFollowing);
      setError(null);
    } catch (profileError) {
      setError(handleApiError(profileError, 'Could not load profile.'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentUser?.id, id, router]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleFollowToggle = async () => {
    const targetUserId = profileData?.user.id || id;
    if (!targetUserId || isFollowBusy) return;

    const nextFollowing = !isFollowing;
    const previousFollowing = isFollowing;
    setIsFollowBusy(true);
    setIsFollowing(nextFollowing);

    try {
      const result = nextFollowing ? await followUser(targetUserId) : await unfollowUser(targetUserId);
      setIsFollowing(result.isFollowing);
      setProfileData(current => current
        ? {
            ...current,
            stats: {
              ...current.stats,
              followersCount: result.followersCount,
              followingCount: result.followingCount,
            },
            followState: result,
          }
        : current);
    } catch (followError) {
      setIsFollowing(previousFollowing);
      setError(handleApiError(followError, nextFollowing ? 'Failed to follow user.' : 'Failed to unfollow user.'));
    } finally {
      setIsFollowBusy(false);
    }
  };

  const user = profileData?.user;
  const profile = user?.profile;
  const displayName = profile?.displayName || profile?.username || user?.email?.split('@')[0] || 'User';
  const username = profile?.username || user?.email?.split('@')[0] || 'user';

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <View className="h-14 flex-row items-center justify-between px-4">
        <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-white/10" onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </Pressable>
        <Text numberOfLines={1} className="flex-1 px-3 text-center text-white text-lg font-inter-bold">
          {displayName}
        </Text>
        {profileData?.user.id ? (
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
            onPress={() => setIsReportSheetOpen(true)}
          >
            <Ionicons name="flag-outline" size={20} color="#FFF" />
          </Pressable>
        ) : (
          <View className="h-10 w-10" />
        )}
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadProfile(true)}
            tintColor="#98FF2F"
            colors={['#98FF2F']}
          />
        }
      >
        {isLoading && !profileData ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#98FF2F" />
          </View>
        ) : error && !profileData ? (
          <View className="py-20 items-center justify-center px-6">
            <Ionicons name="alert-circle-outline" size={42} color="#EF4444" />
            <Text className="mt-4 text-center text-white text-base font-inter-bold">Profile could not be loaded</Text>
            <Text className="mt-2 text-center text-gray-400 text-sm">{error}</Text>
          </View>
        ) : (
          <>
            <ProfileInfo
              avatarUrl={profile?.photoUrl}
              displayName={displayName}
              username={username}
              bio={profile?.bio}
              followingCount={profileData?.stats.followingCount}
              followersCount={profileData?.stats.followersCount}
              likesCount={profileData?.stats.likesCount}
              isPremium={Boolean(user?.subscription?.isPremium)}
            />

            <Pressable
              className={`mx-6 mt-6 h-11 items-center justify-center rounded-full border ${isFollowing ? 'bg-white/10 border-white/30' : 'bg-[#98FF2F] border-[#98FF2F]'}`}
              onPress={handleFollowToggle}
              disabled={isFollowBusy}
            >
              <Text className={`text-sm font-inter-bold ${isFollowing ? 'text-white' : 'text-black'}`}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </Pressable>

            <ProfileTabs posts={profileData?.reels || []} showPrivateTabs={false} />
          </>
        )}
        {error && profileData && (
          <Text className="text-red-400 text-center text-sm mt-4 px-4">{error}</Text>
        )}
      </ScrollView>
      <ReportSheet
        visible={isReportSheetOpen}
        targetType="profile"
        targetId={profileData?.user.id}
        title="Report profile"
        onClose={() => setIsReportSheetOpen(false)}
      />
    </View>
  );
}
