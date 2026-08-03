import React, { useState, useEffect } from 'react';
import { View, Text, Platform, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { toast } from 'sonner-native';
import { Header } from '../../../../src/components/ui/Header';
import { PinPad } from '../../../../src/components/ui/PinPad';

export default function ConfirmPinScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [pin, setPin] = useState('');
  
  const originalPin = params.pin as string;

  useEffect(() => {
    if (pin.length === 6) {
      if (pin === originalPin) {
        // PIN matches
        setTimeout(() => {
          router.push('/screens/kids-mode/setup-profile');
        }, 200);
      } else {
        toast.error('PIN does not match. Please try again.');
        setPin(''); // Reset to try again
      }
    }
  }, [pin, originalPin, router]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#121212]"
    >
      <View style={{ paddingTop: 64, paddingBottom: insets.bottom + 24 }} className="px-6 flex-1">
        <Header showBackButton={true} title="Confirm PIN" containerStyle="mt-0 px-0 mb-12" />
        
        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-3xl bg-[#2A301E] items-center justify-center mb-6">
            <Ionicons name="key-outline" size={32} color="#98D83A" />
          </View>
          <Text className="text-white text-2xl font-inter-bold text-center mb-2">
            Confirm Your PIN
          </Text>
          <Text className="text-gray-400 text-sm font-inter-regular text-center">
            Re-enter your PIN to confirm
          </Text>
        </View>

        <View className="flex-1 items-center justify-start mt-6">
          <PinPad 
            value={pin} 
            onValueChange={setPin} 
            maxLength={6} 
          />
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}
