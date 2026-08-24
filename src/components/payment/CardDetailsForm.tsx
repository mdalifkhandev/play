import React, { useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomButton } from '../ui/CustomButton';

interface CardDetailsFormProps {
  onConfirm: () => void;
}

export function CardDetailsForm({ onConfirm }: CardDetailsFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const paymentLabel = Platform.OS === 'ios' ? 'Apple Pay' : 'Stripe Card';

  const handleConfirm = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await onConfirm();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View>
      <Text className="text-white text-base font-medium mb-4 mt-2">Choose a Payment Method</Text>

      <View className="flex-row mb-6">
        <View className="border border-[#A3E635] bg-[#151515] rounded-xl px-4 py-3 w-32 items-center justify-center">
          <Ionicons name={Platform.OS === 'ios' ? 'logo-apple' : 'card-outline'} size={24} color="#A3E635" className="mb-1" />
          <Text className="text-[#A3E635] text-xs">{paymentLabel}</Text>
        </View>
      </View>

      <View className="mb-8 border border-[#333] bg-[#151515] rounded-xl px-4 py-5">
        <Text className="text-white text-base font-medium mb-2">{paymentLabel}</Text>
        <Text className="text-[#888] text-sm leading-5">
          {Platform.OS === 'ios'
            ? 'Tap confirm to pay securely with Apple Pay.'
            : 'Tap confirm to open the secure Stripe payment screen.'}
        </Text>
      </View>

      <CustomButton 
        title={isProcessing ? 'Processing...' : 'Confirm'}
        onPress={handleConfirm}
        disabled={isProcessing}
        containerStyle="bg-[#A3E635] w-full py-4"
        textStyle="text-black font-bold text-base"
      />
    </View>
  );
}
