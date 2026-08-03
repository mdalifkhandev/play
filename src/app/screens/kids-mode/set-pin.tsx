import React, { useState, useEffect } from 'react';
import { View, Text, Platform, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Header } from '../../../../src/components/ui/Header';
import { PinPad } from '../../../../src/components/ui/PinPad';

export default function SetPinScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (pin.length === 6) {
      // Small delay to let the user see the 6th digit entered
      const timeoutId = setTimeout(() => {
        router.push({
          pathname: '/screens/kids-mode/confirm-pin',
          params: { pin }
        });
      }, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [pin]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#121212]"
    >
      <View style={{ paddingTop: 64, paddingBottom: insets.bottom + 24 }} className="px-6 flex-1">
        <Header showBackButton={true} title="Set PIN" containerStyle="mt-0 px-0 mb-12" />
        
        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-3xl bg-[#2A301E] items-center justify-center mb-6">
            <Ionicons name="key-outline" size={32} color="#98D83A" />
          </View>
          <Text className="text-white text-2xl font-inter-bold text-center mb-2">
            Set a Parental PIN
          </Text>
          <Text className="text-gray-400 text-sm font-inter-regular text-center max-w-[250px]">
            You'll need this PIN to turn off Kids Mode or change settings
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
