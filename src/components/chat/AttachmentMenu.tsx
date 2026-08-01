import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AttachmentMenuProps {
  onCamera: () => void;
  onGallery: () => void;
  onVideo: () => void;
  onAudio: () => void;
  onFile: () => void;
}

export function AttachmentMenu({ onCamera, onGallery, onVideo, onAudio, onFile }: AttachmentMenuProps) {
  return (
    <View className="px-4 py-4 bg-[#1C1C1E] rounded-t-2xl flex-row justify-around border-t border-[#333]">
      <Pressable className="items-center" onPress={onCamera}>
        <View className="w-12 h-12 rounded-full bg-[#3b82f6] items-center justify-center mb-1">
          <Ionicons name="camera" size={24} color="#FFF" />
        </View>
        <Text className="text-white text-xs">Camera</Text>
      </Pressable>
      <Pressable className="items-center" onPress={onGallery}>
        <View className="w-12 h-12 rounded-full bg-[#10b981] items-center justify-center mb-1">
          <Ionicons name="image" size={24} color="#FFF" />
        </View>
        <Text className="text-white text-xs">Gallery</Text>
      </Pressable>
      <Pressable className="items-center" onPress={onVideo}>
        <View className="w-12 h-12 rounded-full bg-[#f59e0b] items-center justify-center mb-1">
          <Ionicons name="videocam" size={24} color="#FFF" />
        </View>
        <Text className="text-white text-xs">Video</Text>
      </Pressable>
      <Pressable className="items-center" onPress={onAudio}>
        <View className="w-12 h-12 rounded-full bg-[#ef4444] items-center justify-center mb-1">
          <Ionicons name="musical-notes" size={24} color="#FFF" />
        </View>
        <Text className="text-white text-xs">Audio</Text>
      </Pressable>
      <Pressable className="items-center" onPress={onFile}>
        <View className="w-12 h-12 rounded-full bg-[#8b5cf6] items-center justify-center mb-1">
          <Ionicons name="document" size={24} color="#FFF" />
        </View>
        <Text className="text-white text-xs">File</Text>
      </Pressable>
    </View>
  );
}
