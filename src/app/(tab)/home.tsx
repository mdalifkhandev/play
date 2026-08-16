import { Image } from "expo-image";
import { Link, useFocusEffect, useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, AppState, AppStateStatus, BackHandler, FlatList, InteractionManager, Pressable, RefreshControl, Text, useWindowDimensions, View, ViewToken } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FeedItem, FeedItemProps } from "../../components/ui/FeedItem";
import { getFeed, getForYouFeed } from "../../api/reels/reels.api";
import { ReelFeedItem } from "../../api/reels/reels.types";
import { useFeedSection } from "../../hooks/feed/useFeedSection";

type FeedListItem = Omit<FeedItemProps, 'isActive' | 'shouldMountVideo'>;

function isImageUrl(url?: string | null): url is string {
  if (!url) return false;
  return !/\.(mp4|mov|m4v|webm)(\?|$)/i.test(url);
}

function mapBackendReelToFeedItem(reel: ReelFeedItem): FeedListItem {
  return {
    id: reel.id,
    type: 'video', // backend reels are always videos initially
    source: reel.videoUrl,
    thumbnailUrl: isImageUrl(reel.thumbnailUrl) ? reel.thumbnailUrl : undefined,
    user: {
      id: reel.user.id,
      username: reel.user.username || reel.user.email || '',
      profileImage: reel.user.avatarUrl || '',
    },
    description: reel.caption || '',
    date: new Date(reel.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    stats: {
      likes: reel.stats.likes,
      comments: reel.stats.comments,
      bookmarks: 0,
      shares: reel.stats.shares,
      views: reel.stats.views,
    },
    viewerState: reel.viewerState,
    edit: reel.edit,
  };
}

export default function HomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('foryou');
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [isScreenActive, setIsScreenActive] = useState(false);
  const [fullscreenItemId, setFullscreenItemId] = useState<string | null>(null);
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const fetchReelsData = useCallback(async () => {
    if (activeTab === 'following') {
      const response = await getFeed();
      return response.items.map(mapBackendReelToFeedItem);
    }

    let response;
    try {
      response = await getForYouFeed();
    } catch (error) {
      console.log('For You feed failed; falling back to regular feed.', error);
      response = await getFeed();
    }

    return response.items.map(mapBackendReelToFeedItem);
  }, [activeTab]);

  const { data, isLoading, isRefreshing, error, refetch } = useFeedSection(fetchReelsData);
  const feedData = data || [];

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
      let isFocused = true;
      const taskId = setTimeout(() => {
        if (isFocused && AppState.currentState === 'active') {
          setIsScreenActive(true);
        }
      }, 0);

      const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
        setIsScreenActive(isFocused && state === 'active');
      });

      return () => {
        isFocused = false;
        clearTimeout(taskId);
        setIsScreenActive(false);
        subscription.remove();
      };
    }, [])
  );

  useEffect(() => {
    const parent = navigation.getParent();

    parent?.setOptions({
      tabBarStyle: fullscreenItemId
        ? { display: 'none' }
        : {
            backgroundColor: '#121212',
            borderTopWidth: 0,
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 10,
            marginBottom: 5,
          },
    });
  }, [fullscreenItemId, insets.bottom, navigation]);

  useEffect(() => {
    if (!fullscreenItemId) return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setFullscreenItemId(null);
      return true;
    });

    return () => subscription.remove();
  }, [fullscreenItemId]);

  const getItemLayout = useCallback((_: ArrayLike<FeedListItem> | null | undefined, index: number) => ({
    length: windowHeight,
    offset: windowHeight * index,
    index,
  }), [windowHeight]);

  const handleTabChange = useCallback((tab: 'foryou' | 'following') => {
    setActiveTab(tab);
    setActiveItemIndex(0);
  }, []);

  return (
    <View className="flex-1 bg-black">
      {!fullscreenItemId && (
        <View
          className="absolute left-4 right-4 z-10 flex-row justify-between items-center "
          style={{ top: insets.top + 10 }}
        >
          <View style={{ width: 32 }} />
          <View className="flex-row gap-5 items-center">
            
            <Pressable onPress={() => handleTabChange('foryou')} className="relative items-center">
              <Text className={`text-base font-semibold ${activeTab === 'foryou' ? 'text-white' : 'text-white/60'}`}>For You</Text>
              {activeTab === 'foryou' && (
                <View className="absolute -bottom-1.5 w-6 h-[3px] bg-white rounded-full" />
              )}
            </Pressable>

            <Pressable onPress={() => handleTabChange('following')} className="relative items-center">
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
      )}

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
          key={activeTab}
          data={feedData}
          renderItem={({ item, index }) => (
            <FeedItem 
              {...item} 
              isActive={isScreenActive && index === activeItemIndex} 
              shouldMountVideo={isScreenActive && index === activeItemIndex}
              isFullscreen={fullscreenItemId === item.id}
              onFullscreenChange={(nextIsFullscreen) => setFullscreenItemId(nextIsFullscreen ? item.id : null)}
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
            fullscreenItemId
              ? undefined
              : (
                  <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={() => refetch()}
                    tintColor="#98FF2F"
                    colors={["#98FF2F"]}
                    progressViewOffset={insets.top + 50}
                  />
                )
          }
        />
      )}
    </View>
  );
}
