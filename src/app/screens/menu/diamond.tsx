import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { convertDiamonds, getDiamondBalance } from '../../../api/coins/coins.api';
import { Header } from '../../../components/ui/Header';

export default function DiamondScreen() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 34) + 24;
  const [amount, setAmount] = useState('');
  const [availableDiamonds, setAvailableDiamonds] = useState(0);
  const [diamondsPerDollar, setDiamondsPerDollar] = useState(100);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const numericAmount = Number(amount.replace(/[^0-9]/g, ''));

  const loadBalance = useCallback(async (refreshing = false) => {
    try {
      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const balance = await getDiamondBalance();
      setAvailableDiamonds(balance.diamondBalance);
      setDiamondsPerDollar(balance.diamondsPerDollar || 100);
    } catch (error) {
      console.error('Failed to load diamond balance:', error);
      Alert.alert('Alert', 'Diamond balance could not be loaded.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  const cashValue = useMemo(() => {
    const safeAmount = Number.isFinite(numericAmount) ? numericAmount : 0;
    return safeAmount / diamondsPerDollar;
  }, [diamondsPerDollar, numericAmount]);

  const handleConvert = useCallback(async () => {
    if (!numericAmount || numericAmount > availableDiamonds || isConverting) {
      return;
    }

    try {
      setIsConverting(true);
      const result = await convertDiamonds(numericAmount);
      setAvailableDiamonds(result.diamondBalance);
      setDiamondsPerDollar(result.diamondsPerDollar || diamondsPerDollar);
      setAmount('');
      Alert.alert('Success', `$${result.amountUsd.toFixed(2)} has been added to your balance.`);
    } catch (error) {
      console.error('Failed to convert diamonds:', error);
      Alert.alert('Alert', 'Diamonds could not be converted.');
    } finally {
      setIsConverting(false);
    }
  }, [availableDiamonds, diamondsPerDollar, isConverting, numericAmount]);

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <Header title="Live Gifts" />

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: bottomPadding }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => loadBalance(true)} tintColor="#98FF2F" />
        }
      >
        <View className="rounded-xl border border-[#3A3A3A] bg-[#171717] px-5 py-8">
          <Text className="text-white text-base font-inter-semibold mb-4">Available Diamonds</Text>
          <View className="flex-row items-center">
            <Text className="text-2xl mr-3">💎</Text>
            {isLoading ? (
              <ActivityIndicator color="#98FF2F" />
            ) : (
              <Text className="text-white text-3xl font-inter-bold">{availableDiamonds.toLocaleString()}</Text>
            )}
          </View>

          <View className="self-start mt-8 rounded-full border border-[#98FF2F] px-4 py-2">
            <Text className="text-[#98FF2F] text-sm font-inter-medium">ⓘ {diamondsPerDollar} Diamonds = $1.00 USD</Text>
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
            disabled={!numericAmount || numericAmount > availableDiamonds || isConverting}
            onPress={handleConvert}
            className="h-12 rounded-lg items-center justify-center bg-[#98FF2F]"
            style={{ opacity: !numericAmount || numericAmount > availableDiamonds || isConverting ? 0.55 : 1 }}
          >
            {isConverting ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text className="text-black text-base font-inter-semibold">Convert Now</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
