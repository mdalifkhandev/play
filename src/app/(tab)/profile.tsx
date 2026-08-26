import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CreatorCard } from '../../components/profile/CreatorCard';
import { CreatorTools } from '../../components/profile/CreatorTools';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { ProfileInfo } from '../../components/profile/ProfileInfo';
import { ProfileTabs } from '../../components/profile/ProfileTabs';
import { AnnouncementNotice } from '../../components/announcements/AnnouncementNotice';

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { MyProfileSummaryData } from '../../api/profile/profile.types';
import type { CreatorEligibility } from '../../api/creators';
import { handleApiError } from '../../api/client';
import {
  useCreatorEligibilityQuery,
  useMyLikedReelsQuery,
  useMyProfileSummaryQuery,
  useMyReelsQuery,
  useMySavedReelsQuery,
} from '../../api/profile/profile.query';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeLoadedTabs, setActiveLoadedTabs] = useState({ grid: true, bookmark: false, heart: false });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [announcementRefreshKey, setAnnouncementRefreshKey] = useState(0);
  const profileQuery = useMyProfileSummaryQuery();
  const creatorEligibilityQuery = useCreatorEligibilityQuery();
  const postsQuery = useMyReelsQuery(activeLoadedTabs.grid);
  const savedPostsQuery = useMySavedReelsQuery(activeLoadedTabs.bookmark);
  const likedPostsQuery = useMyLikedReelsQuery(activeLoadedTabs.heart);
  const posts = useMemo(() => postsQuery.data?.items || [], [postsQuery.data?.items]);
  const savedPosts = useMemo(() => savedPostsQuery.data?.items || [], [savedPostsQuery.data?.items]);
  const likedPosts = useMemo(() => likedPostsQuery.data?.items || [], [likedPostsQuery.data?.items]);
  const profileData = useMemo<MyProfileSummaryData | null>(() => {
    const data = profileQuery.data;
    if (!data) return null;

    return {
      ...data,
      stats: {
        ...data.stats,
        reelsCount: posts.length,
        likesCount: posts.reduce((total, reel) => total + (reel.stats?.likes || 0), 0),
      },
    };
  }, [posts, profileQuery.data]);
  const creatorEligibility = creatorEligibilityQuery.data as CreatorEligibility | null | undefined;
  const isLoading = profileQuery.isLoading;
  const error = profileQuery.error
    ? handleApiError(profileQuery.error, 'Could not load profile.')
    : null;

  const handleRefresh = () => {
    setAnnouncementRefreshKey((current) => current + 1);
    setIsRefreshing(true);
    Promise.all([
      profileQuery.refetch(),
      creatorEligibilityQuery.refetch(),
      postsQuery.refetch(),
      activeLoadedTabs.bookmark ? savedPostsQuery.refetch() : Promise.resolve(),
      activeLoadedTabs.heart ? likedPostsQuery.refetch() : Promise.resolve(),
    ])
      .catch(refreshError => console.log('Profile refresh failed:', refreshError))
      .finally(() => setIsRefreshing(false));
  };

  const loadProfileTab = useCallback(async (tab: 'grid' | 'bookmark' | 'heart') => {
    setActiveLoadedTabs(current => ({ ...current, [tab]: true }));
  }, []);

  useEffect(() => {
    const tabError = postsQuery.error || savedPostsQuery.error || likedPostsQuery.error;
    if (tabError) {
      console.log('Profile tab load failed:', handleApiError(tabError, 'Could not load profile tab.'));
    }
  }, [likedPostsQuery.error, postsQuery.error, savedPostsQuery.error]);

  const user = profileData?.user;
  const profile = user?.profile;
  const displayName = profile?.displayName || profile?.username || user?.email?.split('@')[0] || 'User';
  const username = profile?.username || user?.email?.split('@')[0] || 'user';
  const isCreatorMonetized = Boolean(creatorEligibility?.isCreator || creatorEligibility?.status === 'approved');

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <ProfileHeader />
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#98FF2F"
            colors={["#98FF2F"]}
          />
        }
      >
        <View className="pt-4">
          <AnnouncementNotice placement="profile_notice" refreshKey={announcementRefreshKey} />
        </View>

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
            isPremium={Boolean(user?.subscription?.isPremium)}
          />
        )}

        {error && (
          <Text className="text-red-400 text-center text-sm mt-4 px-4">{error}</Text>
        )}

        {isCreatorMonetized ? (
          <>
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
            <CreatorTools />
          </>
        ) : (
          <CreatorCard eligibility={creatorEligibility ?? null} />
        )}

        <ProfileTabs
          posts={posts}
          savedPosts={savedPosts}
          likedPosts={likedPosts}
          isLoadingPosts={postsQuery.isLoading || postsQuery.isFetching}
          isLoadingSavedPosts={savedPostsQuery.isLoading || savedPostsQuery.isFetching}
          isLoadingLikedPosts={likedPostsQuery.isLoading || likedPostsQuery.isFetching}
          onTabChange={loadProfileTab}
        />
      </ScrollView>
    </View>
  );
}
