import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CustomButton } from '../ui/CustomButton';

interface CardDetailsFormProps {
  onConfirm: () => void;
}

export function CardDetailsForm({ onConfirm }: CardDetailsFormProps) {
  const [cardNumber, setCardNumber] = useState('43 837 8398  787');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  return (
    <View>
      <Text className="text-white text-base font-medium mb-4 mt-2">Choose a Payment Method</Text>

      <View className="flex-row mb-6">
        <View className="border border-[#A3E635] bg-[#151515] rounded-xl px-4 py-3 mr-3 w-28 items-center justify-center">
          <Ionicons name="card-outline" size={24} color="#A3E635" className="mb-1" />
          <Text className="text-[#A3E635] text-xs">Card</Text>
        </View>
        <View className="border border-[#333] bg-[#151515] rounded-xl px-4 py-3 mr-3 w-28 items-center justify-center">
          <Text className="text-[#E91E63] font-bold italic mb-1">iDEAL</Text>
          <Text className="text-[#666] text-xs">iDEAL</Text>
        </View>
        <View className="border border-[#333] bg-[#151515] rounded-xl px-4 py-3 w-28 items-center justify-center">
          <Text className="text-white font-bold mb-1">Bancontact</Text>
          <Text className="text-[#666] text-xs">bancontact</Text>
        </View>
      </View>

      <View className="mb-5">
        <Text className="text-white text-base font-medium mb-2">Card number</Text>
        <View className="flex-row items-center border border-[#333] bg-[#151515] rounded-xl px-4 h-16">
          <TextInput 
            value={cardNumber}
            onChangeText={setCardNumber}
            placeholder="0000 0000 0000 0000"
            placeholderTextColor="#666"
            className="flex-1 text-white text-lg font-medium"
            keyboardType="number-pad"
          />
          <View className="flex-row items-center ml-2">
            <View className="bg-white rounded px-1.5 py-0.5 mr-1">
              <Text className="text-[#1A1F71] font-bold text-[10px]">VISA</Text>
            </View>
            <View className="bg-[#FF5F00] rounded-full w-4 h-4 -mr-1 z-10 opacity-90" />
            <View className="bg-[#EB001B] rounded-full w-4 h-4 opacity-90" />
          </View>
        </View>
      </View>

      <View className="mb-5">
        <Text className="text-white text-base font-medium mb-2">Expiration Date</Text>
        <View className="border border-[#333] bg-[#151515] rounded-xl px-4 h-16 justify-center">
          <TextInput 
            value={expiry}
            onChangeText={setExpiry}
            placeholder="MM/YY"
            placeholderTextColor="#666"
            className="text-white text-base"
          />
        </View>
      </View>

      <View className="mb-8">
        <Text className="text-white text-base font-medium mb-2">Security Code</Text>
        <View className="border border-[#333] bg-[#151515] rounded-xl px-4 h-16 justify-center">
          <TextInput 
            value={cvc}
            onChangeText={setCvc}
            placeholder="CVC"
            placeholderTextColor="#666"
            className="text-white text-base"
            keyboardType="number-pad"
            maxLength={4}
          />
        </View>
      </View>

      <CustomButton 
        title="Confirm"
        onPress={onConfirm}
        containerStyle="bg-[#A3E635] w-full py-4"
        textStyle="text-black font-bold text-base"
      />
    </View>
  );
}
