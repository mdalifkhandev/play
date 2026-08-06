import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: WINDOW_HEIGHT, width: WINDOW_WIDTH } = Dimensions.get('window');

export interface FeedItemProps {
  id: string;
  type: 'video' | 'image';
  source: string;
  thumbnailUrl?: string;
  user: {
    username: string;
    profileImage: string;
  };
  description: string;
  date: string;
  stats: {
    likes: string;
    comments: string;
    bookmarks: string;
    shares: string;
  };
  isActive: boolean;
  shouldMountVideo?: boolean;
}

// Extract video to its own component to safely delay its mounting
function FeedVideo({ source, isActive }: { source: any, isActive: boolean }) {
  const player = useVideoPlayer(source, player => {
    player.loop = true;
  });

  useEffect(() => {
    if (player) {
      if (isActive) {
        player.play();
      } else {
        player.pause();
      }
    }
  }, [isActive, player]);

  const togglePlay = () => {
    if (player) {
      if (player.playing) {
        player.pause();
      } else {
        player.play();
      }
    }
  };

  return (
    <Pressable className="absolute inset-0" onPress={togglePlay}>
      <VideoView
        player={player}
        className="absolute inset-0"
        style={{ width: '100%', height: '100%' }}
        nativeControls={false}
        contentFit="cover"
      />
    </Pressable>
  );
}

export const FeedItem = ({
  type,
  source,
  thumbnailUrl,
  user,
  description,
  date,
  stats,
  isActive,
  shouldMountVideo = true
}: FeedItemProps) => {
  const insets = useSafeAreaInsets();

  // State to delay video initialization until Activity is guaranteed to be ready
  const [isReady, setIsReady] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const lastTap = useRef(0);

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setIsLiked(true);
    }
    lastTap.current = now;
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    spinValue.setValue(0);
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      { iterations: -1 }
    ).start();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={{ height: WINDOW_HEIGHT, width: WINDOW_WIDTH }} className="">

      {type === 'video' && isReady ? (
        shouldMountVideo ? (
          <FeedVideo source={source} isActive={isActive} />
        ) : (
          <View className="absolute inset-0">
            {thumbnailUrl ? (
              <Image source={{ uri: thumbnailUrl }} className="absolute inset-0" style={{ width: '100%', height: '100%' }} contentFit="cover" />
            ) : (
              <View className="absolute inset-0 bg-black" />
            )}
          </View>
        )
      ) : type === 'image' ? (
        <Pressable className="absolute inset-0">
          <Image
            source={{ uri: source }}
            className="absolute inset-0"
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        </Pressable>
      ) : (
        <View className="absolute inset-0 bg-black" />
      )}

      {/* Double tap area spanning the entire media */}
      <Pressable onPress={handleDoubleTap} className="absolute inset-0" />

      {/* Top Gradient Overlay */}
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.5)', 'transparent']}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '25%', paddingTop: insets.top }}
        pointerEvents="none"
      />

      {/* Bottom Gradient Overlay for text readability */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
        locations={[0, 0.5, 0.85, 1]}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '35%' }}
        pointerEvents="none"
      />


      {/* Right Action Buttons */}
      <View className="absolute right-4 items-center gap-5" style={{ bottom: insets.bottom + 100 }}>
        <View className="items-center justify-center">
          <View className="w-12 h-12 mb-2">
            <Image source={{ uri: user.profileImage }} className="w-12 h-12 rounded-full border border-white" style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: 'white' }} />
            <View className="absolute -bottom-4 right-1.5 self-center bg-[#E4FB52] w-6 h-6 rounded-full items-center justify-center">
              <Ionicons name="add" size={14} color="#000" />
            </View>
          </View>
        </View>

        <Pressable className="items-center justify-center" onPress={() => setIsLiked(!isLiked)}>
          <Ionicons name={isLiked ? "heart" : "heart-outline"} size={36} color={isLiked ? "#E4FB52" : "#FFF"} style={{ textShadowColor: 'rgba(255,255,255,0.8)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 }} />
          <Text className="text-white text-xs font-semibold mt-1" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>{stats.likes}</Text>
        </Pressable>

        <Pressable className="items-center justify-center">
          <Ionicons name="chatbubble-ellipses" size={32} color="#FFF" />
          <Text className="text-white text-xs font-semibold mt-1" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>{stats.comments}</Text>
        </Pressable>

        <Pressable className="items-center justify-center" onPress={() => setIsSaved(!isSaved)}>
          <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={32} color={isSaved ? "#FFF" : "#FFF"} style={isSaved ? { textShadowColor: 'rgba(255,255,255,0.8)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 } : undefined} />
          <Text className="text-white text-xs font-semibold mt-1" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>{stats.bookmarks}</Text>
        </Pressable>

        <Pressable className="items-center justify-center">
          <Ionicons name="arrow-redo" size={36} color="#FFF" />
          <Text className="text-white text-xs font-semibold mt-1" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>{stats.shares}</Text>
        </Pressable>

        {/* Record/Music Icon */}
        <Animated.View className="mt-2.5" style={{ transform: [{ rotate: spin }] }}>
          <Image
            source={require('../../../assets/icon/musicdisc.svg')}
            className="w-11 h-11"
            style={{ width: 44, height: 44 }}
            contentFit="contain"
          />
        </Animated.View>
      </View>

      {/* Centered Full Screen Button */}
      {!isExpanded && (
        <View className="absolute left-0 right-0 items-center pointer-events-auto" style={{ bottom: insets.bottom + 130 }}>
          <Pressable className="flex-row items-center bg-black/50 px-3 py-1.5 rounded-2xl">
            <Ionicons name="scan-outline" size={16} color="#FFF" />
            <Text className="text-white ml-1.5 text-xs font-medium">Full screen</Text>
          </Pressable>
        </View>
      )}

      {/* Bottom Text Details */}
      <View className="absolute left-4 right-20 pb-2" style={{ bottom: insets.bottom + 60 }} pointerEvents="box-none">

        <Text
          className="text-white text-base font-bold mb-1.5"
          style={{ textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}
        >
          {user.username} <Text className="font-normal text-[#CCC]">• {date}</Text>
        </Text>

        <Pressable onPress={() => setIsExpanded(!isExpanded)}>
          <Text
            className="text-white text-sm leading-5"
            style={{ textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}
          >
            {isExpanded || description.length <= 85 ? description : `${description.substring(0, 85)}...`}
            {!isExpanded && description.length > 85 && (
              <Text className="text-[#CCC] font-bold"> more</Text>
            )}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};
