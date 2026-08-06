import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoView } from 'expo-video';

interface MediaVideoPreviewProps {
  player: any;
  hasFirstFrame: boolean;
  onFirstFrameRender: () => void;
  compact?: boolean;
}

export function MediaVideoPreview({
  player,
  hasFirstFrame,
  onFirstFrameRender,
  compact = false
}: MediaVideoPreviewProps) {
  return (
    <View className="absolute inset-0 bg-black">
      <VideoView
        player={player}
        className="absolute inset-0"
        style={{ width: '100%', height: '100%' }}
        nativeControls={false}
        contentFit="cover"
        surfaceType="textureView"
        onFirstFrameRender={onFirstFrameRender}
      />
      {!hasFirstFrame && (
        <View className="absolute inset-0 items-center justify-center bg-black">
          <Ionicons name="play-circle" size={compact ? 24 : 56} color="#98FF2F" />
          {!compact && <Text className="text-white font-inter-medium mt-3">Loading video preview...</Text>}
        </View>
      )}
    </View>
  );
}
