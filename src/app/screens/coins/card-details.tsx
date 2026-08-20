import React from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { toast } from 'sonner-native';
import { Header } from '../../../../src/components/ui/Header';
import { CardDetailsForm } from '../../../../src/components/payment/CardDetailsForm';
import { createSquareCoinPayment, type CoinPackage } from '../../../../src/api/coins/coins.api';
import { handleApiError } from '../../../../src/api/client';
import { requestSquareSourceId } from '../../../../src/api/coins/squarePayment';
import { useAppStore } from '../../../../src/store';

export default function CoinsCardDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const coinPackage: CoinPackage = {
    id: String(params.packageId || ''),
    name: `${String(params.coins || '0')} Coins`,
    coins: Number(params.coins || 0),
    price: Number(params.price || 0),
    currency: String(params.currency || 'usd'),
    isPopular: false,
    sortOrder: 0,
  };

  const handleConfirm = async () => {
    try {
      if (!coinPackage.id || !coinPackage.coins || !coinPackage.price) {
        toast.error('Please select a coin package again.');
        router.back();
        return;
      }

      const sourceId = await requestSquareSourceId(coinPackage);
      const result = await createSquareCoinPayment({ packageId: coinPackage.id, sourceId });
      useAppStore.getState().setCoinBalance(result.coinBalance);
      router.replace('/screens/coins/success');
    } catch (error) {
      toast.error(handleApiError(error, 'Payment failed. Please try again.'));
      console.log('Square coin payment failed:', error);
    }
  };

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <Header title="Payment" />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <CardDetailsForm onConfirm={handleConfirm} />
      </ScrollView>
    </View>
  );
}
