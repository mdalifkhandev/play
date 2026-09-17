import React, { useState } from 'react';
import { View, ScrollView, Text, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { toast } from 'sonner-native';
import { initStripe, useStripe } from '@stripe/stripe-react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../../components/ui/Header';
import { CustomButton } from '../../../components/ui/CustomButton';
import { createAdPaymentIntent, verifyAdStripePayment, payAdWithCoins } from '../../../api/ads/ads.api';
import { handleApiError } from '../../../api/client';
import { useAppStore } from '../../../store';

export default function AdsCardDetailsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    adId?: string;
    budgetUsd?: string;
    days?: string;
    title?: string;
    method?: 'stripe' | 'coins';
  }>();

  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [isProcessing, setIsProcessing] = useState(false);

  const coinBalance = useAppStore(state => state.coinBalance);
  const adId = params.adId || '';
  const budgetUsd = Number(params.budgetUsd || 100);
  const days = Number(params.days || 7);
  const title = params.title || 'Ad Campaign';
  const method = params.method || 'stripe';
  const coinsRequired = budgetUsd * 100;

  const handlePay = async () => {
    if (isProcessing) return;
    if (!adId) {
      toast.error('Invalid ad campaign. Please try again.');
      router.back();
      return;
    }

    setIsProcessing(true);
    try {
      if (method === 'coins') {
        if (coinBalance < coinsRequired) {
          toast.error(`Insufficient coins. You have ${coinBalance.toLocaleString()} but need ${coinsRequired.toLocaleString()} coins.`);
          return;
        }

        const result = await payAdWithCoins(adId);
        useAppStore.getState().setCoinBalance(result.coinBalance);
        toast.success('Payment successful with Play Coins!');
        router.replace({
          pathname: '/screens/ads/success',
          params: { adId, budgetUsd: String(budgetUsd), title },
        });
        return;
      }

      // Stripe Payment Flow
      const intent = await createAdPaymentIntent(adId);
      const publishableKey = intent.publishableKey || process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

      if (!publishableKey || !intent.clientSecret) {
        throw new Error('Stripe payment is not properly configured on this server.');
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
        // User cancelled or card declined
        if (paymentResult.error.code === 'Canceled') {
          toast.info('Payment was cancelled.');
          return;
        }
        throw new Error(paymentResult.error.message);
      }

      // Verify payment on backend
      await verifyAdStripePayment(adId, intent.paymentIntentId);
      toast.success('Payment successful!');
      router.replace({
        pathname: '/screens/ads/success',
        params: { adId, budgetUsd: String(budgetUsd), title },
      });
    } catch (error) {
      console.log('[AD_PAYMENT] failed:', error);
      toast.error(handleApiError(error, 'Payment failed. Please try again.'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <Header title="Confirm Payment" />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        className="flex-1 mt-3"
      >
        {/* Order Summary */}
        <View className="mb-6 rounded-2xl border border-white/10 bg-[#161616] p-5">
          <Text className="text-xs font-inter-semibold text-[#A3E635] uppercase mb-1">Order Details</Text>
          <Text className="text-lg font-inter-bold text-white mb-1" numberOfLines={2}>
            {title}
          </Text>
          <Text className="text-xs font-inter text-white/60 mb-4">{days} Days Campaign Duration</Text>

          <View className="h-[1px] bg-white/10 my-2" />

          <View className="flex-row items-center justify-between mt-2">
            <Text className="text-sm font-inter text-white/70">Payment Amount</Text>
            <Text className="text-xl font-inter-bold text-[#A3E635]">
              {method === 'coins' ? `${coinsRequired.toLocaleString()} Coins` : `$${budgetUsd.toFixed(2)} USD`}
            </Text>
          </View>
        </View>

        {/* Payment Info Card */}
        {method === 'stripe' ? (
          <View className="rounded-2xl border border-white/10 bg-[#161616] p-5 mb-6">
            <View className="flex-row items-center mb-3">
              <Ionicons
                name={Platform.OS === 'ios' ? 'logo-apple' : 'card'}
                size={24}
                color="#A3E635"
                className="mr-2"
              />
              <Text className="text-base font-inter-semibold text-white ml-2">
                {Platform.OS === 'ios' ? 'Apple Pay & Card Checkout' : 'Stripe Secure Checkout'}
              </Text>
            </View>
            <Text className="text-xs font-inter text-white/60 leading-5">
              Tapping "Confirm & Pay" will open Stripe's encrypted payment window to enter your card details or checkout securely with Apple Pay.
            </Text>
            <View className="flex-row items-center mt-4">
              <Ionicons name="shield-checkmark" size={16} color="#A3E635" />
              <Text className="text-xs font-inter-medium text-white/70 ml-2">256-bit SSL Encrypted & PCI Compliant</Text>
            </View>
          </View>
        ) : (
          <View className="rounded-2xl border border-white/10 bg-[#161616] p-5 mb-6">
            <View className="flex-row items-center mb-3">
              <Ionicons name="wallet" size={24} color="#F59E0B" className="mr-2" />
              <Text className="text-base font-inter-semibold text-white ml-2">Play Coins Payment</Text>
            </View>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs font-inter text-white/60">Current Coin Balance</Text>
              <Text className="text-sm font-inter-bold text-white">{coinBalance.toLocaleString()} Coins</Text>
            </View>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs font-inter text-white/60">Coins to Deduct</Text>
              <Text className="text-sm font-inter-bold text-[#A3E635]">- {coinsRequired.toLocaleString()} Coins</Text>
            </View>
            <View className="h-[1px] bg-white/10 my-2" />
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-inter text-white/60">Remaining Balance</Text>
              <Text className="text-sm font-inter-bold text-white">
                {Math.max(0, coinBalance - coinsRequired).toLocaleString()} Coins
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Button */}
      <View
        className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-[#0A0A0A] px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <CustomButton
          title={
            isProcessing
              ? 'Processing Payment...'
              : method === 'coins'
              ? `Confirm & Pay ${coinsRequired.toLocaleString()} Coins`
              : `Confirm & Pay $${budgetUsd.toFixed(2)}`
          }
          onPress={handlePay}
          disabled={isProcessing}
          containerStyle="bg-[#A3E635] w-full py-4 rounded-xl"
          textStyle="text-black font-inter-bold text-base"
        />
        {isProcessing && (
          <View className="mt-2 items-center">
            <ActivityIndicator color="#A3E635" size="small" />
          </View>
        )}
      </View>
    </View>
  );
}
