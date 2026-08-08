import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface EditorRightActionsProps {
  isTextMode: boolean;
  activePanel: string | null;
  router: ReturnType<typeof useRouter>;
  mockImage: string;
  mediaType?: 'photo' | 'video';
  soundUrl: string;
  title: string;
  soundDuration?: string;
  musicId?: string;
  musicArtist?: string;
  musicCoverUrl?: string;
  originalVolume?: string;
  addedVolume?: string;
  trimLeft?: string;
  trimRight?: string;
  videoTrimLeft?: string;
  videoTrimRight?: string;
  videoTrimStart?: string;
  videoTrimEnd?: string;
  videoDurationSec: number;
  setIsTextMode: (val: boolean) => void;
  setActivePanel: (val: 'options' | 'filters' | 'effects' | null) => void;
  isLowEndDevice?: boolean;
}

export function EditorRightActions({
  isTextMode,
  activePanel,
  router,
  mockImage,
  mediaType,
  soundUrl,
  title,
  soundDuration,
  musicId,
  musicArtist,
  musicCoverUrl,
  originalVolume,
  addedVolume,
  trimLeft,
  trimRight,
  videoTrimLeft,
  videoTrimRight,
  videoTrimStart,
  videoTrimEnd,
  videoDurationSec,
  setIsTextMode,
  setActivePanel,
  isLowEndDevice
}: EditorRightActionsProps) {
  if (isTextMode || activePanel) return null;

  const navigateToEditMusic = () => {
    router.push({
      pathname: '/screens/create/edit-music',
      params: {
        uri: mockImage,
        mediaType: mediaType || 'photo',
        soundUrl: soundUrl || '',
        title: title || '',
        soundDuration: soundDuration || '',
        musicId: musicId || '',
        musicArtist: musicArtist || '',
        musicCoverUrl: musicCoverUrl || '',
        originalVolume: originalVolume?.toString() || '',
        addedVolume: addedVolume?.toString() || '',
        trimLeft: trimLeft?.toString() || '',
        trimRight: trimRight?.toString() || '',
        videoTrimLeft: videoTrimLeft?.toString() || '',
        videoTrimRight: videoTrimRight?.toString() || '',
        videoTrimStart: videoTrimStart || '',
        videoTrimEnd: videoTrimEnd || '',
        videoDuration: videoDurationSec.toString()
      }
    } as any);
  };

  const navigateToSound = () => {
    router.push({
      pathname: '/screens/create/sound',
      params: {
        returnTo: '/screens/create/edit',
        uri: mockImage,
        mediaType: mediaType || 'photo',
        originalVolume: originalVolume?.toString() || '',
        addedVolume: addedVolume?.toString() || '',
        trimLeft: trimLeft?.toString() || '',
        trimRight: trimRight?.toString() || '',
        soundDuration: soundDuration || '',
        musicId: musicId || '',
        musicArtist: musicArtist || '',
        musicCoverUrl: musicCoverUrl || '',
        videoTrimLeft: videoTrimLeft?.toString() || '',
        videoTrimRight: videoTrimRight?.toString() || '',
        videoTrimStart: videoTrimStart || '',
        videoTrimEnd: videoTrimEnd || '',
        videoDuration: videoDurationSec.toString()
      }
    } as any);
  };

  return (
    <View className="absolute right-4 top-10 gap-4 z-20">
      <Pressable
        onPress={navigateToSound}
        className="items-center relative"
      >
        <View className="w-10 h-10 bg-black/60 rounded-full items-center justify-center mb-1">
          <Ionicons name="musical-notes" size={20} color="white" />
        </View>
        <Text className="text-white font-inter-semibold text-[10px]" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>Sound</Text>
        {soundUrl ? (
          <View className="absolute -top-1 -right-1 w-4 h-4 bg-[#98FF2F] rounded-full border border-black items-center justify-center">
            <Ionicons name="checkmark" size={10} color="black" />
          </View>
        ) : null}
      </Pressable>

      <Pressable
        onPress={navigateToEditMusic}
        className="items-center"
      >
        <View className="w-10 h-10 bg-black/60 rounded-full items-center justify-center mb-1">
          <Ionicons name="options" size={20} color="white" />
        </View>
        <Text className="text-white font-inter-semibold text-[10px]" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>Edit sound</Text>
      </Pressable>

      <Pressable onPress={() => setIsTextMode(true)} className="items-center">
        <View className="w-10 h-10 bg-black/60 rounded-full items-center justify-center mb-1">
          <Text className="text-white font-inter-bold text-lg leading-none" style={{ marginTop: -2 }}>Aa</Text>
        </View>
        <Text className="text-white font-inter-semibold text-[10px]" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>Text</Text>
      </Pressable>

      <Pressable onPress={() => setActivePanel('filters')} className="items-center">
        <View className="w-10 h-10 bg-black/60 rounded-full items-center justify-center mb-1">
          <Ionicons name="color-filter" size={20} color="white" />
        </View>
        <Text className="text-white font-inter-semibold text-[10px]" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>Filters</Text>
      </Pressable>

      {!isLowEndDevice && (
        <Pressable onPress={() => setActivePanel('effects')} className="items-center">
          <View className="w-10 h-10 bg-black/60 rounded-full items-center justify-center mb-1">
            <Ionicons name="sparkles" size={20} color="white" />
          </View>
          <Text className="text-white font-inter-semibold text-[10px]" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>Effects</Text>
        </Pressable>
      )}

      <Pressable onPress={() => setActivePanel('options')} className="items-center">
        <View className="w-10 h-10 bg-black/60 rounded-full items-center justify-center mb-1">
          <Ionicons name="settings" size={20} color="white" />
        </View>
        <Text className="text-white font-inter-semibold text-[10px]" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>Adjust</Text>
      </Pressable>
    </View>
  );
}
