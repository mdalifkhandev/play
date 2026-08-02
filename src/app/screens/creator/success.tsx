import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CustomButton } from '../../../components/ui/CustomButton';

export default function SuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleExplore = () => {
    // Navigate back to profile and set creator mode using URL params
    router.replace({
      pathname: '/(tab)/profile',
      params: { creatorMode: 'true' }
    });
  };

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      
      <ScrollView contentContainerStyle={{ flex: 1, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' }}>
        
        {/* Trophy Icon */}
        <View className="w-40 h-40 rounded-full bg-[#83D616] items-center justify-center mb-8 shadow-lg shadow-[#83D616]/20">
          <Ionicons name="trophy" size={80} color="#222" />
        </View>

        <Text className="text-white text-3xl font-bold mb-2">
          Congratulations!
        </Text>
        <Text className="text-[#83D616] text-2xl font-bold mb-10">
          You're now a Creator
        </Text>

        {/* Unlocked Features */}
        <View className="bg-[#151515] rounded-2xl p-5 w-full border border-[#222] mb-8">
          <Text className="text-[#888] text-xs font-bold tracking-widest mb-4">UNLOCKED FEATURES</Text>

          {/* Ad Revenue */}
          <View className="flex-row items-center mb-5">
            <View className="w-12 h-12 rounded-xl bg-[#222] items-center justify-center mr-4">
              <Ionicons name="cash-outline" size={24} color="#83D616" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-base font-medium mb-1">Ad Revenue</Text>
              <Text className="text-[#888] text-xs">Start earning from video views</Text>
            </View>
          </View>

          {/* Subscription Setup */}
          <View className="flex-row items-center mb-5">
            <View className="w-12 h-12 rounded-xl bg-[#222] items-center justify-center mr-4">
              <Ionicons name="star-outline" size={24} color="#83D616" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-base font-medium mb-1">Subscription Setup</Text>
              <Text className="text-[#888] text-xs">Create exclusive fan memberships</Text>
            </View>
          </View>

          {/* Withdraw Earnings */}
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-xl bg-[#222] items-center justify-center mr-4">
              <Ionicons name="wallet-outline" size={24} color="#83D616" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-base font-medium mb-1">Withdraw Earnings</Text>
              <Text className="text-[#888] text-xs">Direct payouts to your bank account</Text>
            </View>
          </View>
        </View>

        {/* Explore Button */}
        <CustomButton 
          title="Explore Creator Tools" 
          onPress={handleExplore}
          containerStyle="bg-[#83D616] w-full"
          textStyle="text-[#111]"
        />

      </ScrollView>
    </View>
  );
}
