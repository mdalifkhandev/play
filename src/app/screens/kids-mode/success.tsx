import React from 'react';
import { View, Text, Platform, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CustomButton } from '../../../../src/components/ui/CustomButton';

import { useAppStore } from '../../../../src/store';

export default function KidsModeSuccessScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const setKidsModeActive = useAppStore((state) => state.setKidsModeActive);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#121212]"
    >
      <View 
        style={{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }} 
        className="px-6 flex-1 items-center justify-center"
      >
        <View className="flex-1 items-center justify-center w-full">
          <View className="w-28 h-28 rounded-full bg-[#98D83A] items-center justify-center mb-8">
            <Ionicons name="checkmark" size={60} color="black" />
          </View>
          
          <Text className="text-white text-3xl font-inter-bold text-center mb-4">
            Kids Mode is now Active
          </Text>
          <Text className="text-gray-400 text-base font-inter-regular text-center px-4 leading-relaxed">
            The app has been switched to a safe, filtered experience
          </Text>
        </View>

        <View className="w-full mt-auto">
          <CustomButton
            title="Done"
            variant="primary"
            onPress={() => {
              setKidsModeActive(true);
              router.push('/home');
            }}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
