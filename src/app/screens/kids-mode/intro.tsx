import React from 'react';
import { View, Text, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Header } from '../../../../src/components/ui/Header';
import { CustomButton } from '../../../../src/components/ui/CustomButton';

const InfoCard = ({ icon, text }: { icon: keyof typeof Ionicons.glyphMap, text: string }) => (
  <View className="flex-row items-center bg-[#1C1C1E] rounded-xl px-4 py-5 mb-3 border border-[#333]">
    <View className="w-10 h-10 rounded-full bg-[#2A301E] items-center justify-center mr-4">
      <Ionicons name={icon} size={20} color="#98D83A" />
    </View>
    <Text className="text-white text-sm font-inter-medium flex-1">{text}</Text>
  </View>
);

export default function KidsModeIntroScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#121212]"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }}
        className="px-6 pt-16"
      >
        <Header showBackButton={true} title="Kids Mode" containerStyle="mt-0 px-0 mb-8" />
        
        <View className="items-center mb-8">
          <View className="w-24 h-24 rounded-full bg-[#98D83A] items-center justify-center mb-6">
            <Ionicons name="checkmark-circle" size={40} color="black" />
          </View>
          <Text className="text-white text-2xl font-inter-bold text-center">
            Turn On Kids Mode
          </Text>
        </View>

        <View className="mb-10">
          <InfoCard 
            icon="shield-checkmark-outline" 
            text="Only kid-friendly content will be shown" 
          />
          <InfoCard 
            icon="chatbubble-ellipses-outline" 
            text="Comments and messaging will be disabled" 
          />
          <InfoCard 
            icon="radio-outline" 
            text="Live streaming will be turned off" 
          />
          <InfoCard 
            icon="key-outline" 
            text="A parental PIN will be required to turn this off" 
          />
        </View>

        <View className="mt-auto">
          <CustomButton
            title="Continue"
            variant="primary"
            onPress={() => router.push('/screens/kids-mode/set-pin')}
            containerStyle="mb-4"
          />
          <CustomButton
            title="Cancel"
            variant="outline"
            onPress={() => router.back()}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
