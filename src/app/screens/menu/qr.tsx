import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function QRScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const DUMMY_AVATAR = { uri: 'https://i.pravatar.cc/150?img=11' };

  return (
    <LinearGradient
      colors={['#A3E635', '#0A0A0A']}
      style={{ flex: 1, paddingTop: insets.top }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Pressable className="p-2 -mr-2">
          <Ionicons name="scan" size={24} color="white" />
        </Pressable>
      </View>

      <View className="flex-1 items-center justify-center px-6">
        
        {/* QR Card */}
        <View className="w-full bg-[#151515] rounded-3xl p-6 items-center mt-12 relative pb-10">
          
          {/* Avatar floating top */}
          <View className="absolute -top-12">
            <Image 
              source={DUMMY_AVATAR} 
              className="w-24 h-24 rounded-full border-4 border-[#151515]" 
            />
          </View>

          <Text className="text-white text-xl font-bold mt-14">Jodu miyaa</Text>
          <Text className="text-[#888] text-base mb-8">@Jodumiyaa</Text>

          {/* Dummy QR Code */}
          <View className="w-64 h-64 bg-white rounded-2xl items-center justify-center mb-8">
             <Ionicons name="qr-code" size={200} color="#151515" />
          </View>

          <View className="flex-row items-center">
            <Ionicons name="play" size={16} color="white" />
            <Text className="text-white ml-2 font-medium">Play</Text>
          </View>
        </View>

        {/* Bottom Actions */}
        <View className="flex-row items-center justify-between w-full mt-10">
          <Pressable className="flex-1 bg-[#151515] rounded-2xl py-4 mr-2 items-center justify-center">
            <Ionicons name="link" size={24} color="white" className="mb-2" />
            <Text className="text-white font-medium mt-1">Copy link</Text>
          </Pressable>
          <Pressable className="flex-1 bg-[#151515] rounded-2xl py-4 ml-2 items-center justify-center">
            <Ionicons name="share-social" size={24} color="white" className="mb-2" />
            <Text className="text-white font-medium mt-1">Share link</Text>
          </Pressable>
        </View>

      </View>
    </LinearGradient>
  );
}
