import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../../components/ui/Header';
import { CustomButton } from '../../../components/ui/CustomButton';
import { useAppStore } from '../../../store';

export default function AdsPaymentMethodScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    adId?: string;
    budgetUsd?: string;
    days?: string;
    title?: string;
    category?: string;
  }>();

  const coinBalance = useAppStore((state) => state.coinBalance);
  const budget = Number(params.budgetUsd || 10);
  const durationDays = Number(params.days || 7);
  const dailySpend = (budget / (durationDays || 1)).toFixed(2);
  const coinsRequired = budget * 100;
  const hasEnoughCoins = coinBalance >= coinsRequired;

  const [selectedMethod, setSelectedMethod] = useState<'stripe' | 'coins'>('stripe');

  const handleContinue = () => {
    router.push({
      pathname: '/screens/ads/card-details',
      params: {
        adId: params.adId || '',
        budgetUsd: String(budget),
        days: String(durationDays),
        title: params.title || 'Ad Campaign',
        method: selectedMethod,
      },
    });
  };

  return (
    <View className="flex-1 bg-[#070707]" style={{ paddingTop: insets.top }}>
      <Header title="Review & Payment" />

      {/* Step Progress Header (Facebook Boost Style) */}
      <View className="px-5 pt-1 pb-3 border-b border-white/5 bg-[#0A0A0A]">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <View className="bg-[#A3E635]/15 border border-[#A3E635]/30 rounded-full px-2.5 py-0.5">
              <Text className="text-[#A3E635] text-[11px] font-inter-bold">STEP 3 OF 3</Text>
            </View>
            <Text className="text-white text-xs font-inter-semibold">Review & Pay</Text>
          </View>
          <Text className="text-[#A3E635] text-xs font-inter-bold">Final Step</Text>
        </View>
        {/* Progress Bar (100%) */}
        <View className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
          <View className="h-full bg-[#A3E635] rounded-full" style={{ width: '100%' }} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom + 110, 130),
        }}
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        {/* Itemized Facebook-Style Campaign Invoice Card */}
        <View className="mb-6 rounded-3xl border border-white/10 bg-[#121212] p-5 shadow-lg">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <View className="rounded-full bg-[#A3E635]/15 border border-[#A3E635]/30 px-2.5 py-0.5">
                <Text className="text-[10px] font-inter-bold text-[#A3E635] tracking-wider uppercase">
                  Sponsored Feed Ad
                </Text>
              </View>
              <View className="bg-white/10 rounded-full px-2 py-0.5">
                <Text className="text-[10px] font-inter text-white/70">
                  {params.category || 'General'}
                </Text>
              </View>
            </View>
            <Text className="text-xs font-inter-bold text-[#AAA]">{durationDays} Days</Text>
          </View>

          <Text className="text-lg font-inter-bold text-white mb-1" numberOfLines={1}>
            {params.title || 'Feed Boost Promotion'}
          </Text>
          <Text className="text-xs font-inter text-[#777] mb-4">
            Native video & reel feed placement targeting high-intent accounts.
          </Text>

          <View className="h-[1px] bg-white/10 my-1" />

          {/* Itemized Line Items */}
          <View className="py-3 gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-inter text-[#888]">Campaign Duration</Text>
              <Text className="text-xs font-inter-medium text-white">{durationDays} Days</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-inter text-[#888]">Average Daily Spend</Text>
              <Text className="text-xs font-inter-medium text-white">~${dailySpend} / day</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-inter text-[#888]">Taxes & Fees</Text>
              <Text className="text-xs font-inter-medium text-emerald-400">Included ($0.00)</Text>
            </View>
          </View>

          <View className="h-[1px] bg-white/10 my-1" />

          {/* Total Row */}
          <View className="flex-row items-baseline justify-between mt-3">
            <View>
              <Text className="text-sm font-inter-bold text-white">Total Amount Due</Text>
              <Text className="text-[11px] font-inter text-[#777]">One-time campaign payment</Text>
            </View>
            <View className="flex-row items-baseline">
              <Text className="text-2xl font-inter-bold text-[#A3E635]">${budget}</Text>
              <Text className="text-xs font-inter text-white/60 ml-1">USD</Text>
            </View>
          </View>
        </View>

        {/* Payment Methods Section */}
        <Text className="text-base font-inter-bold text-white mb-3">Choose Payment Method</Text>

        {/* Option 1: Stripe Credit/Debit Card & Apple Pay */}
        <Pressable
          onPress={() => setSelectedMethod('stripe')}
          className={`mb-3.5 flex-row items-center justify-between rounded-2xl border p-4 transition-all ${
            selectedMethod === 'stripe'
              ? 'border-[#A3E635] bg-[#14230e]/70'
              : 'border-white/10 bg-[#121212] active:bg-[#181818]'
          }`}
        >
          <View className="flex-row items-center flex-1 mr-3">
            <View className="h-12 w-12 rounded-xl bg-white/10 items-center justify-center mr-3">
              <Ionicons
                name={Platform.OS === 'ios' ? 'logo-apple' : 'card-outline'}
                size={24}
                color={selectedMethod === 'stripe' ? '#A3E635' : '#FFF'}
              />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-base font-inter-semibold text-white">
                  {Platform.OS === 'ios' ? 'Apple Pay / Cards' : 'Credit / Debit Card'}
                </Text>
                <View className="bg-white/10 rounded px-1.5 py-0.5">
                  <Text className="text-[9px] font-inter-bold text-white/80">STRIPE</Text>
                </View>
              </View>
              <Text className="text-xs font-inter text-[#888] mt-0.5">
                Instant activation • Visa, Mastercard, Amex
              </Text>
            </View>
          </View>

          <View
            className={`h-6 w-6 rounded-full border-2 items-center justify-center ${
              selectedMethod === 'stripe' ? 'border-[#A3E635]' : 'border-white/30'
            }`}
          >
            {selectedMethod === 'stripe' && (
              <View className="h-3 w-3 rounded-full bg-[#A3E635]" />
            )}
          </View>
        </Pressable>

        {/* Option 2: Play Coin Balance */}
        <Pressable
          onPress={() => setSelectedMethod('coins')}
          className={`mb-6 flex-row items-center justify-between rounded-2xl border p-4 transition-all ${
            selectedMethod === 'coins'
              ? 'border-[#A3E635] bg-[#14230e]/70'
              : 'border-white/10 bg-[#121212] active:bg-[#181818]'
          }`}
        >
          <View className="flex-row items-center flex-1 mr-3">
            <View className="h-12 w-12 rounded-xl bg-amber-500/15 items-center justify-center mr-3">
              <Ionicons name="wallet-outline" size={24} color="#F59E0B" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-base font-inter-semibold text-white">Play Coins</Text>
                {!hasEnoughCoins && (
                  <View className="ml-2 rounded-full bg-red-500/20 px-2 py-0.5">
                    <Text className="text-[10px] font-inter-semibold text-red-400">
                      Low Balance
                    </Text>
                  </View>
                )}
              </View>
              <Text className="text-xs font-inter text-[#888] mt-0.5">
                Cost: {coinsRequired.toLocaleString()} Coins • Balance:{' '}
                {coinBalance.toLocaleString()}
              </Text>
            </View>
          </View>

          <View
            className={`h-6 w-6 rounded-full border-2 items-center justify-center ${
              selectedMethod === 'coins' ? 'border-[#A3E635]' : 'border-white/30'
            }`}
          >
            {selectedMethod === 'coins' && (
              <View className="h-3 w-3 rounded-full bg-[#A3E635]" />
            )}
          </View>
        </Pressable>

        {/* Trust & Security Badge */}
        <View className="flex-row items-center justify-center gap-2 py-2">
          <Ionicons name="shield-checkmark-outline" size={16} color="#A3E635" />
          <Text className="text-[#888] text-xs font-inter">
            256-Bit SSL Encrypted & Secure Checkout
          </Text>
        </View>
      </ScrollView>

      {/* Floating Facebook-Style Sticky Action Footer */}
      <View
        className="absolute left-0 right-0 border-t border-white/10 bg-[#0A0A0A]/95 px-5 pt-3 backdrop-blur-lg"
        style={{ bottom: 0, paddingBottom: Math.max(insets.bottom + 12, 20) }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-[#888] text-[11px] font-inter">TOTAL TO PAY</Text>
            <Text className="text-white font-inter-bold text-xl">
              {selectedMethod === 'coins'
                ? `${coinsRequired.toLocaleString()} Coins`
                : `$${budget} USD`}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-[#888] text-[11px] font-inter">METHOD</Text>
            <Text className="text-[#A3E635] text-xs font-inter-bold uppercase">
              {selectedMethod === 'coins' ? 'Play Coins' : 'Card / Stripe'}
            </Text>
          </View>
        </View>

        <CustomButton
          title={
            selectedMethod === 'coins'
              ? `Pay ${coinsRequired.toLocaleString()} Coins Now 🔒`
              : `Pay $${budget} USD Now 🔒`
          }
          onPress={handleContinue}
          disabled={selectedMethod === 'coins' && !hasEnoughCoins}
          containerStyle={`w-full py-4 rounded-2xl shadow-lg ${
            selectedMethod === 'coins' && !hasEnoughCoins
              ? 'bg-white/20'
              : 'bg-[#A3E635] shadow-[#A3E635]/20'
          }`}
          textStyle={`font-inter-bold text-base ${
            selectedMethod === 'coins' && !hasEnoughCoins ? 'text-white/40' : 'text-black'
          }`}
        />
      </View>
    </View>
  );
}
