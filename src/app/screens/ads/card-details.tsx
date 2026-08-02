import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Header } from '../../../components/ui/Header';
import { CardDetailsForm } from '../../../components/payment/CardDetailsForm';

export default function AdsCardDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <Header title="Payment" />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <CardDetailsForm onConfirm={() => router.push('/screens/ads/success')} />
      </ScrollView>
    </View>
  );
}
