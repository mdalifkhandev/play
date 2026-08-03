import React, { useState } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform, ScrollView, Image, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../../components/ui/Header';
import { CustomButton } from '../../../components/ui/CustomButton';

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const [problemText, setProblemText] = useState('');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#0A0A0A]"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }}
        className="px-6 pt-16"
      >
        <Header showBackButton={true} title="Support Requests" containerStyle="mt-0 px-0 mb-12" />

        <View className="flex-row justify-center items-center mb-8">
          <Image
            source={require('../../../../assets/images/icon.png')}
            style={{ width: 60, height: 60, resizeMode: 'contain' }}
          />
          <Text className='text-[#DFFD53] text-4xl font-inter-bold ml-3'>Play</Text>
        </View>

        <Text className="text-white text-center text-lg font-inter-medium mb-8 px-4">
          If you face any kind of problem with our service feel free to contact us.
        </Text>

        <Pressable className="flex-row items-center justify-between bg-[#1C1C1E] rounded-xl px-4 py-4 mb-4 border border-[#333]">
          <Text className="text-gray-400 text-base font-inter-regular">Admin</Text>
          <Ionicons name="chevron-down" size={20} color="#0056D2" />
        </Pressable>

        <View className="bg-[#1C1C1E] rounded-xl px-4 py-4 mb-6 border border-[#333] h-40">
          <TextInput
            placeholder="Write your problem here"
            placeholderTextColor="#888"
            value={problemText}
            onChangeText={setProblemText}
            multiline
            textAlignVertical="top"
            className="flex-1 text-white text-base font-inter-regular"
          />
        </View>

        <CustomButton
          title="Send to admin"
          variant="primary"
          onPress={() => {
            // Handle send action
            setProblemText('');
          }}
        />

      </ScrollView>
    </KeyboardAvoidingView>
  );
}
