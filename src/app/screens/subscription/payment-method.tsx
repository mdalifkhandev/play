import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Header } from '../../../components/ui/Header';
import { CustomButton } from '../../../components/ui/CustomButton';

export default function PaymentMethodScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selected, setSelected] = useState(true);

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <Header title="Payment" />

      <View className="px-5 flex-1 mt-4">
        <Text className="text-white text-base font-medium mb-4">Select Your Payment Method</Text>

        <Pressable 
          onPress={() => setSelected(!selected)}
          className="flex-row items-center justify-between bg-[#151515] border border-[#333] rounded-xl p-4 mb-8"
        >
          <View className="flex-row items-center">
            <Ionicons name="card-outline" size={24} color="#A3E635" />
            <Text className="text-white text-base ml-3 font-medium">Payment Stripe</Text>
          </View>
          
          <View className="w-6 h-6 rounded-full border-2 border-[#A3E635] items-center justify-center">
            {selected && <View className="w-3 h-3 rounded-full bg-[#A3E635]" />}
          </View>
        </Pressable>

        <CustomButton 
          title="Continue"
          onPress={() => router.push('/screens/subscription/card-details')}
          containerStyle="bg-[#A3E635] w-full py-4"
          textStyle="text-black font-bold text-base"
        />
      </View>
    </View>
  );
}
