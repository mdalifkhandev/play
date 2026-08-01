import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { Dimensions, Pressable, Text, View } from 'react-native';
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

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

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

      {/* Gradient Overlay */}
      <LinearGradient
        colors={['rgba(133, 138, 138, 0.7)', 'transparent']}
        className="absolute left-0 right-0 top-0 h-1/2"
        style={{ paddingTop: insets.top }}
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
        <View className="mt-2.5">
          <Image
            source={require('../../../assets/icon/musicdisc.svg')}
            className="w-11 h-11"
            style={{ width: 44, height: 44 }}
            contentFit="contain"
          />
        </View>
      </View>

      {/* Bottom Text Details */}
      <View className="absolute left-4 right-20" style={{ bottom: insets.bottom + 60 }}>
        <View className="flex-row items-center bg-black/50 px-3 py-1.5 rounded-2xl self-start mb-3">
          <Ionicons name="scan-outline" size={16} color="#FFF" />
          <Text className="text-white ml-1.5 text-xs font-medium">Full screen</Text>
        </View>

        <Text className="text-white text-base font-bold mb-1.5">
          {user.username} <Text className="font-normal text-[#CCC]">• {date}</Text>
        </Text>

        <Text className="text-white text-sm leading-5" numberOfLines={2}>
          {description} <Text className="text-[#CCC] font-bold">more</Text>
        </Text>
      </View>
    </View>
  );
};
