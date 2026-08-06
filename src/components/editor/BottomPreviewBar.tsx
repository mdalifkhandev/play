import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BottomPreviewBarProps {
  isTextMode: boolean;
  activePanel: string | null;
  togglePreviewPlayback: () => void;
  isPreviewPlaying: boolean;
  previewCurrentTime: number;
  previewDurationSec: number;
  previewProgressPercent: number;
  formatSeconds: (seconds: number) => string;
}

export function BottomPreviewBar({
  isTextMode,
  activePanel,
  togglePreviewPlayback,
  isPreviewPlaying,
  previewCurrentTime,
  previewDurationSec,
  previewProgressPercent,
  formatSeconds
}: BottomPreviewBarProps) {
  if (isTextMode || activePanel) return null;

  return (
    <View className="absolute left-4 right-4 bottom-5 bg-black/70 rounded-2xl px-4 py-3 z-20">
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={togglePreviewPlayback}
          className="w-11 h-11 rounded-full bg-[#98FF2F] items-center justify-center"
        >
          <Ionicons
            name={isPreviewPlaying ? 'pause' : 'play'}
            size={22}
            color="black"
            style={{ marginLeft: isPreviewPlaying ? 0 : 2 }}
          />
        </Pressable>

        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white font-inter-semibold text-xs">
              {formatSeconds(previewCurrentTime)}
            </Text>
            <Text className="text-white font-inter-semibold text-xs">
              {formatSeconds(previewDurationSec)}
            </Text>
          </View>
          <View className="h-1.5 bg-white/25 rounded-full overflow-hidden">
            <View
              className="h-full bg-[#98FF2F] rounded-full"
              style={{ width: `${previewProgressPercent}%` }}
            />
          </View>
        </View>
      </View>
    </View>
  );
}
