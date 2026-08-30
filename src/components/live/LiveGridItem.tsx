import { Ionicons } from '@expo/vector-icons';
import { useEventListener } from 'expo';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Pressable, Text, View } from 'react-native';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = Math.floor((width - 16 - 24) / 2);

export type LiveStreamData = {
  id: string;
  thumbnail?: string;
  hostName: string;
  hostAvatar: string;
  viewers: string;
  badge: 'Live' | 'Top like' | 'Ended' | 'Video' | string;
  isVideo?: boolean;
  videoUrl?: string | number; // Number for required local assets
  title?: string;
  date?: string;
  likes?: string;
};

export function LiveGridItem({ item, variant = 'live' }: { item: LiveStreamData, variant?: 'live' | 'search' }) {
  const [isMuted, setIsMuted] = useState(true);

  const player = useVideoPlayer(item.videoUrl ?? '', player => {
    player.loop = true;
    player.muted = true;
    if (item.isVideo && item.videoUrl) {
      player.play();
    }
  });

  const [isLoading, setIsLoading] = useState(player.status === 'loading');

  useEventListener(player, 'statusChange', (payload) => {
    setIsLoading(payload.status === 'loading');
  });

  useEffect(() => {
    if (player) {
      player.muted = isMuted;
      if (item.isVideo && item.videoUrl) {
        player.play();
      }
    }
  }, [isMuted, player, item.isVideo, item.videoUrl]);

  return (
    <Link href={{ pathname: '/screens/live/[id]', params: { id: item.id } }} asChild>
      <Pressable
        style={{ width: ITEM_WIDTH }}
        className={`rounded-lg overflow-hidden bg-[#1A1A1A] relative border border-white/10 ${variant === 'live' ? 'm-1.5' : 'mb-4'}`}
      >
        <View style={{ width: ITEM_WIDTH, aspectRatio: 3 / 4 }} className="relative">
          {item.thumbnail ? (
            <Image source={{ uri: item.thumbnail }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} contentFit="cover" />
          ) : (
            <View className="absolute inset-0 items-center justify-center bg-[#111] px-4">
              <Ionicons name="radio-outline" size={34} color="#98FF2F" />
              <Text className="mt-2 text-center text-xs font-semibold text-white" numberOfLines={2}>
                Live preview unavailable
              </Text>
            </View>
          )}
          {item.isVideo && item.videoUrl && (
            <VideoView
              player={player}
              style={{ width: '100%', height: '100%', borderRadius: 2, overflow: 'hidden' }}
              // style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 8, overflow: 'hidden' }}
              nativeControls={false}
              contentFit="fill"
            />
          )}

          {isLoading && (
            <View className="absolute inset-0 items-center justify-center bg-black/30">
              <ActivityIndicator size="large" color="#FF3B30" />
            </View>
          )}

          <View className="absolute inset-0 bg-black/10" pointerEvents="none" />

          {/* Top Badges */}
          <View className="absolute top-2 left-2 right-2 flex-row justify-between items-center">
            <View className={`px-2 py-1 rounded-full ${item.badge === 'Live' ? 'bg-[#FF3B30]' : 'bg-[#FF9500]'}`}>
              <Text className="text-white text-[10px] font-bold">{item.badge}</Text>
            </View>

            <View className="flex-row items-center bg-[#1C1C1E]/90 px-2 py-1 rounded-md">
              <Ionicons name="eye-outline" size={12} color="#FFF" />
              <Text className="text-white text-[10px] ml-1 font-semibold">{item.viewers}</Text>
            </View>

          </View>

          {/* Speaker Icon for Video */}
          {item.isVideo && (
            <Pressable
              className="absolute bottom-2 right-2 p-1"
              onPress={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
            >
              <Ionicons name={isMuted ? "volume-mute-outline" : "volume-high-outline"} size={18} color="#FFF" />
            </Pressable>
          )}
        </View>

        {/* Bottom Info Section */}
        {variant === 'search' ? (
          <View className="p-2.5">
            {/* Title */}
            <Text className="text-white text-sm font-medium leading-tight mb-2" numberOfLines={2}>
              {item.title}
            </Text>

            {/* Author info & Likes */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 pr-2">
                <Image
                  source={item.hostAvatar ? { uri: item.hostAvatar } : require('../../../assets/images/user.jpg')}
                  style={{ width: 24, height: 24, borderRadius: 12 }}
                />
                <View className="ml-2">
                  <Text className="text-white text-xs font-semibold" numberOfLines={1}>{item.hostName}</Text>
                  <Text className="text-[#888] text-[10px] mt-0.5">{item.date}</Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <Ionicons name="heart-outline" size={14} color="#FFF" />
                <Text className="text-white text-[10px] ml-1">{item.likes}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View className="flex-row items-center bg-[#1A1A1A] p-2.5">
            <Image source={item.hostAvatar ? { uri: item.hostAvatar } : require('../../../assets/images/user.jpg')} style={{ width: 22, height: 22, borderRadius: 11 }} />
            <Text className="text-white text-xs font-medium ml-2 flex-1" numberOfLines={1}>{item.hostName}</Text>
          </View>
        )}
      </Pressable>
    </Link>
  );
}
