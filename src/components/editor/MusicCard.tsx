import React from 'react';
import { View, Text, Animated, Pressable, PanResponder } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

interface MusicCardProps {
  soundUrl: string;
  title: string;
  musicCoverUrl?: string;
  musicArtist?: string;
  showMusicCard: boolean;
  isTextMode: boolean;
  activePanel: string | null;
  panResponder: any;
  pan: Animated.ValueXY;
  onClose: () => void;
}

export function MusicCard({
  soundUrl,
  title,
  musicCoverUrl,
  musicArtist,
  showMusicCard,
  isTextMode,
  activePanel,
  panResponder,
  pan,
  onClose
}: MusicCardProps) {
  if (!soundUrl || !title || !showMusicCard || isTextMode || activePanel) return null;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      className="absolute left-20 top-12 bg-black/60 rounded-xl p-2 flex-row items-center z-20 shadow-lg"
      style={{
        transform: [{ translateX: pan.x }, { translateY: pan.y }],
        maxWidth: 200
      }}
    >
      <View className="relative">
        <Image
          source={{ uri: musicCoverUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=100' }}
          className="w-10 h-10 rounded-lg"
          contentFit="cover"
        />
        <View className="absolute inset-0 items-center justify-center bg-black/30 rounded-lg">
          <Ionicons name="musical-notes" size={16} color="white" />
        </View>
      </View>
      <View className="ml-3 flex-1 mr-4">
        <Text className="text-white font-inter-semibold text-xs" numberOfLines={1}>
          {title}
        </Text>
        {musicArtist && (
          <Text className="text-[#AAA] font-inter-medium text-[10px]" numberOfLines={1}>
            {musicArtist}
          </Text>
        )}
      </View>
      <Pressable onPress={onClose} className="p-1">
        <Ionicons name="close" size={16} color="#AAA" />
      </Pressable>
    </Animated.View>
  );
}
