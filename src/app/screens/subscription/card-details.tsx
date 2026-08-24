import React from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { toast } from 'sonner-native';
import { initStripe, useStripe } from '@stripe/stripe-react-native';
import { Header } from '../../../components/ui/Header';
import { CardDetailsForm } from '../../../components/payment/CardDetailsForm';
import { handleApiError } from '../../../api/client';
import {
  createStripeSubscriptionPaymentIntent,
  verifyStripeSubscriptionPayment,
  type SubscriptionPlanId,
} from '../../../api/subscriptions/subscriptions.api';
import { useAppStore } from '../../../store';

export default function CardDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const planId = String(params.planId || 'monthly') as SubscriptionPlanId;
  const planName = String(params.planName || (planId === 'yearly' ? 'Premium Yearly' : 'Premium Monthly'));

  const handleConfirm = async () => {
    try {
      const currentUser = useAppStore.getState().user;
      const userId = currentUser?.id || currentUser?._id;
      if (!userId) {
        throw new Error('Please login again before buying a subscription.');
      }

      const intent = await createStripeSubscriptionPaymentIntent(planId);
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

      const result = await verifyStripeSubscriptionPayment(intent.paymentIntentId);
      const token = useAppStore.getState().token;
      const refreshToken = useAppStore.getState().refreshToken;
      if (currentUser && token && refreshToken) {
        useAppStore.getState().setAuth(
          token,
          refreshToken,
          {
            ...currentUser,
            subscription: result.subscription,
          },
        );
      }
      router.replace({
        pathname: '/screens/subscription/success',
        params: {
          planId,
          expiresAt: result.subscription.expiresAt || '',
        },
      });
    } catch (error) {
      toast.error(handleApiError(error, 'Subscription payment failed. Please try again.'));
      console.log('Subscription payment failed:', error);
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
