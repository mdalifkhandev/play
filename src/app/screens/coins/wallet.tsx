import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../../../src/components/ui/Header';
import { CustomButton } from '../../../../src/components/ui/CustomButton';
import { useAppStore } from '../../../../src/store';
import { getCoinBalance } from '../../../../src/api/coins/coins.api';

export default function CoinWalletScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const coinBalance = useAppStore((state) => state.coinBalance);

  useEffect(() => {
    let cancelled = false;

    getCoinBalance()
      .then(balance => {
        if (!cancelled) {
          useAppStore.getState().setCoinBalance(balance.coinBalance);
        }
      })
      .catch(error => {
        console.log('Coin balance load failed:', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <Header title="Coin Wallet" />
      
      <View className="px-6 mt-8">
        <View className="bg-[#1C1C1E] rounded-3xl p-8 items-center border border-[#333]">
          
          <View className="w-16 h-16 rounded-full bg-[#2A2A2C] border border-[#444] items-center justify-center mb-6">
            <View className="w-8 h-8 rounded-full bg-[#FFD700] items-center justify-center">
              <Text className="text-black font-inter-bold text-lg">$</Text>
            </View>
          </View>
          
          <Text className="text-white text-sm font-inter-medium tracking-widest mb-4">
            YOUR BALANCE
          </Text>
          
          <Text className="text-white text-4xl font-inter-bold mb-8">
            {coinBalance} <Text className="text-[#98D83A] text-xl">Coins</Text>
          </Text>
          
          <CustomButton 
            title="Buy Coins" 
            variant="primary" 
            onPress={() => router.push('/screens/coins/buy')} 
            containerStyle="w-full"
          />
        </View>
      </View>
    </View>
  );
}
