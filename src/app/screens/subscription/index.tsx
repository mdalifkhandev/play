import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Header } from '../../../components/ui/Header';
import { CustomButton } from '../../../components/ui/CustomButton';

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activePlan, setActivePlan] = useState<'Monthly' | 'Yearly'>('Monthly');

  const isYearly = activePlan === 'Yearly';

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <Header title="Subscription" />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* Title Section */}
        <View className="items-center mt-2 mb-6">
          <Text className="text-white text-3xl font-bold mb-2 font-inter-bold">Choose Your Plan</Text>
          <Text className="text-[#888] text-sm text-center">Unlock premium features and exclusive content</Text>
        </View>

        {/* Tabs */}
        <View className="flex-row justify-between mb-8">
          <Pressable 
            onPress={() => setActivePlan('Monthly')}
            className={`flex-1 mr-2 py-3 rounded-xl items-center justify-center border ${
              !isYearly ? 'bg-[#A3E635] border-[#A3E635]' : 'bg-[#151515] border-[#333]'
            }`}
          >
            <Text className={`font-semibold ${!isYearly ? 'text-black' : 'text-[#A3E635]'}`}>Monthly</Text>
          </Pressable>

          <Pressable 
            onPress={() => setActivePlan('Yearly')}
            className={`flex-1 ml-2 py-3 rounded-xl items-center justify-center border ${
              isYearly ? 'bg-[#A3E635] border-[#A3E635]' : 'bg-[#151515] border-[#333]'
            }`}
          >
            <Text className={`font-semibold ${isYearly ? 'text-black' : 'text-[#A3E635]'}`}>Yearly</Text>
          </Pressable>
        </View>

        {/* Plan Card */}
        <View className="bg-[#151515] rounded-3xl p-6 border border-[#222]">
          
          <View className="flex-row items-center mb-6">
            <View className="w-10 h-10 rounded-full bg-[#FDE047] items-center justify-center mr-3">
              <Ionicons name="star" size={20} color="#CA8A04" />
            </View>
            <Text className="text-[#888] text-lg mr-4">{activePlan}</Text>
            {isYearly && (
              <View className="bg-[#2A3B18] px-3 py-1 rounded-md">
                <Text className="text-[#A3E635] text-xs font-bold">15% OFF</Text>
              </View>
            )}
          </View>

          <Text className="text-white text-xl font-bold mb-2">Premium</Text>
          <Text className="text-[#A3E635] text-sm mb-4">Ad-Free Experience</Text>

          <View className="flex-row items-end mb-8">
            <Text className="text-white text-3xl font-bold">{isYearly ? '$254.15' : '$25.00'}</Text>
            <Text className="text-[#888] text-base mb-1 ml-1">{isYearly ? '/year' : '/mo'}</Text>
          </View>

          {/* Features */}
          <View className="mb-8">
            <View className="flex-row items-center mb-5">
              <View className="w-10 h-10 rounded-xl bg-[#DBEAFE] items-center justify-center mr-4">
                <View className="w-4 h-4 rounded-full bg-[#3B82F6]" />
              </View>
              <Text className="text-white text-base">No ads in feed</Text>
            </View>

            <View className="flex-row items-center mb-5">
              <View className="w-10 h-10 rounded-xl border border-[#333] items-center justify-center mr-4">
                <Ionicons name="play-outline" size={20} color="white" />
              </View>
              <Text className="text-white text-base">Uninterrupted watching</Text>
            </View>

            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-xl bg-[#A7F3D0] items-center justify-center mr-4">
                <Ionicons name="shield-checkmark-outline" size={20} color="#047857" />
              </View>
              <Text className="text-white text-base">Premium badge on profile</Text>
            </View>
          </View>

          <CustomButton 
            title="Subscribe now"
            onPress={() => router.push('/screens/subscription/payment-method')}
            containerStyle="bg-[#A3E635] w-full py-4 mt-2"
            textStyle="text-black font-bold text-base"
          />

        </View>

      </ScrollView>
    </View>
  );
}
