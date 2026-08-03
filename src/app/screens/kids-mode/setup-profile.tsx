import React, { useState } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Header } from '../../../../src/components/ui/Header';
import { CustomButton } from '../../../../src/components/ui/CustomButton';

const AgeButton = ({ 
  label, 
  isSelected, 
  onPress 
}: { 
  label: string; 
  isSelected: boolean; 
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    className={`w-[100px] h-12 rounded-xl border items-center justify-center ${
      isSelected ? 'bg-[#98D83A] border-[#98D83A]' : 'bg-[#121212] border-[#333]'
    }`}
  >
    <Text className={`text-base font-inter-bold ${isSelected ? 'text-black' : 'text-white'}`}>
      {label}
    </Text>
  </Pressable>
);

export default function SetupKidsProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [name, setName] = useState('');
  const [ageRange, setAgeRange] = useState('7-9'); // Default selected in mockup

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#121212]"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }}
        className="px-6 pt-16"
      >
        <Header showBackButton={true} title="Set Up Kids Profile" containerStyle="mt-0 px-0 mb-12" />
        
        <View className="mb-8">
          <Text className="text-gray-400 text-sm font-inter-regular mb-2">
            Child's Name / Nickname (optional)
          </Text>
          <View className="bg-[#1C1C1E] border border-[#333] rounded-xl px-4 py-4">
            <TextInput
              placeholder="e.g. Rokey"
              placeholderTextColor="#888"
              value={name}
              onChangeText={setName}
              className="text-white text-base font-inter-regular p-0"
            />
          </View>
        </View>

        <View className="flex-row justify-between mb-8">
          <AgeButton 
            label="3-6" 
            isSelected={ageRange === '3-6'} 
            onPress={() => setAgeRange('3-6')} 
          />
          <AgeButton 
            label="7-9" 
            isSelected={ageRange === '7-9'} 
            onPress={() => setAgeRange('7-9')} 
          />
          <AgeButton 
            label="10-15" 
            isSelected={ageRange === '10-15'} 
            onPress={() => setAgeRange('10-15')} 
          />
        </View>

        <View className="mt-auto">
          <CustomButton
            title="Next"
            variant="primary"
            onPress={() => router.push('/screens/kids-mode/time-limit')}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
