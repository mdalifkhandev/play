import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CREATORS = [
  { id: 1, name: 'Juan', views: '1.5M', rankColor: '#F59E0B' },
  { id: 2, name: 'Juan', views: '1.5M', rankColor: '#9CA3AF' },
  { id: 3, name: 'Maria', views: '2M', rankColor: '#D97706' },
  { id: 4, name: 'Liam', views: '1.2M', rankColor: '#6B7280' },
  { id: 5, name: 'Sophia', views: '1.8M', rankColor: '#6B7280' },
];

export default function RewardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const DUMMY_AVATAR = { uri: 'https://i.pravatar.cc/150?img=68' };

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 mt-4 mb-3">
        <View className="w-10 h-10 justify-center">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
        </View>
        <Text className="text-white text-base font-bold flex-1 text-center">Reward</Text>
        <View className="w-10 h-10 justify-center items-end">
          <Pressable className="pr-2 -mr-2">
            <Ionicons name="settings-outline" size={24} color="white" />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* Analytic Card */}
        <View className="bg-[#151515] border border-[#222] rounded-2xl p-5 mt-4 mb-6">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-white font-medium text-base">Analytic</Text>
            <Ionicons name="chevron-forward" size={20} color="white" />
          </View>

          <View className="flex-row justify-between pr-4">
            <View>
              <Text className="text-[#888] text-sm mb-1">Post views</Text>
              <Text className="text-white text-xl font-bold font-inter-bold mb-1">12M</Text>
              <Text className="text-[#888] text-xs">0% 7d</Text>
            </View>
            <View>
              <Text className="text-[#888] text-sm mb-1">Net followers</Text>
              <Text className="text-white text-xl font-bold font-inter-bold mb-1">12k</Text>
              <Text className="text-[#888] text-xs">0% 7d</Text>
            </View>
            <View>
              <Text className="text-[#888] text-sm mb-1">Likes</Text>
              <Text className="text-white text-xl font-bold font-inter-bold mb-1">12</Text>
              <Text className="text-[#888] text-xs">0% 7d</Text>
            </View>
          </View>
        </View>

        {/* Trending Creators */}
        <View className="bg-[#151515] border border-[#222] rounded-2xl p-5 mb-6">
          <Text className="text-white font-medium text-base mb-6">Trending Creators</Text>

          {CREATORS.map((creator) => (
            <View key={creator.id} className="flex-row items-center mb-5">
              <View className="w-6 h-6 rounded-full items-center justify-center mr-3" style={{ backgroundColor: creator.rankColor }}>
                <Text className="text-black font-bold text-xs">{creator.id}</Text>
              </View>
              <Image source={DUMMY_AVATAR} className="w-10 h-10 rounded-full mr-3" />
              <View className="flex-1">
                <Text className="text-white font-medium">{creator.name}</Text>
                <Text className="text-[#888] text-xs">{creator.views} View</Text>
              </View>
              <Pressable className="bg-[#83D616] px-5 py-1.5 rounded-lg">
                <Text className="text-black font-semibold text-sm">Follow</Text>
              </Pressable>
            </View>
          ))}

          <Pressable className="bg-[#333] py-3 rounded-xl items-center mt-2">
            <Text className="text-white font-medium text-sm">Get more inspiration</Text>
          </Pressable>
        </View>

      </ScrollView>

      {/* Floating Button */}
      <View className="absolute bottom-10 left-6 right-6">
        <Pressable className="bg-[#83D616] py-4 rounded-xl flex-row items-center justify-center shadow-lg">
          <Ionicons name="videocam" size={20} color="black" className="mr-2" />
          <Text className="text-black font-bold text-base ml-2">Start creating</Text>
        </Pressable>
      </View>
    </View>
  );
}
