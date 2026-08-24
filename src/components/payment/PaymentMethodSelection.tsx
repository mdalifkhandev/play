import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomButton } from '../ui/CustomButton';

interface PaymentMethodSelectionProps {
  onContinue: () => void;
}

export function PaymentMethodSelection({ onContinue }: PaymentMethodSelectionProps) {
  const [selected, setSelected] = useState(true);
  const paymentName = Platform.OS === 'ios' ? 'Apple Pay' : 'Stripe Card';
  const iconName = Platform.OS === 'ios' ? 'logo-apple' : 'card-outline';

  return (
    <View className="px-5 flex-1 mt-4">
      <Text className="text-white text-base font-medium mb-4">Select Your Payment Method</Text>

      <Pressable 
        onPress={() => setSelected(!selected)}
        className="flex-row items-center justify-between bg-[#151515] border border-[#333] rounded-xl p-4 mb-8"
      >
        <View className="flex-row items-center">
          <Ionicons name={iconName} size={24} color="#A3E635" />
          <Text className="text-white text-base ml-3 font-medium">{paymentName}</Text>
        </View>
        
        <View className="w-6 h-6 rounded-full border-2 border-[#A3E635] items-center justify-center">
          {selected && <View className="w-3 h-3 rounded-full bg-[#A3E635]" />}
        </View>
      </Pressable>

      <CustomButton 
        title="Continue"
        onPress={onContinue}
        containerStyle="bg-[#A3E635] w-full py-4"
        textStyle="text-black font-bold text-base"
      />
    </View>
  );
}
