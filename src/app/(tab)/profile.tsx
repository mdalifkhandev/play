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
import { getMyLikedReels, getMyProfileSummary, getMyReels, getMySavedReels } from '../../api/profile/profile.api';
import type { MyProfileSummaryData } from '../../api/profile/profile.types';
import { getCreatorEligibility, type CreatorEligibility } from '../../api/creators';
import { handleApiError } from '../../api/client';
import type { ReelFeedItem } from '../../api/reels/reels.types';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const isCreator = params.creatorMode === 'true';
  const [profileData, setProfileData] = useState<MyProfileSummaryData | null>(null);
  const [creatorEligibility, setCreatorEligibility] = useState<CreatorEligibility | null>(null);
  const [posts, setPosts] = useState<ReelFeedItem[]>([]);
  const [savedPosts, setSavedPosts] = useState<ReelFeedItem[]>([]);
  const [likedPosts, setLikedPosts] = useState<ReelFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingTabs, setLoadingTabs] = useState({ grid: false, bookmark: false, heart: false });
  const [loadedTabs, setLoadedTabs] = useState({ grid: false, bookmark: false, heart: false });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const data = await getMyProfileSummary();

      setProfileData(data);
      getCreatorEligibility()
        .then(setCreatorEligibility)
        .catch(creatorError => console.log('Creator eligibility load failed:', creatorError?.message ?? creatorError));
      setError(null);
      if (refresh) {
        setPosts([]);
        setSavedPosts([]);
        setLikedPosts([]);
        setLoadedTabs({ grid: false, bookmark: false, heart: false });
      }
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

  const loadProfileTab = useCallback(async (tab: 'grid' | 'bookmark' | 'heart') => {
    if (loadedTabs[tab] || loadingTabs[tab]) return;

    setLoadingTabs(current => ({ ...current, [tab]: true }));

    try {
      if (tab === 'grid') {
        const response = await getMyReels();
        const items = response.items || [];
        setPosts(items);
        setProfileData(current => current ? {
          ...current,
          stats: {
            ...current.stats,
            reelsCount: items.length,
            likesCount: items.reduce((total, reel) => total + (reel.stats?.likes || 0), 0),
          },
        } : current);
      } else if (tab === 'bookmark') {
        const response = await getMySavedReels();
        setSavedPosts(response.items || []);
      } else {
        const response = await getMyLikedReels();
        setLikedPosts(response.items || []);
      }

      setLoadedTabs(current => ({ ...current, [tab]: true }));
    } catch (tabError) {
      console.log('Profile tab load failed:', handleApiError(tabError, 'Could not load profile tab.'));
    } finally {
      setLoadingTabs(current => ({ ...current, [tab]: false }));
    }
  }, [loadedTabs, loadingTabs]);

  useEffect(() => {
    if (profileData && !loadedTabs.grid && !loadingTabs.grid) {
      void loadProfileTab('grid');
    }
  }, [loadProfileTab, loadedTabs.grid, loadingTabs.grid, profileData]);

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
            isPremium={Boolean(user?.subscription?.isPremium)}
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
            {isCreatorMonetized ? <CreatorTools /> : null}
          </>
        )}

        <ProfileTabs
          posts={posts}
          savedPosts={savedPosts}
          likedPosts={likedPosts}
          isLoadingPosts={loadingTabs.grid}
          isLoadingSavedPosts={loadingTabs.bookmark}
          isLoadingLikedPosts={loadingTabs.heart}
          onTabChange={loadProfileTab}
        />
      </ScrollView>
    </View>
  );
}
