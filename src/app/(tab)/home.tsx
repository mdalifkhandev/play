import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { Link, useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, AppState, AppStateStatus, BackHandler, FlatList, InteractionManager, Pressable, RefreshControl, Text, useWindowDimensions, View, ViewToken } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FeedItem, FeedItemProps } from "../../components/ui/FeedItem";
import { AnnouncementNotice } from "../../components/announcements/AnnouncementNotice";
import { getFeedAds, recordAdClick, recordAdImpression, type AdCampaign } from "../../api/ads/ads.api";
import { getFeed, getFollowingFeed, getForYouFeed } from "../../api/reels/reels.api";
import { ReelFeedItem } from "../../api/reels/reels.types";
import { useFeedSection } from "../../hooks/feed/useFeedSection";
import { avatarSource } from "../../utils/avatar";
import { usePublicPlatformSettingsQuery } from "../../api/settings";
import { useAppStore } from "../../store";

type ReelListItem = Omit<FeedItemProps, 'isActive' | 'shouldMountVideo'> & { itemType: 'reel' };
type LiveListItem = {
  itemType: 'live';
  id: string;
  liveStreamId: string;
  source: string;
  user: ReelListItem['user'];
  title: string;
  description: string;
  date: string;
  viewerCount: number;
};
type AdListItem = { itemType: 'ad'; id: string; ad: AdCampaign };
type FeedListItem = ReelListItem | LiveListItem | AdListItem;

function isImageUrl(url?: string | null): url is string {
  if (!url) return false;
  return !/\.(mp4|mov|m4v|webm)(\?|$)/i.test(url);
}

function isVideoUrl(url?: string | null): url is string {
  if (!url) return false;
  return /\.(mp4|mov|m4v|webm)(\?|$)/i.test(url);
}

function mapBackendReelToFeedItem(reel: ReelFeedItem): ReelListItem {
  const hasPlayableVideo = reel.mediaType !== 'photo' && !isImageUrl(reel.videoUrl);
  const source = hasPlayableVideo
    ? reel.videoUrl
    : reel.thumbnailUrl || reel.videoUrl;

  return {
    id: reel.id,
    itemType: 'reel',
    type: hasPlayableVideo ? 'video' : 'image',
    source,
    thumbnailUrl: isImageUrl(reel.thumbnailUrl) ? reel.thumbnailUrl : undefined,
    user: {
      id: reel.user.id,
      username: reel.user.displayName || reel.user.username || reel.user.email || '',
      profileImage: reel.user.avatarUrl || '',
      isPremium: Boolean(reel.user.isPremium),
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

function mapBackendLiveToFeedItem(reel: ReelFeedItem): LiveListItem {
  return {
    id: reel.id,
    itemType: 'live',
    liveStreamId: reel.liveStreamId || reel.id.replace(/^live-/, ''),
    source: reel.thumbnailUrl || reel.videoUrl || reel.user.avatarUrl || '',
    user: {
      id: reel.user.id,
      username: reel.user.displayName || reel.user.username || reel.user.email || '',
      profileImage: reel.user.avatarUrl || '',
      isPremium: Boolean(reel.user.isPremium),
    },
    title: 'LIVE',
    description: reel.caption || 'Live now',
    date: new Date(reel.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    viewerCount: reel.stats.views,
  };
}

function mapBackendFeedItem(reel: ReelFeedItem): ReelListItem | LiveListItem {
  if (reel.kind === 'live') {
    return mapBackendLiveToFeedItem(reel);
  }
  return mapBackendReelToFeedItem(reel);
}

function insertAdsIntoFeed(reels: Array<ReelListItem | LiveListItem>, ads: AdCampaign[], frequency = 5): FeedListItem[] {
  if (ads.length === 0 || reels.length === 0) return reels;

  const mixed: FeedListItem[] = [];
  let adIndex = 0;

  reels.forEach((reel, index) => {
    mixed.push(reel);

    if ((index + 1) % frequency === 0 && adIndex < ads.length) {
      const ad = ads[adIndex];
      mixed.push({ itemType: 'ad', id: `ad-${ad.id}`, ad });
      adIndex += 1;
    }
  });

  return mixed;
}

function SponsoredAdItem({
  ad,
  isActive,
}: {
  ad: AdCampaign;
  isActive: boolean;
}) {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const impressionRecordedRef = useRef(false);

  useEffect(() => {
    if (!isActive || impressionRecordedRef.current) return;
    impressionRecordedRef.current = true;
    void recordAdImpression(ad.id).catch(error => {
      console.log('Record ad impression failed:', error);
    });
  }, [ad.id, isActive]);

  const handlePress = useCallback(() => {
    void recordAdClick(ad.id).catch(error => {
      console.log('Record ad click failed:', error);
    });
  }, [ad.id]);

  const mediaUrl = ad.mediaUrl || 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1080';

  return (
    <View style={{ height, width }} className="bg-black">
      {isVideoUrl(mediaUrl) ? (
        <SponsoredAdVideo source={mediaUrl} isActive={isActive} />
      ) : (
        <Image source={{ uri: mediaUrl }} className="absolute inset-0" style={{ width: '100%', height: '100%' }} contentFit="cover" />
      )}
      <View className="absolute inset-0 bg-black/35" />

      <View className="absolute left-4 right-4" style={{ top: insets.top + 78 }}>
        <View className="self-start rounded-full bg-[#98FF2F] px-3 py-1">
          <Text className="text-black text-xs font-inter-bold">Sponsored</Text>
        </View>
      </View>

      <View className="absolute left-5 right-5" style={{ bottom: insets.bottom + 95 }}>
        {ad.title ? (
          <Text className="text-white text-3xl font-inter-bold" numberOfLines={2}>
            {ad.title}
          </Text>
        ) : null}
        {ad.description ? (
          <Text className={`${ad.title ? 'mt-2' : ''} text-white/85 text-base leading-6`} numberOfLines={3}>
            {ad.description}
          </Text>
        ) : null}
        <Pressable onPress={handlePress} className="mt-5 h-12 items-center justify-center rounded-2xl bg-[#98FF2F]">
          <Text className="text-black font-inter-bold">Learn more</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SponsoredAdVideo({
  source,
  isActive,
}: {
  source: string;
  isActive: boolean;
}) {
  const player = useVideoPlayer({ uri: source, contentType: 'progressive' }, currentPlayer => {
    if (!currentPlayer) return;
    currentPlayer.loop = true;
    currentPlayer.muted = true;
  });

  useEffect(() => {
    try {
      if (isActive) {
        player.play();
      } else {
        player.pause();
      }
    } catch (error) {
      console.log('Sponsored ad video playback failed:', error);
    }
  }, [isActive, player]);

  return (
    <VideoView
      player={player}
      style={{ width: '100%', height: '100%' }}
      contentFit="cover"
      nativeControls={false}
      allowsPictureInPicture={false}
    />
  );
}

function LiveFeedCard({
  item,
}: {
  item: LiveListItem;
  isActive: boolean;
}) {
  const router = useRouter();
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      style={{ height, width }}
      className="bg-black"
      onPress={() => router.push({ pathname: '/screens/live/[id]', params: { id: item.liveStreamId } } as never)}
    >
      {item.source ? (
        <Image source={{ uri: item.source }} className="absolute inset-0" style={{ width: '100%', height: '100%' }} contentFit="cover" />
      ) : (
        <View className="absolute inset-0 bg-[#151515]" />
      )}
      <View className="absolute inset-0 bg-black/45" />

      <View className="absolute left-5 right-5" style={{ top: insets.top + 88 }}>
        <View className="self-start flex-row items-center rounded-full bg-red-500 px-3 py-1.5">
          <View className="mr-2 h-2 w-2 rounded-full bg-white" />
          <Text className="text-white text-xs font-inter-bold">LIVE</Text>
        </View>
      </View>

      <View className="absolute left-5 right-5 items-center" style={{ top: '42%' }}>
        <View className="h-20 w-20 items-center justify-center rounded-full bg-[#98FF2F]">
          <Ionicons name="play" size={38} color="#000" />
        </View>
        <Text className="mt-4 text-white text-2xl font-inter-bold" numberOfLines={2}>{item.description}</Text>
        <Text className="mt-2 text-white/75 text-sm">{item.viewerCount} watching</Text>
      </View>

      <View className="absolute left-5 right-5 flex-row items-center" style={{ bottom: insets.bottom + 82 }}>
        <Image source={avatarSource(item.user.profileImage)} style={{ width: 38, height: 38, borderRadius: 19 }} contentFit="cover" />
        <View className="ml-3 flex-1">
          <Text className="text-white text-base font-inter-bold" numberOfLines={1}>{item.user.username}</Text>
          <Text className="text-white/65 text-xs">{item.date}</Text>
        </View>
        <View className="rounded-full bg-[#98FF2F] px-4 py-2">
          <Text className="text-black text-sm font-inter-bold">Join</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { reelId } = useLocalSearchParams<{ reelId?: string }>();
  const navigation = useNavigation();
  const listRef = useRef<FlatList<FeedListItem>>(null);
  const hasScrolledToRouteReelRef = useRef<string | null>(null);
  const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('foryou');
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [isScreenActive, setIsScreenActive] = useState(false);
  const [fullscreenItemId, setFullscreenItemId] = useState<string | null>(null);
  const [announcementRefreshKey, setAnnouncementRefreshKey] = useState(0);
  const currentUser = useAppStore((state) => state.user);
  const publicSettingsQuery = usePublicPlatformSettingsQuery();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const fetchReelsData = useCallback(async () => {
    if (activeTab === 'following') {
      const response = await getFollowingFeed();
      return response.items.map(mapBackendFeedItem);
    }

    let response;
    try {
      response = await getForYouFeed();
    } catch (error) {
      console.log('For You feed failed; falling back to regular feed.', error);
      response = await getFeed();
    }

    const reels = response.items.map(mapBackendFeedItem);
    const adsEnabled = publicSettingsQuery.data?.featureFlags?.ads !== false;
    const isPremiumUser = Boolean(currentUser?.subscription?.isPremium);
    if (!adsEnabled || isPremiumUser) {
      return reels;
    }

    const videosBetweenAds = Math.max(1, publicSettingsQuery.data?.videosBetweenAds || 5);
    const ads = await getFeedAds(3).then(result => result.items).catch(error => {
      console.log('Feed ads failed:', error);
      return [];
    });

    return insertAdsIntoFeed(reels, ads, videosBetweenAds);
  }, [activeTab, currentUser?.subscription?.isPremium, publicSettingsQuery.data?.featureFlags?.ads, publicSettingsQuery.data?.videosBetweenAds]);

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

  const handleRefresh = useCallback(() => {
    setAnnouncementRefreshKey((current) => current + 1);
    void refetch();
  }, [refetch]);

  useEffect(() => {
    if (!reelId || hasScrolledToRouteReelRef.current === reelId || feedData.length === 0) return;

    const targetIndex = feedData.findIndex(item => item.itemType !== 'ad' && item.id === reelId);
    if (targetIndex < 0) return;

    hasScrolledToRouteReelRef.current = reelId;
    setActiveItemIndex(targetIndex);

    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({
        index: targetIndex,
        animated: false,
      });
    });
  }, [feedData, reelId]);

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

      {!fullscreenItemId && (
        <View className="absolute left-0 right-0 z-10" style={{ top: insets.top + 50 }}>
          <AnnouncementNotice placement="home_banner" refreshKey={announcementRefreshKey} />
        </View>
      )}

      {isLoading && feedData.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#98FF2F" />
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-white text-base font-inter-medium">Error: {error}</Text>
          <Pressable
            onPress={handleRefresh}
            disabled={isRefreshing}
            className={`mt-4 min-w-28 flex-row items-center justify-center rounded-lg px-4 py-2 ${isRefreshing ? 'bg-[#98FF2F]/70' : 'bg-[#98FF2F]'}`}
          >
            {isRefreshing ? <ActivityIndicator size="small" color="#000" /> : null}
            <Text className={`text-black font-semibold ${isRefreshing ? 'ml-2' : ''}`}>
              {isRefreshing ? 'Retrying...' : 'Retry'}
            </Text>
          </Pressable>
        </View>
      ) : feedData.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          {isRefreshing ? (
            <ActivityIndicator size="large" color="#98FF2F" />
          ) : (
            <Text className="text-white text-base font-inter-medium">No reels found</Text>
          )}
          <Pressable
            onPress={handleRefresh}
            disabled={isRefreshing}
            className={`mt-4 min-w-28 flex-row items-center justify-center rounded-lg px-4 py-2 ${isRefreshing ? 'bg-[#98FF2F]/70' : 'bg-[#98FF2F]'}`}
          >
            {isRefreshing ? <ActivityIndicator size="small" color="#000" /> : null}
            <Text className={`text-black font-semibold ${isRefreshing ? 'ml-2' : ''}`}>
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          key={activeTab}
          data={feedData}
          renderItem={({ item, index }) => (
            item.itemType === 'ad' ? (
              <SponsoredAdItem ad={item.ad} isActive={isScreenActive && index === activeItemIndex} />
            ) : item.itemType === 'live' ? (
              <LiveFeedCard item={item} isActive={isScreenActive && index === activeItemIndex} />
            ) : (
              <FeedItem 
                {...item} 
                isActive={isScreenActive && index === activeItemIndex} 
                shouldMountVideo={isScreenActive && index === activeItemIndex}
                isFullscreen={fullscreenItemId === item.id}
                onFullscreenChange={(nextIsFullscreen) => setFullscreenItemId(nextIsFullscreen ? item.id : null)}
              />
            )
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
                    onRefresh={handleRefresh}
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
