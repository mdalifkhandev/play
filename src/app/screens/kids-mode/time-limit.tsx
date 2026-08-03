import React, { useState } from 'react';
import { View, Text, Platform, KeyboardAvoidingView, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Header } from '../../../../src/components/ui/Header';
import { CustomButton } from '../../../../src/components/ui/CustomButton';
import { useAppStore } from '../../../../src/store';

const TimeCounter = ({ 
  label, 
  value, 
  onIncrement, 
  onDecrement 
}: { 
  label: string; 
  value: number; 
  onIncrement: () => void;
  onDecrement: () => void;
}) => (
  <View className="bg-[#1C1C1E] border border-[#333] rounded-3xl w-[140px] py-6 items-center justify-center">
    <Pressable 
      onPress={onIncrement}
      className="w-12 h-12 rounded-full bg-[#98D83A] items-center justify-center mb-4 active:opacity-70"
    >
      <Ionicons name="add" size={28} color="black" />
    </Pressable>
    
    <Text className="text-white text-3xl font-inter-bold mb-1">
      {value.toString().padStart(2, '0')}
    </Text>
    <Text className="text-gray-400 text-sm font-inter-regular mb-4">
      {label}
    </Text>

    <Pressable 
      onPress={onDecrement}
      className="w-12 h-12 rounded-full bg-[#98D83A] items-center justify-center active:opacity-70"
    >
      <Ionicons name="remove" size={28} color="black" />
    </Pressable>
  </View>
);

export default function TimeLimitScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(1);

  const incrementHours = () => setHours(h => Math.min(h + 1, 23));
  const decrementHours = () => setHours(h => Math.max(h - 1, 0));
  
  const incrementMinutes = () => setMinutes(m => (m + 1) % 60);
  const decrementMinutes = () => setMinutes(m => (m - 1 + 60) % 60);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#121212]"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }}
        className="px-6 pt-16"
      >
        <Header showBackButton={true} title="Screen Time Limit" containerStyle="mt-0 px-0 mb-8" />
        
        <Text className="text-white text-lg font-inter-medium mb-10 leading-relaxed px-2">
          Set a daily time limit for Kids Mode. Once the limit is reached, the app will pause until tomorrow or until a parent enters the PIN
        </Text>

        <View className="flex-row justify-between px-2 mb-10">
          <TimeCounter 
            label="hours" 
            value={hours} 
            onIncrement={incrementHours} 
            onDecrement={decrementHours} 
          />
          <TimeCounter 
            label="Minute" 
            value={minutes} 
            onIncrement={incrementMinutes} 
            onDecrement={decrementMinutes} 
          />
        </View>

        <View className="mt-auto">
          <CustomButton
            title="Activate Kids Mode"
            variant="primary"
            onPress={() => {
              const totalMs = (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);
              const expireTimestamp = Date.now() + totalMs;
              
              const store = useAppStore.getState();
              store.setKidsModeExpireTime(expireTimestamp);
              store.setKidsModeDuration(totalMs);
              
              // Action to activate Kids Mode and go to success screen
              router.push('/screens/kids-mode/success');
            }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
