import React from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Header } from '../../../components/ui/Header';
import { CustomButton } from '../../../components/ui/CustomButton';

export default function AdsSuccessScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    adId?: string;
    budgetUsd?: string;
    title?: string;
  }>();

  const title = params.title || 'Ad Campaign';
  const budgetUsd = params.budgetUsd ? Number(params.budgetUsd) : null;

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <Header title="Order Confirmed" />

      <View className="flex-1 items-center justify-center px-6">
        <View className="w-24 h-24 rounded-full bg-[#A3E635] items-center justify-center mb-6 shadow-lg shadow-[#A3E635]/30">
          <Ionicons name="checkmark" size={52} color="black" />
        </View>

        <Text className="text-white text-3xl font-bold mb-2 font-inter-bold text-center">Payment Successful!</Text>
        <Text className="text-[#888] text-sm text-center px-4 leading-5 mb-8">
          Your ad campaign has been paid and submitted for review. It will start displaying across the feed shortly.
        </Text>

        {/* Confirmation Card */}
        <View className="w-full rounded-2xl border border-white/10 bg-[#161616] p-5 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs font-inter text-white/50">Campaign Name</Text>
            <Text className="text-xs font-inter-semibold text-white max-w-[180px]" numberOfLines={1}>
              {title}
            </Text>
          </View>

          {budgetUsd !== null && (
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs font-inter text-white/50">Amount Paid</Text>
              <Text className="text-sm font-inter-bold text-[#A3E635]">${budgetUsd.toFixed(2)} USD</Text>
            </View>
          )}

          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-inter text-white/50">Status</Text>
            <View className="rounded-full bg-emerald-500/20 px-2.5 py-0.5">
              <Text className="text-[11px] font-inter-semibold text-emerald-400">Paid • In Review</Text>
            </View>
          </View>
        </View>
      </View>

      <View
        className="px-5 w-full"
        style={{ paddingBottom: Math.max(insets.bottom + 16, 32) }}
      >
        <CustomButton
          title="Back to Feed"
          onPress={() => router.replace('/')}
          containerStyle="bg-[#A3E635] w-full py-4 rounded-xl"
          textStyle="text-black font-inter-bold text-base"
        />
      </View>
    </View>
  );
}
