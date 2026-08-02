import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Header } from '../../components/ui/Header';

interface SettingItemProps {
  title: string;
  onPress: () => void;
  rightText?: string;
}

const SettingItem = ({ title, onPress, rightText }: SettingItemProps) => (
  <Pressable 
    onPress={onPress}
    className="flex-row items-center justify-between bg-[#1C1C1E] rounded-xl px-4 py-4 mb-3"
  >
    <Text className="text-white text-base font-inter-medium">{title}</Text>
    <View className="flex-row items-center">
      {rightText && (
        <Text className="text-white text-base font-inter-regular mr-2">{rightText}</Text>
      )}
      <Ionicons name="chevron-forward" size={20} color="#888" />
    </View>
  </Pressable>
);

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#121212]">
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }} className="px-6 pt-16">
        <Header showBackButton={true} title="Settings" />
        
        <View className="mt-8">
          <SettingItem 
            title="Change Password" 
            onPress={() => router.push('/screens/settings/change-password')} 
          />
          <SettingItem 
            title="Languas" 
            rightText="English"
            onPress={() => router.push('/screens/settings/language')} 
          />
          <SettingItem 
            title="Support Requests" 
            onPress={() => router.push('/screens/settings/support')} 
          />
          <SettingItem 
            title="Privacy Policy" 
            onPress={() => router.push('/screens/settings/privacy-policy')} 
          />
          <SettingItem 
            title="Terms of service" 
            onPress={() => router.push('/screens/settings/terms')} 
          />
          <SettingItem 
            title="About Us" 
            onPress={() => router.push('/screens/settings/about-us')} 
          />
        </View>
      </ScrollView>
    </View>
  );
}
