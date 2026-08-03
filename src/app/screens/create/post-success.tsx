import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function PostSuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { uri } = useLocalSearchParams<{ uri: string }>();

  const mockImage = uri || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800';

  const handleDone = () => {
    // Reset back to home or camera
    router.dismissAll();
    router.replace('/(tab)/home' as any);
  };

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      
      <View className="flex-1 items-center justify-center px-6">
        
        {/* Success Icon */}
        <View className="w-24 h-24 bg-[#98FF2F] rounded-full items-center justify-center mb-6">
          <Ionicons name="checkmark-sharp" size={64} color="black" />
        </View>

        <Text className="text-white font-inter-bold text-2xl mb-2 text-center">
          Your Post is now live!
        </Text>
        
        <Text className="text-[#888] font-inter-regular text-center mb-8 px-4">
          Shared with your community and the explore feed.
        </Text>

        {/* Thumbnail Preview */}
        <View className="w-full aspect-[3/4] max-h-[400px] rounded-[32px] overflow-hidden mb-8 bg-[#111]">
          <Image 
            source={{ uri: mockImage }} 
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>

        {/* Action Buttons */}
        <View className="w-full gap-4">
          <Pressable 
            onPress={handleDone}
            className="w-full py-4 rounded-xl bg-[#98FF2F] items-center"
          >
            <Text className="text-black font-inter-semibold text-base">Done</Text>
          </Pressable>
          
          <Pressable 
            className="w-full py-4 rounded-xl bg-[#2A2A2A] items-center flex-row justify-center"
          >
            <Ionicons name="share-outline" size={20} color="white" className="mr-2" />
            <Text className="text-white font-inter-semibold text-base ml-2">Share</Text>
          </Pressable>
        </View>

      </View>

    </View>
  );
}
