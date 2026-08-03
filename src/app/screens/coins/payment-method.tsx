import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Header } from '../../../../src/components/ui/Header';
import { PaymentMethodSelection } from '../../../../src/components/payment/PaymentMethodSelection';

export default function CoinsPaymentMethodScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <Header title="Payment" />
      <PaymentMethodSelection onContinue={() => router.push('/screens/coins/card-details')} />
    </View>
  );
}
