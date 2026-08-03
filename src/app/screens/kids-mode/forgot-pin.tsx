import React, { useState } from 'react';
import { View, Text, Platform, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Header } from '../../../../src/components/ui/Header';
import { CustomInput } from '../../../../src/components/inputs/CustomInput';
import { CustomButton } from '../../../../src/components/ui/CustomButton';

export default function ForgotPinScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [email, setEmail] = useState('');

  const handleSendOTP = () => {
    // In a real app, you would call your backend here. 
    // We are simulating success.
    router.push('/screens/kids-mode/verify-otp');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#121212]"
    >
      <View style={{ paddingTop: 64, paddingBottom: insets.bottom + 24 }} className="px-6 flex-1">
        <Header showBackButton={true} title="Forgot PIN" containerStyle="mt-0 px-0 mb-8" />
        
        <View className="mb-8">
          <Text className="text-white text-2xl font-inter-bold mb-3">Reset Your PIN</Text>
          <Text className="text-gray-400 font-inter-regular leading-relaxed">
            Enter the email address associated with your account. We will send you an OTP to reset your Kids Mode PIN.
          </Text>
        </View>

        <CustomInput
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View className="mt-auto pt-6">
          <CustomButton
            title="Send OTP"
            variant="primary"
            disabled={!email}
            onPress={handleSendOTP}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
