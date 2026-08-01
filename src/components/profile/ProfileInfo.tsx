import { Image } from 'expo-image';
import React from 'react';
import { Text, View } from 'react-native';

export function ProfileInfo() {
  return (
    <View className="items-center mt-2 px-4">
      {/* Avatar */}
      <View className="relative">
        <Image
          source={{ uri: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&q=80" }}
          style={{ width: 88, height: 88, borderRadius: 44 }}
          contentFit="cover"
        />
        <View className="absolute bottom-0 right-1 bg-[#3b82f6] w-5 h-5 rounded-full items-center justify-center border-2 border-[#0A0A0A]">
          <Text className="text-white text-[10px] font-bold italic font-serif">i</Text>
        </View>
      </View>

      {/* Name and Handle */}
      <Text className="text-white text-[16px] font-bold mt-4">Jodu miyaa</Text>
      <Text className="text-[#888] text-[14px] mt-1">@Jodumiyaa</Text>

      {/* Stats */}
      <View className="flex-row items-center mt-6 w-full px-4">
        <View className="flex-1 items-center border-r border-[#333]">
          <Text className="text-white text-[16px] font-bold">5</Text>
          <Text className="text-[#888] text-[14px] mt-1">Following</Text>
        </View>
        <View className="flex-1 items-center border-r border-[#333]">
          <Text className="text-white text-[16px] font-bold">12</Text>
          <Text className="text-[#888] text-[14px] mt-1">Followers</Text>
        </View>
        <View className="flex-1 items-center">
          <Text className="text-white text-[16px] font-bold">123</Text>
          <Text className="text-[#888] text-[14px] mt-1">Likes</Text>
        </View>
      </View>

      {/* Bio */}
      <Text className="text-[#888] text-[16px] text-center mt-6 px-4 leading-5">
        Creating short anime and movie edits, reviews, and fandom mom..
      </Text>
    </View>
  );
}
