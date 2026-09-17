import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getKidsFeed } from '../../api/reels/reels.api';
import { LiveGridItem } from '../../components/live/LiveGridItem';
import type { LiveStreamData } from '../../components/live/LiveGridItem';

const TopTab = ({ title, active }: { title: string; active?: boolean }) => (
  <View className={`pb-2 px-3 ${active ? 'border-b-2 border-[#98D83A]' : 'border-b-2 border-transparent'}`}>
    <Text className={`font-inter-medium ${active ? 'text-white' : 'text-gray-400'}`}>{title}</Text>
  </View>
);

const FilterChip = ({ title, active }: { title: string; active?: boolean }) => (
  <View className={`px-4 py-1.5 rounded-md mr-2 ${active ? 'bg-[#98D83A]' : 'bg-[#333]'}`}>
    <Text className={`text-sm font-inter-medium ${active ? 'text-black' : 'text-gray-300'}`}>{title}</Text>
  </View>
);

export default function KidsModeSearchScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [reels, setReels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchKidsFeed = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
      const data = await getKidsFeed();
      if (data && data.items) {
        setReels(data.items);
      }
    } catch (error) {
      console.error("Failed to load kids feed:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchKidsFeed();
  }, []);

  const mapReelToGridItem = (r: any): LiveStreamData => ({
    id: r.id,
    thumbnail: r.thumbnailUrl || '',
    badge: 'Video',
    title: r.caption || 'Video',
    hostName: r.user?.displayName || r.user?.username || r.owner?.displayName || r.owner?.username || 'User',
    hostAvatar: r.user?.avatarUrl || r.owner?.photoUrl || '',
    date: r.publishedAt ? new Date(r.publishedAt).toLocaleDateString() : (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''),
    likes: r.stats?.likes?.toString() || r.likeCount?.toString() || '0',
    isVideo: true,
    videoUrl: r.videoUrl || r.media?.processedUrl || r.media?.rawUrl || '',
    viewers: r.stats?.views?.toString() || r.viewCount?.toString() || '0',
  });

  return (
    <View className="flex-1 bg-[#121212]" style={{ paddingTop: insets.top }}>
      <View className="px-4 py-3">
        <View className="flex-row items-center bg-[#2A2A2A] rounded-full px-4 py-2">
          <Ionicons name="search" size={20} color="#888" className="mr-2" />
          <TextInput
            placeholder="Search fun videos..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-white text-base font-inter-regular p-0 h-8"
          />
        </View>
      </View>

      <View className="flex-row border-b border-[#222] px-2">
        <TopTab title="Top" active />
        <TopTab title="Video" />
        <TopTab title="Photo" />
        <TopTab title="Sound" />
        <TopTab title="Hashtags" />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="max-h-[36px] min-h-[36px] px-4 mt-4">
        <FilterChip title="All" active />
        <FilterChip title="Unwatch" />
        <FilterChip title="Wath" />
        <FilterChip title="Recent uploaded" />
      </ScrollView>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#98D83A" />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-2 mt-4"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchKidsFeed(true)}
              tintColor="#98D83A"
              colors={["#98D83A"]}
            />
          }
        >
          <View className="flex-row flex-wrap pb-20 justify-between">
            {reels.map((r: any) => (
              <LiveGridItem key={r.id} item={mapReelToGridItem(r)} variant="search" />
            ))}
            {reels.length === 0 && (
              <View className="flex-1 justify-center items-center py-20">
                <Ionicons name="videocam-outline" size={48} color="#555" />
                <Text className="text-[#888] font-inter-medium mt-4">No kids videos found</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
