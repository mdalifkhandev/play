import React from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Header } from '../../../components/ui/Header';
import { CustomButton } from '../../../components/ui/CustomButton';

export default function SuccessScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { expiresAt } = useLocalSearchParams<{ expiresAt?: string }>();
  const expiryLabel = expiresAt ? new Date(expiresAt).toLocaleDateString() : null;

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <Header title="Confirm" />

      <View className="flex-1 items-center justify-center px-5">
        
        <View className="w-24 h-24 rounded-full bg-[#A3E635] items-center justify-center mb-8">
          <Ionicons name="checkmark" size={48} color="black" />
        </View>
        
        <Text className="text-white text-3xl font-bold mb-3 font-inter-bold">You're now Premium!</Text>
        <Text className="text-[#888] text-base text-center px-4 leading-6">
          Enjoy an ad-free experience across{'\n'}the app
        </Text>
        {expiryLabel && (
          <Text className="text-[#A3E635] text-sm text-center mt-4">
            Active until {expiryLabel}
          </Text>
        )}

      </View>

      <View className="px-5 mb-10">
        <CustomButton 
          title="Back to feed"
          onPress={() => router.replace('/')}
          containerStyle="bg-[#A3E635] w-full py-4"
          textStyle="text-black font-bold text-base"
        />
      </View>

    </View>
  );
}
