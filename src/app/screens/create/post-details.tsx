import React, { useState } from 'react';
import { View, Text, Pressable, Image, TextInput, ScrollView, Switch } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function PostDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { uri, overlayText, soundUrl } = useLocalSearchParams<{ uri: string; overlayText: string; soundUrl: string }>();

  const [caption, setCaption] = useState('');
  const [forKids, setForKids] = useState(false);

  const mockImage = uri || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800';

  const handlePost = () => {
    router.push({
      pathname: '/screens/create/post-success',
      params: { uri: mockImage }
    } as any);
  };

  return (
    <View className="flex-1 bg-[#121212]" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-[#222]">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text className="text-white font-inter-semibold text-[17px]">
          Post Details
        </Text>
        <View className="w-8" />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        
        {/* Top Thumbnail */}
        <View className="w-full h-40 rounded-2xl overflow-hidden mb-6 relative">
          <Image 
            source={{ uri: mockImage }} 
            className="w-full h-full"
            resizeMode="cover"
          />
          {overlayText && (
            <View className="absolute inset-0 items-center justify-center bg-black/20">
              <Text className="text-white font-inter-bold text-xl text-center px-4" style={{ textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: -1, height: 1 }, textShadowRadius: 5 }}>
                {overlayText}
              </Text>
            </View>
          )}
        </View>

        {/* Caption */}
        <Text className="text-white font-inter-semibold text-base mb-2">Caption</Text>
        <View className="bg-[#1C1C1E] rounded-xl p-4 min-h-[120px] mb-4 border border-[#333]">
          <TextInput
            className="text-white font-inter-regular text-base p-0 m-0"
            placeholder="Add a description......."
            placeholderTextColor="#888"
            multiline
            textAlignVertical="top"
            value={caption}
            onChangeText={setCaption}
          />
        </View>

        {/* Hashtags */}
        <View className="flex-row flex-wrap gap-2 mb-6">
          <Pressable className="bg-[#98FF2F] px-4 py-1.5 rounded-md">
            <Text className="text-black font-inter-medium text-sm">#nightlife</Text>
          </Pressable>
          <Pressable className="bg-[#333] px-4 py-1.5 rounded-md">
            <Text className="text-gray-300 font-inter-medium text-sm">#dance</Text>
          </Pressable>
          <Pressable className="bg-[#333] px-4 py-1.5 rounded-md">
            <Text className="text-gray-300 font-inter-medium text-sm">#noir</Text>
          </Pressable>
          <Pressable className="bg-[#333] px-4 py-1.5 rounded-md">
            <Text className="text-gray-300 font-inter-medium text-sm">+ Hashtags</Text>
          </Pressable>
        </View>

        {/* List Options */}
        <View className="gap-6 mb-8">
          <Pressable className="flex-row items-center">
            <Ionicons name="at-outline" size={24} color="white" />
            <Text className="text-white font-inter-medium text-base ml-3">Mention Someone</Text>
          </Pressable>
          
          <Pressable className="flex-row items-center">
            <Ionicons name="location-outline" size={24} color="white" />
            <Text className="text-white font-inter-medium text-base ml-3">Add Location</Text>
          </Pressable>
          
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="happy-outline" size={24} color="white" />
              <Text className="text-white font-inter-medium text-base ml-3">For kids</Text>
            </View>
            <Switch
              value={forKids}
              onValueChange={setForKids}
              trackColor={{ false: '#333', true: '#98FF2F' }}
              thumbColor={forKids ? 'white' : '#888'}
              ios_backgroundColor="#333"
            />
          </View>
        </View>

      </ScrollView>

      {/* Bottom Buttons */}
      <View className="flex-row items-center justify-center px-4 py-4 gap-4 pb-8 bg-[#121212]">
        <Pressable 
          onPress={() => router.back()}
          className="flex-1 py-3 rounded-xl border border-[#98FF2F] bg-[#222] items-center"
        >
          <Text className="text-[#98FF2F] font-inter-semibold text-base">Cancel</Text>
        </Pressable>
        <Pressable 
          onPress={handlePost}
          className="flex-1 py-3 rounded-xl bg-[#98FF2F] items-center"
        >
          <Text className="text-black font-inter-semibold text-base">Post</Text>
        </Pressable>
      </View>

    </View>
  );
}
