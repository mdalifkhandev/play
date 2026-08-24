import React from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { toast } from 'sonner-native';
import { initStripe, useStripe } from '@stripe/stripe-react-native';
import { Header } from '../../../../src/components/ui/Header';
import { CardDetailsForm } from '../../../../src/components/payment/CardDetailsForm';
import {
  createStripeCoinPaymentIntent,
  verifyStripeCoinPayment,
  type CoinPackage,
} from '../../../../src/api/coins/coins.api';
import { handleApiError } from '../../../../src/api/client';
import { useAppStore } from '../../../../src/store';

export default function CoinsCardDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
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

      const intent = await createStripeCoinPaymentIntent(coinPackage.id);
      const publishableKey = intent.publishableKey || process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (!publishableKey || !intent.clientSecret) {
        throw new Error('Stripe payment is not configured.');
      }

      await initStripe({
        publishableKey,
        merchantIdentifier: process.env.EXPO_PUBLIC_APPLE_MERCHANT_ID || 'merchant.com.anonymous.play',
      });

      const initResult = await initPaymentSheet({
        merchantDisplayName: 'Play',
        paymentIntentClientSecret: intent.clientSecret,
        applePay: { merchantCountryCode: 'US' },
      });
      if (initResult.error) {
        throw new Error(initResult.error.message);
      }

      const paymentResult = await presentPaymentSheet();
      if (paymentResult.error) {
        throw new Error(paymentResult.error.message);
      }

      const result = await verifyStripeCoinPayment(intent.paymentIntentId);
      useAppStore.getState().setCoinBalance(result.coinBalance);
      router.replace('/screens/coins/success');
    } catch (error) {
      toast.error(handleApiError(error, 'Payment failed. Please try again.'));
      console.log('Stripe coin payment failed:', error);
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
