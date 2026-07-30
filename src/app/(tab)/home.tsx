import { Ionicons } from "@expo/vector-icons";
import { useCallback, useRef, useState } from "react";
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View, ViewToken } from "react-native";
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

export default function Home() {
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
    <View style={styles.container}>
      <View style={[styles.topNav, { top: insets.top + 10 }]}>
        <View style={{ width: 32 }} />
        <View style={styles.topNavCenter}>
          <Text style={styles.topNavText}>For You</Text>
          <Text style={[styles.topNavText, styles.topNavTextActive]}>Following</Text>
          <Text style={styles.topNavText}>Live</Text>
        </View>
        <Pressable>
          <Ionicons name="search" size={28} color="#FFF" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topNav: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topNavCenter: {
    flexDirection: 'row',
    gap: 20,
  },
  topNavText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    fontWeight: '600',
  },
  topNavTextActive: {
    color: '#FFF',
    textDecorationLine: 'underline',
  }
});
