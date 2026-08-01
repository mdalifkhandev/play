import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { Dimensions, Pressable, Text, View } from 'react-native';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = Math.floor((width - 16 - 24) / 2);

export type LiveStreamData = {
  id: string;
  thumbnail: string;
  hostName: string;
  hostAvatar: string;
  viewers: string;
  badge: 'Live' | 'Top like';
  isVideo?: boolean;
  videoUrl?: string;
};

export function LiveGridItem({ item }: { item: LiveStreamData }) {
  const [isMuted, setIsMuted] = useState(true);

  const player = useVideoPlayer(item.videoUrl ?? '', player => {
    player.loop = true;
    player.muted = true;
    if (item.isVideo && item.videoUrl) {
      player.play();
    }
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
    <Link href={{ pathname: '/live/[id]', params: { id: item.id } }} asChild>
      <Pressable
        style={{ width: ITEM_WIDTH, aspectRatio: 3 / 4 }}
        className="m-1.5 rounded-lg overflow-hidden bg-[#1A1A1A] relative border border-white/10"
      >
        <View className="flex-1 relative">
          <Image source={{ uri: item.thumbnail }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} contentFit="cover" />
          {item.isVideo && item.videoUrl && (
            <VideoView
              player={player}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 8, overflow: 'hidden' }}
              nativeControls={false}
              contentFit="fill"
            />
          )}

          <View className="absolute inset-0 bg-black/10" />

          {/* Top Badges */}
          <View className="absolute top-2 left-2 right-2 flex-row justify-between items-center">
            <View className={`px-2 py-1 rounded-full ${item.badge === 'Live' ? 'bg-[#FF453A]' : 'bg-[#FF453A]'}`}>
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

        {/* Bottom User Info */}
        <View className="flex-row items-center bg-[#1A1A1A] p-2.5">
          <Image source={{ uri: item.hostAvatar }} style={{ width: 22, height: 22, borderRadius: 11 }} />
          <Text className="text-white text-xs font-medium ml-2 flex-1" numberOfLines={1}>{item.hostName}</Text>
        </View>
      </Pressable>
    </Link>
  );
}
