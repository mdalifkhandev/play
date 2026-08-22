import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { avatarSource } from '../../utils/avatar';

type ProfileInfoProps = {
  avatarUrl?: string;
  displayName?: string;
  username?: string;
  bio?: string;
  followingCount?: number;
  followersCount?: number;
  likesCount?: number;
  isPremium?: boolean;
};

export function ProfileInfo({
  avatarUrl,
  displayName = 'User',
  username = 'user',
  bio = '',
  followingCount = 0,
  followersCount = 0,
  likesCount = 0,
  isPremium = false,
}: ProfileInfoProps) {
  return (
    <View className="items-center mt-2 px-4">
      {/* Avatar */}
      <View className="relative">
        <Image
          source={avatarSource(avatarUrl)}
          style={{ width: 88, height: 88, borderRadius: 44 }}
          contentFit="cover"
        />
        <View className="absolute bottom-0 right-1 bg-[#3b82f6] w-5 h-5 rounded-full items-center justify-center border-2 border-[#0A0A0A]">
          <Text className="text-white text-[10px] font-bold italic font-serif">i</Text>
        </View>
      </View>

      {/* Name and Handle */}
      <View className="flex-row items-center mt-4 max-w-full px-4">
        <Text numberOfLines={1} className="text-white text-[16px] font-bold">
          {displayName}
        </Text>
        {isPremium && (
          <View className="ml-2 h-5 w-5 rounded-full bg-[#A3E635] items-center justify-center">
            <Ionicons name="star" size={12} color="#0A0A0A" />
          </View>
        )}
      </View>
      <Text className="text-[#888] text-[14px] mt-1">@{username}</Text>

      {/* Stats */}
      <View className="flex-row items-center mt-6 w-full px-4">
        <View className="flex-1 items-center border-r border-[#333]">
          <Text className="text-white text-[16px] font-bold">{followingCount}</Text>
          <Text className="text-[#888] text-[14px] mt-1">Following</Text>
        </View>
        <View className="flex-1 items-center border-r border-[#333]">
          <Text className="text-white text-[16px] font-bold">{followersCount}</Text>
          <Text className="text-[#888] text-[14px] mt-1">Followers</Text>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-white text-[16px] font-bold">{likesCount}</Text>
          <Text className="text-[#888] text-[14px] mt-1">Likes</Text>
        </View>
      </View>

      {/* Bio */}
      <Text className="text-[#888] text-[16px] text-center mt-6 px-4 leading-5">
        {bio || 'No bio yet.'}
      </Text>
    </View>
  );
}
