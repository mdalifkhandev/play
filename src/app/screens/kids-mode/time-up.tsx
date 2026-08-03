import React from 'react';
import { View, Text, Platform, KeyboardAvoidingView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CustomButton } from '../../../../src/components/ui/CustomButton';

export default function TimeUpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

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
          <View className="w-32 h-32 rounded-full bg-[#98D83A] items-center justify-center mb-8 relative">
            <Ionicons name="moon-outline" size={60} color="black" />
            <View className="absolute -top-2 -right-2 bg-white rounded-full w-10 h-10 items-center justify-center">
              <Text className="text-[#0056D2] font-bold text-xs transform -rotate-12">zzz</Text>
            </View>
          </View>
          
          <Text className="text-white text-3xl font-inter-bold text-center mb-4">
            Time's up for today!
          </Text>
          <Text className="text-gray-400 text-base font-inter-regular text-center px-4 leading-relaxed max-w-[280px]">
            Come back tomorrow to watch more videos!
          </Text>
        </View>

        <View className="w-full mt-auto">
          <CustomButton
            title="Ask a Parent & Continue"
            variant="primary"
            containerStyle="mb-4"
            onPress={() => {
              router.push({
                pathname: '/screens/kids-mode/confirm-pin',
                params: { action: 'continue' }
              });
            }}
          />
          <CustomButton
            title="Exit from Kids Mode"
            variant="outline"
            onPress={() => {
              router.push({
                pathname: '/screens/kids-mode/confirm-pin',
                params: { action: 'exit' }
              });
            }}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
