import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Dimensions, FlatList, Pressable, Text, View, ViewToken } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FeedItem, FeedItemProps } from "../../components/ui/FeedItem";

const { height: WINDOW_HEIGHT } = Dimensions.get('window');

const MOCK_DATA: FeedItemProps[] = [
  {
    id: "1",
    type: "video",
    source: "https://www.w3schools.com/html/mov_bbb.mp4",
    user: {
      username: "Motin Mia",
      profileImage: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80",
    },
    description: "Norway beat Brazil 2-1 in the Round of 16 of the 2026 World Cup...",
    date: "14 Aug 2026",
    stats: {
      likes: "133.1K",
      comments: "5,865",
      bookmarks: "7,839",
      shares: "16K",
    },
    isActive: false,
  },
  {
    id: "2",
    type: "image",
    source: "https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&w=800&q=80",
    user: {
      username: "Photography Daily",
      profileImage: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    },
    description: "Behind the scenes of our latest studio shoot! 📸✨",
    date: "12 Aug 2026",
    stats: {
      likes: "45.2K",
      comments: "1,200",
      bookmarks: "3,400",
      shares: "2.1K",
    },
    isActive: false,
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const insets = useSafeAreaInsets();

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setActiveItemIndex(viewableItems[0].index ?? 0);
    }
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  return (
    <View className="flex-1">
      <View
        className="absolute left-4 right-4 z-10 flex-row justify-between items-center "
        style={{ top: insets.top + 10 }}
      >
        <View style={{ width: 32 }} />
        <View className="flex-row gap-5">
          <Text className="text-white/60 text-base font-semibold">For You</Text>
          <Text className="text-white text-base font-semibold underline">Following</Text>
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

      <FlatList
        data={MOCK_DATA}
        renderItem={({ item, index }) => (
          <FeedItem {...item} isActive={index === activeItemIndex} />
        )}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={WINDOW_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
      />
    </View>
  );
}

