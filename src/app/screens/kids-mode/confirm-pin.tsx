import React, { useState, useEffect } from 'react';
import { View, Text, Platform, KeyboardAvoidingView, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Link } from 'expo-router';
import { toast } from 'sonner-native';
import { Header } from '../../../../src/components/ui/Header';
import { PinPad } from '../../../../src/components/ui/PinPad';
import { useAppStore } from '../../../../src/store';
import { enterKidsMode, exitKidsMode } from '../../../../src/api/kids-mode/kids-mode.api';

export default function ConfirmPinScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const setKidsModeActive = useAppStore((state) => state.setKidsModeActive);

  const originalPin = params.pin as string;
  const action = params.action as string; // 'continue' or 'exit'

  useEffect(() => {
    if (pin.length === 6) {
      const handlePinSubmit = async () => {
        try {
          setIsLoading(true);
          if (action) {
            if (action === 'exit') {
              await exitKidsMode(pin);
              setKidsModeActive(false);
              router.push('/home');
            } else {
              const status = await enterKidsMode(pin);
              const durationMs = Math.max(1, status.remainingSeconds) * 1000;
              useAppStore.getState().setKidsModeExpireTime(Date.now() + durationMs);
              useAppStore.getState().setKidsModeDuration((status.dailyLimitMinutes ?? 60) * 60 * 1000);
              setKidsModeActive(true);
              router.push('/home');
            }
          } else {
            // Setup flow
            if (pin === originalPin || !originalPin) { // fallback if no originalPin is passed for some reason
              setTimeout(() => {
                router.push({
                  pathname: '/screens/kids-mode/setup-profile',
                  params: { pin },
                });
              }, 200);
            } else {
              toast.error('PIN does not match. Please try again.');
              setPin('');
            }
          }
        } catch (error: any) {
          console.error(error);
          toast.error(error?.response?.data?.error?.message || 'Incorrect PIN. Please try again.');
          setPin('');
        } finally {
          setIsLoading(false);
        }
      };

      handlePinSubmit();
    }
  }, [pin, originalPin, action, router]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#121212]"
    >
      <View style={{ paddingTop: 64, paddingBottom: insets.bottom + 24 }} className="px-6 flex-1">
        <Header showBackButton={true} title={action ? "Use Password" : "Confirm PIN"} containerStyle="mt-0 px-0 mb-12" />

        <View className="items-center mb-4">
          <View className="w-20 h-20 rounded-3xl bg-[#2A301E] items-center justify-center mb-6">
            <Ionicons name="key-outline" size={32} color="#98D83A" />
          </View>
          <Text className="text-white text-2xl font-inter-bold text-center mb-2">
            {action ? "Use Password" : "Confirm Your PIN"}
          </Text>
          
          <View className="h-6 justify-center">
            {isLoading ? (
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color="#98D83A" className="mr-2" />
                <Text className="text-[#98D83A] text-sm font-inter-medium">Checking PIN...</Text>
              </View>
            ) : (
              <Text className="text-gray-400 text-sm font-inter-regular text-center">
                {action
                  ? "You'll need this PIN to turn off Kids Mode or change settings"
                  : "Re-enter your PIN to confirm"}
              </Text>
            )}
          </View>
        </View>

        <View className="flex-1 items-center justify-start mt-4 w-full">
          <PinPad 
            value={pin} 
            onValueChange={setPin} 
            maxLength={6} 
          >
            {action && (
              <View className="w-full flex-row justify-end px-4 mb-6">
                <Link href="/screens/kids-mode/forgot-pin" asChild>
                  <Pressable>
                    <Text className="text-[#EF4444] font-inter-medium">Forgot password?</Text>
                  </Pressable>
                </Link>
              </View>
            )}
          </PinPad>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}
