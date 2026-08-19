import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import type { MusicTrack } from '../../api/music/music.types';
import { toggleSavedTrack } from '../../api/music/music.api';

type SoundListItemProps = {
  item: MusicTrack;
  playingId: string | null;
  loadingId: string | null;
  onSelect: () => void;
  onTogglePlay: () => void;
  isInitiallySaved?: boolean;
};

export function SoundListItem({
  item,
  playingId,
  loadingId,
  onSelect,
  onTogglePlay,
  isInitiallySaved = false,
}: SoundListItemProps) {
  const isThisPlaying = playingId === item.providerTrackId;
  const isThisLoading = loadingId === item.providerTrackId;

  const [isSaved, setIsSaved] = useState(isInitiallySaved);

  const handleSave = async () => {
    setIsSaved(!isSaved);
    try {
      await toggleSavedTrack({
        providerTrackId: item.providerTrackId,
        title: item.title,
        artistName: item.artistName,
        coverImageUrl: item.coverImageUrl,
        audioPreviewUrl: item.audioPreviewUrl,
        durationSeconds: item.durationSeconds
      });
    } catch (error) {
      setIsSaved(isSaved);
      console.log('Failed to save track', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.round(seconds)) : 0;
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <Pressable onPress={onSelect} className="flex-row items-center bg-[#1A1A1A] rounded-xl p-2.5 mb-3 mx-4 border border-[#333]">
      <Pressable onPress={onTogglePlay} className="relative">
        <View className="w-[60px] h-[60px] rounded-lg bg-[#333] items-center justify-center relative overflow-hidden">
          {item.coverImageUrl ? (
            <Image source={{ uri: item.coverImageUrl }} className="absolute inset-0 w-full h-full" contentFit="cover" />
          ) : (
            <Ionicons name="musical-notes" size={28} color="#98FF2F" />
          )}

          {isThisLoading ? (
            <View className="absolute inset-0 bg-black/60 items-center justify-center">
              <ActivityIndicator size="small" color="#98FF2F" />
            </View>
          ) : (
            <View className="absolute inset-0 bg-black/40 items-center justify-center">
              <Ionicons name={isThisPlaying ? "pause" : "play"} size={24} color="#98FF2F" />
            </View>
          )}
        </View>
      </Pressable>

      <View className="flex-1 ml-3 pointer-events-none">
        <Text className="text-white font-medium text-[16px] mb-0.5" numberOfLines={1}>{item.title}</Text>
        <Text className="text-[#888] text-[13px]" numberOfLines={1}>
          {item.artistName} • {formatDuration(item.durationSeconds)}
        </Text>
      </View>

      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          handleSave();
        }}
        className="p-2 ml-2"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={24} color={isSaved ? "#98D83A" : "#888"} />
      </Pressable>
    </Pressable>
  );
}
