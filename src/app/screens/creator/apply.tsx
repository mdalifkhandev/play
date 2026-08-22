import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';
import { Header } from '../../../components/ui/Header';
import { CustomButton } from '../../../components/ui/CustomButton';
import { CustomInput } from '../../../components/inputs/CustomInput';
import { submitCreatorApplication } from '../../../api/creators';
import { handleApiError } from '../../../api/client';
import { useAppStore } from '../../../store';

export default function ApplyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAppStore(state => state.user);
  const [fullName, setFullName] = useState(user?.profile?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [occupation, setOccupation] = useState('');
  const [contentCategory, setContentCategory] = useState('');
  const [contentLanguage, setContentLanguage] = useState('');
  const [country, setCountry] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!fullName.trim() || !email.trim() || !contentCategory.trim() || !contentLanguage.trim() || !country.trim() || reason.trim().length < 20) {
      toast.error('Please complete the creator application form.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitCreatorApplication({
        fullName,
        email,
        ...(dateOfBirth.trim() ? { dateOfBirth } : {}),
        ...(occupation.trim() ? { occupation } : {}),
        contentCategory,
        contentLanguage,
        country,
        reason,
      });
      toast.success('Creator application submitted.');
      router.replace('/screens/creator/pending');
    } catch (error) {
      toast.error(handleApiError(error, 'Creator application could not be submitted.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <Header title="Creator Application" />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20 }}>
        <CustomInput
          label="Full Name NID"
          placeholder="Full name"
          placeholderTextColor="#555"
          inputContainerStyle="bg-[#151515] border border-[#333]"
          className="text-white text-base"
          value={fullName}
          onChangeText={setFullName}
        />

        <CustomInput
          label="Email"
          placeholder="E-mail address or phone number"
          placeholderTextColor="#555"
          keyboardType="email-address"
          autoCapitalize="none"
          inputContainerStyle="bg-[#151515] border border-[#333]"
          className="text-white text-base"
          value={email}
          onChangeText={setEmail}
        />

        <CustomInput
          label="Date of birth"
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#555"
          rightIcon="calendar-outline"
          inputContainerStyle="bg-[#151515] border border-[#333]"
          className="text-white text-base flex-1"
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
        />

        <View className="mb-6">
          <Text className="text-white font-medium text-sm">
            ID Information<Text className="text-red-500">*</Text>
          </Text>
          <Text className="text-[#888] text-xs mt-1 mb-3">Please upload real and valid information</Text>
          
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Pressable className="bg-[#1A1A1A] border border-dashed border-[#555] rounded-xl h-28 items-center justify-center mb-2">
                <View className="bg-[#111] p-2 rounded-full">
                  <Ionicons name="camera" size={24} color="#FFF" />
                </View>
              </Pressable>
              <Text className="text-center text-[#888] text-xs">ID Card Front</Text>
            </View>

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

        <CustomInput
          label="Select occupation(Optional)"
          placeholder="Your profession"
          placeholderTextColor="#555"
          inputContainerStyle="bg-[#151515] border border-[#333]"
          className="text-white text-base"
          value={occupation}
          onChangeText={setOccupation}
        />

        <CustomInput
          label="Content Category"
          placeholder="Music, Gaming, Education..."
          placeholderTextColor="#555"
          rightIcon="chevron-down"
          inputContainerStyle="bg-[#151515] border border-[#333]"
          className="text-white text-base flex-1"
          value={contentCategory}
          onChangeText={setContentCategory}
        />

        <CustomInput
          label="Content Language"
          placeholder="Bangla, English..."
          placeholderTextColor="#555"
          rightIcon="chevron-down"
          inputContainerStyle="bg-[#151515] border border-[#333]"
          className="text-white text-base flex-1"
          value={contentLanguage}
          onChangeText={setContentLanguage}
        />

        <CustomInput
          label="Country/Region"
          placeholder="Bangladesh"
          placeholderTextColor="#555"
          rightIcon="chevron-down"
          inputContainerStyle="bg-[#151515] border border-[#333]"
          className="text-white text-base flex-1"
          value={country}
          onChangeText={setCountry}
        />

        <CustomInput
          label="Why do you want to become a Creator?"
          placeholder="Tell us about your passion..."
          placeholderTextColor="#555"
          multiline
          textAlignVertical="top"
          inputContainerStyle="bg-[#151515] border border-[#333] h-28"
          className="text-white text-base"
          value={reason}
          onChangeText={setReason}
        />

        <CustomButton 
          title={isSubmitting ? 'SUBMITTING...' : 'SUBMIT APPLICATION'}
          onPress={handleSubmit}
          disabled={isSubmitting}
          containerStyle="bg-[#E4FB52] mb-6"
          textStyle="text-black"
        />
        {isSubmitting ? (
          <View className="items-center -mt-3 mb-6">
            <ActivityIndicator color="#E4FB52" />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
