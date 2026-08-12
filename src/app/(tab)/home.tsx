import { Image } from "expo-image";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, AppState, AppStateStatus, FlatList, Pressable, RefreshControl, Text, useWindowDimensions, View, ViewToken } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FeedItem, FeedItemProps } from "../../components/ui/FeedItem";
import { getFeed } from "../../api/reels/reels.api";
import { ReelFeedItem } from "../../api/reels/reels.types";
import { useFeedSection } from "../../hooks/feed/useFeedSection";

type FeedListItem = Omit<FeedItemProps, 'isActive' | 'shouldMountVideo'>;

function isImageUrl(url?: string | null): url is string {
  if (!url) return false;
  return !/\.(mp4|mov|m4v|webm)(\?|$)/i.test(url);
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return String(num);
}

function mapBackendReelToFeedItem(reel: ReelFeedItem): FeedListItem {
  return {
    id: reel.id,
    type: 'video', // backend reels are always videos initially
    source: reel.videoUrl,
    thumbnailUrl: isImageUrl(reel.thumbnailUrl) ? reel.thumbnailUrl : undefined,
    user: {
      username: reel.user.username || 'Anonymous',
      profileImage: reel.user.avatarUrl || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80',
    },
    description: reel.caption || '',
    date: new Date(reel.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    stats: {
      likes: formatNumber(reel.stats.likes),
      comments: formatNumber(reel.stats.comments),
      bookmarks: '0', 
      shares: formatNumber(reel.stats.shares),
    },
  };
}

export default function HomeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('following');
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [isScreenActive, setIsScreenActive] = useState(true);
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const fetchReelsData = useCallback(async () => {
    const response = await getFeed();
    return response.items.map(mapBackendReelToFeedItem);
  }, []);

  const { data, isLoading, isRefreshing, error, refetch } = useFeedSection(fetchReelsData);
  const feedData = data || [];

  if (error) {
    console.log("Feed Error:", error);
  }

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const nextVisibleItem = viewableItems
      .filter(item => item.index !== null && item.index !== undefined)
      .sort((a, b) => (Number(b.isViewable) - Number(a.isViewable)))[0];

    if (nextVisibleItem?.index !== null && nextVisibleItem?.index !== undefined) {
      setActiveItemIndex(nextVisibleItem.index);
    }
  }, []);

  const viewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 80,
    minimumViewTime: 120,
  }), []);

  useFocusEffect(
    useCallback(() => {
      setIsScreenActive(true);
      const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
        setIsScreenActive(state === 'active');
      });

      return () => {
        setIsScreenActive(false);
        subscription.remove();
      };
    }, [])
  );

  const getItemLayout = useCallback((_: ArrayLike<FeedListItem> | null | undefined, index: number) => ({
    length: windowHeight,
    offset: windowHeight * index,
    index,
  }), [windowHeight]);

  return (
    <View className="flex-1 bg-black">
      <View
        className="absolute left-4 right-4 z-10 flex-row justify-between items-center "
        style={{ top: insets.top + 10 }}
      >
        <View style={{ width: 32 }} />
        <View className="flex-row gap-5 items-center">
          
          <Pressable onPress={() => setActiveTab('foryou')} className="relative items-center">
            <Text className={`text-base font-semibold ${activeTab === 'foryou' ? 'text-white' : 'text-white/60'}`}>For You</Text>
            {activeTab === 'foryou' && (
              <View className="absolute -bottom-1.5 w-6 h-[3px] bg-white rounded-full" />
            )}
          </Pressable>

          <Pressable onPress={() => setActiveTab('following')} className="relative items-center">
            <Text className={`text-base font-semibold ${activeTab === 'following' ? 'text-white' : 'text-white/60'}`}>Following</Text>
            {activeTab === 'following' && (
              <View className="absolute -bottom-1.5 w-6 h-[3px] bg-white rounded-full" />
            )}
          </Pressable>

          <Link href="/live" asChild>
            <Text className="text-white/60 text-base font-semibold">Live</Text>
          </Link>
        </View>
        <Pressable onPress={() => router.push('/screens/search' as any)}>
          <Image
            source={require('../../../assets/icon/search.svg')}
            style={{ width: 28, height: 28 }}
            contentFit="contain"
          />
        </Pressable>
      </View>

      {isLoading && feedData.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#98FF2F" />
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-white text-base font-inter-medium">Error: {error}</Text>
          <Pressable onPress={() => refetch()} className="mt-4 px-4 py-2 bg-[#98FF2F] rounded-lg">
            <Text className="text-black font-semibold">Retry</Text>
          </Pressable>
        </View>
      ) : feedData.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-white text-base font-inter-medium">No reels found</Text>
          <Pressable onPress={() => refetch()} className="mt-4 px-4 py-2 bg-[#98FF2F] rounded-lg">
            <Text className="text-black font-semibold">Refresh</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={feedData}
          renderItem={({ item, index }) => (
            <FeedItem 
              {...item} 
              isActive={isScreenActive && index === activeItemIndex} 
              shouldMountVideo={isScreenActive && index === activeItemIndex}
            />
          )}
          keyExtractor={(item) => item.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={windowHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={getItemLayout}
          initialNumToRender={1}
          maxToRenderPerBatch={1}
          windowSize={3}
          removeClippedSubviews
          updateCellsBatchingPeriod={80}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => refetch()}
              tintColor="#98FF2F"
              colors={["#98FF2F"]}
              progressViewOffset={insets.top + 50}
            />
          }
        />
      )}
    </View>
  );
}
