import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

import { handleApiError } from '../../../api/client';
import { followUser, unfollowUser } from '../../../api/profile/profile.api';
import {
  getMyRewardDashboard,
  getTrendingCreators,
  type RewardDashboard,
  type TrendingCreator,
} from '../../../api/rewards/rewards.api';
import { avatarSource } from '../../../utils/avatar';

function compactNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number.isFinite(value) ? value : 0);
}

function rankColor(rank: number) {
  if (rank === 1) return '#F59E0B';
  if (rank === 2) return '#9CA3AF';
  if (rank === 3) return '#D97706';
  return '#6B7280';
}

export default function RewardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [dashboard, setDashboard] = useState<RewardDashboard | null>(null);
  const [creators, setCreators] = useState<TrendingCreator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [busyCreatorId, setBusyCreatorId] = useState<string | null>(null);

  const loadRewards = useCallback(async (refreshing = false) => {
    try {
      if (refreshing) setIsRefreshing(true);
      else setIsLoading(true);

      const [rewardDashboard, trendingCreators] = await Promise.all([
        getMyRewardDashboard(),
        getTrendingCreators(),
      ]);

      setDashboard(rewardDashboard);
      setCreators(trendingCreators || []);
    } catch (error) {
      console.error('Failed to load rewards:', error);
      toast.error(handleApiError(error, 'Reward data could not be loaded.'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRewards();
  }, [loadRewards]);

  const handleFollowPress = useCallback(async (creator: TrendingCreator) => {
    if (busyCreatorId) return;

    const previousCreators = creators;
    const nextFollowing = !creator.isFollowing;
    setBusyCreatorId(creator.id);
    setCreators((items) => items.map((item) => (
      item.id === creator.id
        ? {
            ...item,
            isFollowing: nextFollowing,
            followersCount: Math.max(0, item.followersCount + (nextFollowing ? 1 : -1)),
          }
        : item
    )));

    try {
      const result = nextFollowing ? await followUser(creator.id) : await unfollowUser(creator.id);
      setCreators((items) => items.map((item) => (
        item.id === creator.id
          ? { ...item, isFollowing: result.isFollowing, followersCount: result.followersCount }
          : item
      )));
    } catch (error) {
      setCreators(previousCreators);
      toast.error(handleApiError(error, nextFollowing ? 'Failed to follow creator.' : 'Failed to unfollow creator.'));
    } finally {
      setBusyCreatorId(null);
    }
  }, [busyCreatorId, creators]);

  const bottomInset = Math.max(insets.bottom, 20);

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-4 py-3 mt-4 mb-3">
        <View className="w-10 h-10 justify-center">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
        </View>
        <Text className="text-white text-base font-bold flex-1 text-center">Reward</Text>
        <View className="w-10 h-10 justify-center items-end">
          <Pressable className="pr-2 -mr-2">
            <Ionicons name="settings-outline" size={24} color="white" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottomInset + 96 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadRewards(true)} tintColor="#83D616" />}
      >
        <View className="bg-[#151515] border border-[#222] rounded-2xl p-5 mt-4 mb-6">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-white font-medium text-base">Analytic</Text>
            <Ionicons name="chevron-forward" size={20} color="white" />
          </View>

          {isLoading ? (
            <View className="py-5">
              <ActivityIndicator color="#83D616" />
            </View>
          ) : (
            <View className="flex-row justify-between pr-4">
              <View>
                <Text className="text-[#888] text-sm mb-1">Post views</Text>
                <Text className="text-white text-xl font-bold font-inter-bold mb-1">
                  {compactNumber(dashboard?.postViews ?? 0)}
                </Text>
                <Text className="text-[#888] text-xs">{compactNumber(dashboard?.periodStats.postViews ?? 0)} {dashboard?.period ?? '7d'}</Text>
              </View>
              <View>
                <Text className="text-[#888] text-sm mb-1">Net followers</Text>
                <Text className="text-white text-xl font-bold font-inter-bold mb-1">
                  {compactNumber(dashboard?.netFollowers ?? 0)}
                </Text>
                <Text className="text-[#888] text-xs">{dashboard?.period ?? '7d'}</Text>
              </View>
              <View>
                <Text className="text-[#888] text-sm mb-1">Likes</Text>
                <Text className="text-white text-xl font-bold font-inter-bold mb-1">
                  {compactNumber(dashboard?.likes ?? 0)}
                </Text>
                <Text className="text-[#888] text-xs">{compactNumber(dashboard?.periodStats.likes ?? 0)} {dashboard?.period ?? '7d'}</Text>
              </View>
            </View>
          )}

          {!isLoading && (
            <View className="mt-6 pt-5 border-t border-[#252525] flex-row justify-between">
              <View>
                <Text className="text-[#888] text-xs mb-1">Gift diamonds</Text>
                <Text className="text-white text-base font-inter-bold">{compactNumber(dashboard?.giftDiamonds ?? 0)}</Text>
              </View>
              <View className="items-end">
                <Text className="text-[#888] text-xs mb-1">Estimated reward</Text>
                <Text className="text-[#83D616] text-base font-inter-bold">
                  ${(dashboard?.estimatedEarningsUsd ?? 0).toFixed(2)}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View className="bg-[#151515] border border-[#222] rounded-2xl p-5 mb-6">
          <Text className="text-white font-medium text-base mb-6">Trending Creators</Text>

          {isLoading ? (
            <View className="py-8">
              <ActivityIndicator color="#83D616" />
            </View>
          ) : creators.length === 0 ? (
            <Text className="text-[#888] text-sm text-center py-8">No creators yet.</Text>
          ) : (
            creators.map((creator) => (
              <View key={creator.id} className="flex-row items-center mb-5">
                <View className="w-6 h-6 rounded-full items-center justify-center mr-3" style={{ backgroundColor: rankColor(creator.rank) }}>
                  <Text className="text-black font-bold text-xs">{creator.rank}</Text>
                </View>
                <Image source={avatarSource(creator.avatarUrl)} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }} />
                <View className="flex-1">
                  <Text className="text-white font-medium" numberOfLines={1}>{creator.name}</Text>
                  <Text className="text-[#888] text-xs">{compactNumber(creator.postViews)} View</Text>
                </View>
                <Pressable
                  onPress={() => handleFollowPress(creator)}
                  disabled={busyCreatorId === creator.id}
                  className={`px-5 py-1.5 rounded-lg ${creator.isFollowing ? 'bg-[#333]' : 'bg-[#83D616]'}`}
                >
                  <Text className={`font-semibold text-sm ${creator.isFollowing ? 'text-white' : 'text-black'}`}>
                    {creator.isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </Pressable>
              </View>
            ))
          )}

          <Pressable className="bg-[#333] py-3 rounded-xl items-center mt-2" onPress={() => loadRewards(true)}>
            <Text className="text-white font-medium text-sm">Get more inspiration</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View className="absolute left-6 right-6" style={{ bottom: bottomInset + 12 }}>
        <Pressable
          className="bg-[#83D616] py-4 rounded-xl flex-row items-center justify-center shadow-lg"
          onPress={() => router.push('/(tab)/create')}
        >
          <Ionicons name="videocam" size={20} color="black" />
          <Text className="text-black font-bold text-base ml-2">Start creating</Text>
        </Pressable>
      </View>
    </View>
  );
}
