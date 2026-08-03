import React, { useState } from 'react';
import { View, Text, Platform, KeyboardAvoidingView, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Header } from '../../../../src/components/ui/Header';
import { CustomButton } from '../../../../src/components/ui/CustomButton';
import { toast } from 'sonner-native';

export default function VerifyOtpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [otp, setOtp] = useState('');

  const handleVerify = () => {
    if (otp.length < 4) {
      toast.error('Please enter a valid OTP');
      return;
    }
    // Simulate successful OTP validation
    router.push('/screens/kids-mode/reset-pin');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#121212]"
    >
      <View style={{ paddingTop: 64, paddingBottom: insets.bottom + 24 }} className="px-6 flex-1">
        <Header showBackButton={true} title="Verify OTP" containerStyle="mt-0 px-0 mb-8" />
        
        <View className="mb-8">
          <Text className="text-white text-2xl font-inter-bold mb-3">Enter OTP</Text>
          <Text className="text-gray-400 font-inter-regular leading-relaxed">
            We've sent a code to your email. Enter it below to verify your identity.
          </Text>
        </View>

        <View className="bg-[#1C1C1E] rounded-xl px-4 py-3 mb-6">
          <TextInput
            placeholder="0000"
            placeholderTextColor="#666"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            className="text-white text-3xl font-inter-bold tracking-widest text-center"
          />
        </View>

        <View className="mt-auto pt-6">
          <CustomButton
            title="Verify & Continue"
            variant="primary"
            disabled={otp.length < 4}
            onPress={handleVerify}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
