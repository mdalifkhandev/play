import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const TopTab = ({ title, active }: { title: string; active?: boolean }) => (
  <View className={`pb-2 px-3 ${active ? 'border-b-2 border-[#98D83A]' : 'border-b-2 border-transparent'}`}>
    <Text className={`font-inter-medium ${active ? 'text-white' : 'text-gray-400'}`}>{title}</Text>
  </View>
);

const FilterChip = ({ title, active }: { title: string; active?: boolean }) => (
  <View className={`px-4 py-1.5 rounded-md mr-2 ${active ? 'bg-[#98D83A]' : 'bg-[#333]'}`}>
    <Text className={`text-sm font-inter-medium ${active ? 'text-black' : 'text-gray-300'}`}>{title}</Text>
  </View>
);

const VideoCard = ({ author, date, likes }: { author: string; date: string; likes: string }) => (
  <View className="flex-1 m-1 bg-[#1C1C1E] rounded-xl overflow-hidden mb-3">
    <View className="h-48 bg-[#333] w-full" />
    <View className="p-3">
      <Text className="text-white text-sm font-inter-medium mb-2" numberOfLines={2}>
        Rainbow Paint Splash!
      </Text>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="w-6 h-6 rounded-full bg-gray-600 mr-2" />
          <View>
            <Text className="text-gray-200 text-xs font-inter-medium">{author}</Text>
            <Text className="text-gray-500 text-[10px]">{date}</Text>
          </View>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="heart-outline" size={12} color="#888" />
          <Text className="text-gray-400 text-xs ml-1">{likes}</Text>
        </View>
      </View>
    </View>
  </View>
);

export default function KidsModeSearchScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <View className="flex-1 bg-[#121212]" style={{ paddingTop: insets.top }}>
      <View className="px-4 py-3">
        <View className="flex-row items-center bg-[#2A2A2A] rounded-full px-4 py-2">
          <Ionicons name="search" size={20} color="#888" className="mr-2" />
          <TextInput
            placeholder="Search fun videos..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-white text-base font-inter-regular p-0 h-8"
          />
        </View>
      </View>

      <View className="flex-row border-b border-[#222] px-2">
        <TopTab title="Top" active />
        <TopTab title="Video" />
        <TopTab title="Photo" />
        <TopTab title="Sound" />
        <TopTab title="Hashtags" />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="max-h-[36px] min-h-[36px] px-4 mt-4">
        <FilterChip title="All" active />
        <FilterChip title="Unwatch" />
        <FilterChip title="Wath" />
        <FilterChip title="Recent uploaded" />
      </ScrollView>

      <ScrollView className="flex-1 px-3 mt-4" showsVerticalScrollIndicator={false}>
        <View className="flex-row flex-wrap pb-20">
          <View className="w-1/2 pr-1">
            <VideoCard author="Motin" date="14 Aug 2026" likes="12k" />
            <VideoCard author="Motin" date="14 Aug 2026" likes="12k" />
          </View>
          <View className="w-1/2 pl-1">
            <VideoCard author="Motin" date="14 Aug 2026" likes="12k" />
            <VideoCard author="Motin" date="14 Aug 2026" likes="12k" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
