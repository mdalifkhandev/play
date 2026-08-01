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
  user,
  description,
  date,
  stats,
  isActive
}: FeedItemProps) => {
  const insets = useSafeAreaInsets();

  // State to delay video initialization until Activity is guaranteed to be ready
  const [isReady, setIsReady] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={{ height: WINDOW_HEIGHT, width: WINDOW_WIDTH }} className="">

      {type === 'video' && isReady ? (
        <FeedVideo source={source} isActive={isActive} />
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

      {/* Top Gradient Overlay */}
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.4)', 'transparent']}
        className="absolute left-0 right-0 top-0 h-1/4"
        style={{ paddingTop: insets.top }}
        pointerEvents="none"
      />

      {/* Bottom Gradient Overlay for text readability */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        className="absolute left-0 right-0 bottom-0 h-2/5"
        pointerEvents="none"
      />


      {/* Right Action Buttons */}
      <View className="absolute right-3 items-center gap-5" style={{ bottom: insets.bottom + 100 }}>
        <View className="items-center justify-center">
          <View className="w-12 h-12 mb-2">
            <Image source={{ uri: user.profileImage }} className="w-12 h-12 rounded-full border border-white" style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: 'white' }} />
            <View className="absolute -bottom-2 self-center bg-[#E4FB52] w-5 h-5 rounded-full items-center justify-center">
              <Ionicons name="add" size={14} color="#000" />
            </View>
          </View>
        </View>

        <Pressable className="items-center justify-center">
          <Ionicons name="heart" size={36} color="#E4FB52" />
          <Text className="text-white text-xs font-semibold mt-1" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>{stats.likes}</Text>
        </Pressable>

        <Pressable className="items-center justify-center">
          <Ionicons name="chatbubble-ellipses" size={32} color="#FFF" />
          <Text className="text-white text-xs font-semibold mt-1" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>{stats.comments}</Text>
        </Pressable>

        <Pressable className="items-center justify-center">
          <Ionicons name="bookmark" size={32} color="#FFF" />
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
      <View className="absolute left-0 right-0 items-center pointer-events-auto" style={{ bottom: insets.bottom + 130 }}>
        <Pressable className="flex-row items-center bg-black/50 px-3 py-1.5 rounded-2xl">
          <Ionicons name="scan-outline" size={16} color="#FFF" />
          <Text className="text-white ml-1.5 text-xs font-medium">Full screen</Text>
        </Pressable>
      </View>

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
            numberOfLines={isExpanded ? undefined : 2}
            style={{ textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}
          >
            {description}
            {!isExpanded && (
              <Text className="text-[#CCC] font-bold"> more</Text>
            )}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};
