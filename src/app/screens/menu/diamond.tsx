import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Header } from '../../../components/ui/Header';

const DIAMONDS_PER_DOLLAR = 100;
const AVAILABLE_DIAMONDS = 24500;

export default function DiamondScreen() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 34) + 24;
  const [amount, setAmount] = useState('');
  const numericAmount = Number(amount.replace(/[^0-9]/g, ''));
  const cashValue = useMemo(() => {
    const safeAmount = Number.isFinite(numericAmount) ? numericAmount : 0;
    return safeAmount / DIAMONDS_PER_DOLLAR;
  }, [numericAmount]);

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <Header title="Live Gifts" />

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: bottomPadding }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="rounded-xl border border-[#3A3A3A] bg-[#171717] px-5 py-8">
          <Text className="text-white text-base font-inter-semibold mb-4">Available Diamonds</Text>
          <View className="flex-row items-center">
            <Text className="text-2xl mr-3">💎</Text>
            <Text className="text-white text-3xl font-inter-bold">{AVAILABLE_DIAMONDS.toLocaleString()}</Text>
          </View>

          <View className="self-start mt-8 rounded-full border border-[#98FF2F] px-4 py-2">
            <Text className="text-[#98FF2F] text-sm font-inter-medium">ⓘ 100 Diamonds = $1.00 USD</Text>
          </View>
        </View>

        <Text className="text-[#CFCFCF] text-sm font-inter-regular mt-7 mb-2">Enter amount to convert</Text>
        <View className="rounded-xl border border-[#3A3A3A] bg-[#171717] px-5 h-14 flex-row items-center">
          <Text className="text-xl mr-3">💎</Text>
          <TextInput
            value={amount}
            onChangeText={(value) => setAmount(value.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="#FFFFFF"
            className="flex-1 text-white text-base font-inter-regular"
          />
        </View>

        <View className="rounded-xl border border-[#3A3A3A] bg-[#171717] px-5 py-7 mt-6">
          <Text className="text-white text-base font-inter-semibold mb-5">Cash Value</Text>
          <Text className="text-white text-3xl font-inter-bold">${cashValue.toFixed(2)}</Text>
        </View>

        <View className="flex-1 justify-end mt-8">
          <Text className="text-white text-sm font-inter-regular text-center leading-5 mb-6">
            Conversions are final and cannot be reversed. By proceeding, you agree to our creator compensation terms!
          </Text>

          <Pressable
            disabled={!numericAmount || numericAmount > AVAILABLE_DIAMONDS}
            className="h-12 rounded-lg items-center justify-center bg-[#98FF2F]"
            style={{ opacity: !numericAmount || numericAmount > AVAILABLE_DIAMONDS ? 0.55 : 1 }}
          >
            <Text className="text-black text-base font-inter-semibold">Convert Now</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
