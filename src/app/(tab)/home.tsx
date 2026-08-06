import { Image } from "expo-image";
import { Link, useRouter, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState, useEffect } from "react";
import { Dimensions, FlatList, Pressable, Text, View, ViewToken, ActivityIndicator, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FeedItem, FeedItemProps } from "../../components/ui/FeedItem";
import { getFeed } from "../../api/reels/reels.api";
import { ReelFeedItem } from "../../api/reels/reels.types";

const { height: WINDOW_HEIGHT } = Dimensions.get('window');

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return String(num);
}

function mapBackendReelToFeedItem(reel: ReelFeedItem): Omit<FeedItemProps, 'isActive' | 'shouldMountVideo'> {
  return {
    id: reel.id,
    type: 'video', // backend reels are always videos initially
    source: reel.videoUrl,
    thumbnailUrl: reel.thumbnailUrl,
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
  const [feedData, setFeedData] = useState<Omit<FeedItemProps, 'isActive' | 'shouldMountVideo'>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const fetchFeed = async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      const response = await getFeed();
      const mappedData = response.items.map(mapBackendReelToFeedItem);
      setFeedData(mappedData);
    } catch (error) {
      console.log('Error fetching feed:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFeed();
    }, [])
  );

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setActiveItemIndex(viewableItems[0].index ?? 0);
    }
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

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

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#98FF2F" />
        </View>
      ) : feedData.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-white text-base font-inter-medium">No reels found</Text>
        </View>
      ) : (
        <FlatList
          data={feedData}
          renderItem={({ item, index }) => (
            <FeedItem 
              {...item} 
              isActive={index === activeItemIndex} 
              shouldMountVideo={Math.abs(index - activeItemIndex) <= 1}
            />
          )}
          keyExtractor={(item) => item.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={WINDOW_HEIGHT}
          snapToAlignment="start"
          decelerationRate="fast"
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          initialNumToRender={2}
          maxToRenderPerBatch={3}
          windowSize={5}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchFeed(true)}
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

