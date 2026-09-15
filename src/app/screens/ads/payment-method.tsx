import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../../components/ui/Header';
import { CustomButton } from '../../../components/ui/CustomButton';
import { useAppStore } from '../../../store';

export default function AdsPaymentMethodScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    adId?: string;
    budgetUsd?: string;
    days?: string;
    title?: string;
    category?: string;
  }>();

  const coinBalance = useAppStore(state => state.coinBalance);
  const budget = Number(params.budgetUsd || 100);
  const coinsRequired = budget * 100;
  const hasEnoughCoins = coinBalance >= coinsRequired;

  const [selectedMethod, setSelectedMethod] = useState<'stripe' | 'coins'>('stripe');

  const handleContinue = () => {
    router.push({
      pathname: '/screens/ads/card-details',
      params: {
        adId: params.adId || '',
        budgetUsd: String(budget),
        days: params.days || '7',
        title: params.title || 'Ad Campaign',
        method: selectedMethod,
      },
    });
  };

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <Header title="Payment Method" />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        className="flex-1 mt-3"
      >
        {/* Campaign Summary Card */}
        <View className="mb-6 rounded-2xl border border-white/10 bg-[#161616] p-5">
          <View className="flex-row items-center justify-between mb-2">
            <View className="rounded-full bg-[#A3E635]/15 px-3 py-1">
              <Text className="text-xs font-inter-semibold text-[#A3E635]">Ad Campaign</Text>
            </View>
            <Text className="text-xs font-inter-medium text-white/50">{params.days || 7} Days</Text>
          </View>
          <Text className="text-lg font-inter-bold text-white mb-1" numberOfLines={1}>
            {params.title || params.category || 'Feed Boost Campaign'}
          </Text>
          <Text className="text-xs font-inter text-white/60 mb-4">Feed placement targeting interested users</Text>

          <View className="h-[1px] bg-white/10 my-1" />

          <View className="flex-row items-baseline justify-between mt-3">
            <Text className="text-sm font-inter-medium text-white/70">Total Budget</Text>
            <View className="flex-row items-baseline">
              <Text className="text-2xl font-inter-bold text-[#A3E635]">${budget}</Text>
              <Text className="text-xs font-inter text-white/50 ml-1">USD</Text>
            </View>
          </View>
        </View>

        <Text className="text-base font-inter-semibold text-white mb-3">Select Payment Method</Text>

        {/* Option 1: Stripe Card / Apple Pay */}
        <Pressable
          onPress={() => setSelectedMethod('stripe')}
          className={`mb-4 flex-row items-center justify-between rounded-2xl border p-4 ${
            selectedMethod === 'stripe' ? 'border-[#A3E635] bg-[#1a2e12]/30' : 'border-white/10 bg-[#161616]'
          }`}
        >
          <View className="flex-row items-center flex-1 mr-3">
            <View className="h-12 w-12 rounded-xl bg-white/10 items-center justify-center mr-3">
              <Ionicons
                name={Platform.OS === 'ios' ? 'logo-apple' : 'card-outline'}
                size={26}
                color={selectedMethod === 'stripe' ? '#A3E635' : '#FFF'}
              />
            </View>
            <View className="flex-1">
              <Text className="text-base font-inter-semibold text-white">
                {Platform.OS === 'ios' ? 'Apple Pay & Cards' : 'Credit / Debit Card'}
              </Text>
              <Text className="text-xs font-inter text-white/50 mt-0.5">Secure payment via Stripe</Text>
            </View>
          </View>

          <View
            className={`h-6 w-6 rounded-full border-2 items-center justify-center ${
              selectedMethod === 'stripe' ? 'border-[#A3E635]' : 'border-white/40'
            }`}
          >
            {selectedMethod === 'stripe' && <View className="h-3 w-3 rounded-full bg-[#A3E635]" />}
          </View>
        </Pressable>

        {/* Option 2: Play Coin Balance */}
        <Pressable
          onPress={() => setSelectedMethod('coins')}
          className={`mb-6 flex-row items-center justify-between rounded-2xl border p-4 ${
            selectedMethod === 'coins' ? 'border-[#A3E635] bg-[#1a2e12]/30' : 'border-white/10 bg-[#161616]'
          }`}
        >
          <View className="flex-row items-center flex-1 mr-3">
            <View className="h-12 w-12 rounded-xl bg-amber-500/15 items-center justify-center mr-3">
              <Ionicons name="wallet-outline" size={26} color="#F59E0B" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-base font-inter-semibold text-white">Play Coins</Text>
                {!hasEnoughCoins && (
                  <View className="ml-2 rounded-full bg-red-500/20 px-2 py-0.5">
                    <Text className="text-[10px] font-inter-semibold text-red-400">Low Balance</Text>
                  </View>
                )}
              </View>
              <Text className="text-xs font-inter text-white/50 mt-0.5">
                Cost: {coinsRequired.toLocaleString()} Coins • Balance: {coinBalance.toLocaleString()}
              </Text>
            </View>
          </View>

          <View
            className={`h-6 w-6 rounded-full border-2 items-center justify-center ${
              selectedMethod === 'coins' ? 'border-[#A3E635]' : 'border-white/40'
            }`}
          >
            {selectedMethod === 'coins' && <View className="h-3 w-3 rounded-full bg-[#A3E635]" />}
          </View>
        </Pressable>
      </ScrollView>

      {/* Bottom Button */}
      <View
        className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-[#0A0A0A] px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <CustomButton
          title={selectedMethod === 'coins' ? `Pay ${coinsRequired.toLocaleString()} Coins` : `Pay $${budget} USD`}
          onPress={handleContinue}
          containerStyle="bg-[#A3E635] w-full py-4 rounded-xl"
          textStyle="text-black font-inter-bold text-base"
        />
      </View>
    </View>
  );
}
