import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { avatarSource } from '../../utils/avatar';

interface ChatHeaderProps {
  onBack: () => void;
  onOptions: () => void;
  userName: string;
  avatarUrl: string;
  status?: string;
}

export function ChatHeader({ onBack, onOptions, userName, avatarUrl, status = 'Online' }: ChatHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3 border-b border-[#1C1C1E]">
      <View className="flex-row items-center flex-1">
        <Pressable onPress={onBack} className="mr-3 p-1">
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </Pressable>

        <View className="relative">
          <Image
            source={avatarSource(avatarUrl)}
            style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
            contentFit="cover"
          />
          <View className="absolute bottom-0 right-3 w-3 h-3 bg-[#00C853] rounded-full border-2 border-[#0A0A0A]" />
        </View>

        <View>
          <Text className="text-white font-bold text-base">{userName}</Text>
          <Text className="text-[#888] text-xs">{status}</Text>
        </View>
      </View>

      <Pressable className="p-1" onPress={onOptions}>
        <Ionicons name="ellipsis-horizontal" size={24} color="#FFF" />
      </Pressable>
    </View>
  );
}
