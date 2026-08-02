import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Header } from '../../../components/ui/Header';
import { CustomButton } from '../../../components/ui/CustomButton';

export default function AdsUploadScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#050505]" style={{ paddingTop: insets.top }}>
      <Header title="Ads Management" />

      <View className="flex-1 px-5 mt-4">
        <Text className="text-white text-lg font-medium mb-4">Upload Ad</Text>

        <View className="flex-1 bg-[#0F0F0F] border border-[#222] rounded-3xl items-center justify-center mb-24">
          
          <Pressable className="w-16 h-16 bg-white rounded-2xl items-center justify-center mb-6 shadow-lg">
            <Ionicons name="add" size={32} color="#000" />
          </Pressable>

          <Text className="text-white font-bold text-lg mb-2">Upload Ad here</Text>
          <Text className="text-[#888] text-sm text-center px-8">
            Choose the ad from your files to upload here
          </Text>

        </View>
      </View>

      <View className="absolute bottom-10 left-5 right-5">
        <CustomButton 
          title="Send Request"
          onPress={() => router.push('/screens/ads/payment-method')}
          containerStyle="bg-[#A3E635] w-full py-4 rounded-xl"
          textStyle="text-black font-bold text-base"
        />
      </View>
    </View>
  );
}
