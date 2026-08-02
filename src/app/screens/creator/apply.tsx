import React from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../../../components/ui/Header';
import { CustomButton } from '../../../components/ui/CustomButton';
import { CustomInput } from '../../../components/inputs/CustomInput';

export default function ApplyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <Header title="Creator Application" />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20 }}>
        
        {/* Full Name NID */}
        <CustomInput
          label="Full Name NID"
          placeholder="Full name"
          placeholderTextColor="#555"
          inputContainerStyle="bg-[#151515] border border-[#333]"
          className="text-white text-base"
        />

        {/* Email */}
        <CustomInput
          label="Email"
          placeholder="E-mail address or phone number"
          placeholderTextColor="#555"
          keyboardType="email-address"
          inputContainerStyle="bg-[#151515] border border-[#333]"
          className="text-white text-base"
        />

        {/* Date of birth */}
        <CustomInput
          label="Date of birth"
          placeholder="dd/mm/yy"
          placeholderTextColor="#555"
          rightIcon="calendar-outline"
          inputContainerStyle="bg-[#151515] border border-[#333]"
          className="text-white text-base flex-1"
        />

        {/* ID Information */}
        <View className="mb-6">
          <Text className="text-white font-medium text-sm">
            ID Information<Text className="text-red-500">*</Text>
          </Text>
          <Text className="text-[#888] text-xs mt-1 mb-3">Please upload real and valid information</Text>
          
          <View className="flex-row gap-4">
            {/* ID Front */}
            <View className="flex-1">
              <Pressable className="bg-[#1A1A1A] border border-dashed border-[#555] rounded-xl h-28 items-center justify-center mb-2">
                <View className="bg-[#111] p-2 rounded-full">
                  <Ionicons name="camera" size={24} color="#FFF" />
                </View>
              </Pressable>
              <Text className="text-center text-[#888] text-xs">ID Card Front</Text>
            </View>

            {/* ID Back */}
            <View className="flex-1">
              <Pressable className="bg-[#1A1A1A] border border-dashed border-[#555] rounded-xl h-28 items-center justify-center mb-2">
                <View className="bg-[#111] p-2 rounded-full">
                  <Ionicons name="camera" size={24} color="#FFF" />
                </View>
              </Pressable>
              <Text className="text-center text-[#888] text-xs">ID Card Back</Text>
            </View>
          </View>
        </View>

        {/* Select Occupation */}
        <CustomInput
          label="Select occupation(Optional)"
          placeholder="Your profession"
          placeholderTextColor="#555"
          inputContainerStyle="bg-[#151515] border border-[#333]"
          className="text-white text-base"
        />

        {/* Content Category */}
        <CustomInput
          label="Content Category"
          placeholder="Full name"
          placeholderTextColor="#555"
          rightIcon="chevron-down"
          inputContainerStyle="bg-[#151515] border border-[#333]"
          className="text-white text-base flex-1"
        />

        {/* Content Language */}
        <CustomInput
          label="Content Language"
          placeholder="Full name"
          placeholderTextColor="#555"
          rightIcon="chevron-down"
          inputContainerStyle="bg-[#151515] border border-[#333]"
          className="text-white text-base flex-1"
        />

        {/* Country/Region */}
        <CustomInput
          label="Country/Region"
          placeholder="Full name"
          placeholderTextColor="#555"
          rightIcon="chevron-down"
          inputContainerStyle="bg-[#151515] border border-[#333]"
          className="text-white text-base flex-1"
        />

        {/* Why become creator */}
        <CustomInput
          label="Why do you want to become a Creator?"
          placeholder="Tell us about your passion..."
          placeholderTextColor="#555"
          multiline
          textAlignVertical="top"
          inputContainerStyle="bg-[#151515] border border-[#333] h-28"
          className="text-white text-base"
        />

        {/* Submit Button */}
        <CustomButton 
          title="SUBMIT APPLICATION" 
          onPress={() => router.push('/screens/creator/pending')}
          containerStyle="bg-[#E4FB52] mb-6"
          textStyle="text-black"
        />

      </ScrollView>
    </View>
  );
}
