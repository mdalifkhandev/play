import React from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { toast } from 'sonner-native';
import { Header } from '../../../components/ui/Header';
import { CardDetailsForm } from '../../../components/payment/CardDetailsForm';
import { handleApiError } from '../../../api/client';
import { requestSquareSourceId } from '../../../api/coins/squarePayment';
import { createSquareSubscriptionPayment, type SubscriptionPlanId } from '../../../api/subscriptions/subscriptions.api';
import { useAppStore } from '../../../store';

export default function CardDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const planId = String(params.planId || 'monthly') as SubscriptionPlanId;
  const planName = String(params.planName || (planId === 'yearly' ? 'Premium Yearly' : 'Premium Monthly'));
  const price = Number(params.price || (planId === 'yearly' ? 254.15 : 25));
  const currency = String(params.currency || 'usd');

  const handleConfirm = async () => {
    try {
      const sourceId = await requestSquareSourceId({
        id: planId,
        name: planName,
        coins: 0,
        price,
        currency,
        isPopular: false,
        sortOrder: 0,
      });
      const result = await createSquareSubscriptionPayment({ planId, sourceId });
      const currentUser = useAppStore.getState().user;
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
