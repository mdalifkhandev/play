import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../../../src/components/ui/Header';
import { CustomButton } from '../../../../src/components/ui/CustomButton';
import { useAppStore } from '../../../../src/store';
import { getCoinBalance } from '../../../../src/api/coins/coins.api';

export default function CoinsSuccessScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  useEffect(() => {
    getCoinBalance()
      .then(balance => useAppStore.getState().setCoinBalance(balance.coinBalance))
      .catch(error => console.log('Coin balance refresh failed:', error));
  }, []);

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 24 }}>
      <Header title="Confirm" showBackButton={false} />
      
      <View className="flex-1 px-6 items-center justify-center -mt-20">
        
        <View className="w-24 h-24 rounded-full bg-[#98D83A] items-center justify-center mb-8 relative">
          <View className="absolute inset-0 bg-[#98D83A] opacity-20 rounded-full scale-150" />
          <Ionicons name="checkmark-sharp" size={48} color="#0A0A0A" />
        </View>

        <Text className="text-white text-3xl font-inter-bold text-center mb-4">
          Purchase Successful!
        </Text>
        
        <Text className="text-gray-400 text-base font-inter-regular text-center leading-relaxed max-w-[300px]">
          Your coin balance has been refreshed. You can now use available coins to support your favorite creators.
        </Text>

      </View>
      
      <View
        className="px-6 w-full"
        style={{ paddingBottom: Math.max(insets.bottom + 16, 32) }}
      >
        <CustomButton 
          title="Back to feed" 
          variant="primary" 
          onPress={() => router.replace('/')} 
        />
      </View>
    </View>
  );
}
