import React, { useState } from 'react';
import { View, Text, Pressable, Image, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function EditMusicScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { uri, soundUrl, title } = useLocalSearchParams<{ uri: string; soundUrl: string; title: string }>();

  const [originalVolume, setOriginalVolume] = useState(50);
  const [addedVolume, setAddedVolume] = useState(50);
  const [isPlaying, setIsPlaying] = useState(true);

  const mockImage = uri || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800';

  return (
    <View className="flex-1 bg-[#121212]" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text className="text-white font-inter-semibold text-[17px]">
          Edit Music
        </Text>
        <Pressable 
          onPress={() => router.back()}
          className="bg-[#98FF2F] px-4 py-1.5 rounded-lg"
        >
          <Text className="text-black font-inter-semibold text-[15px]">Save</Text>
        </Pressable>
      </View>

      {/* Main Preview (Square crop matching mockup) */}
      <View className="items-center justify-center mt-2 px-4">
        <View className="w-full aspect-square rounded-[32px] overflow-hidden relative bg-[#222]">
          <Image 
            source={{ uri: mockImage }} 
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-black/20" />
          
          {/* Play Button */}
          <View className="absolute inset-0 items-center justify-center">
            <Pressable 
              onPress={() => setIsPlaying(!isPlaying)}
              className="w-16 h-16 bg-black/50 rounded-full items-center justify-center"
            >
              <Ionicons name={isPlaying ? "pause" : "play"} size={28} color="white" style={{ marginLeft: isPlaying ? 0 : 4 }} />
            </Pressable>
          </View>
          
          {/* Mute Button */}
          <View className="absolute bottom-4 right-4">
            <Pressable className="w-12 h-12 bg-black/50 rounded-full items-center justify-center">
              <Ionicons name="volume-medium" size={24} color="white" />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Music Info */}
      <View className="items-center mt-6">
        <Text className="text-white font-inter-semibold text-lg">{title || 'Midnight City'}</Text>
        <Text className="text-[#888] font-inter-regular mt-1">M83</Text>
      </View>

      {/* Trimmer Section */}
      <View className="px-4 mt-8">
        <View className="flex-row justify-between mb-4">
          <Text className="text-white font-inter-medium">00:12 / 00:30</Text>
          <Text className="text-white font-inter-medium">TRIM MODE</Text>
        </View>
        
        {/* Mock Trim Timeline */}
        <View className="h-16 w-full flex-row rounded-lg overflow-hidden relative bg-[#222]">
          <Image 
            source={{ uri: mockImage }} 
            className="w-full h-full opacity-50"
            resizeMode="cover"
          />
          <View className="absolute inset-y-0 left-[20%] right-[30%] border-4 border-[#98FF2F] bg-black/10 flex-row justify-between">
            <View className="w-4 h-full bg-[#98FF2F] items-center justify-center">
              <View className="w-0.5 h-4 bg-black rounded-full" />
            </View>
            <View className="w-4 h-full bg-[#98FF2F] items-center justify-center">
              <View className="w-0.5 h-4 bg-black rounded-full" />
            </View>
          </View>
        </View>
      </View>

      {/* Volume Sliders */}
      <View className="px-4 mt-8 gap-6">
        <View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-white font-inter-medium text-[15px]">Original Sound</Text>
            <Text className="text-[#98FF2F] font-inter-medium">{originalVolume}%</Text>
          </View>
          {/* We'll use a simple styled view as a mock slider */}
          <View className="w-full h-1 bg-white/20 rounded-full flex-row items-center">
            <View className="h-full bg-[#98FF2F] rounded-full" style={{ width: `${originalVolume}%` }} />
            <View className="w-4 h-4 rounded-full bg-[#98FF2F] absolute" style={{ left: `${originalVolume}%`, marginLeft: -8 }} />
          </View>
        </View>
        
        <View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-white font-inter-medium text-[15px]">Added Music</Text>
            <Text className="text-[#98FF2F] font-inter-medium">{addedVolume}%</Text>
          </View>
          <View className="w-full h-1 bg-white/20 rounded-full flex-row items-center">
            <View className="h-full bg-[#98FF2F] rounded-full" style={{ width: `${addedVolume}%` }} />
            <View className="w-4 h-4 rounded-full bg-[#98FF2F] absolute" style={{ left: `${addedVolume}%`, marginLeft: -8 }} />
          </View>
        </View>
      </View>

    </View>
  );
}
