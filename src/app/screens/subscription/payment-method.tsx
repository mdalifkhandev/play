import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Header } from '../../../components/ui/Header';
import { PaymentMethodSelection } from '../../../components/payment/PaymentMethodSelection';

export default function PaymentMethodScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <Header title="Payment" />
      <PaymentMethodSelection onContinue={() => router.push({ pathname: '/screens/subscription/card-details', params })} />
    </View>
  );
}
