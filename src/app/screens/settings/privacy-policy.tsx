import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../../../components/ui/Header';

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#121212]">
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }} className="px-6 pt-16">
        <Header showBackButton={true} title="Privacy Policy" />

        <View className="mt-8">
          <Text className="text-white text-lg font-inter-bold mb-4">Privacy & Policy</Text>
          <Text className="text-gray-400 font-inter-regular text-base mb-6 leading-6">
            We value your privacy and are committed to protecting your personal information. This Privacy Policy outlines how information is collected, used, and safeguarded when you use the application or service.
          </Text>

          <Text className="text-white text-lg font-inter-bold mb-3">1. Information we collect</Text>
          <Text className="text-gray-400 font-inter-regular text-base mb-6 leading-6">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </Text>

          <Text className="text-white text-lg font-inter-bold mb-3">2. How We Use Your Information</Text>
          <Text className="text-gray-400 font-inter-regular text-base mb-6 leading-6">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum. Praesent mauris. Fusce nec tellus sed augue semper porta.
          </Text>

          <Text className="text-white text-lg font-inter-bold mb-3">3. Information Sharing</Text>
          <Text className="text-gray-400 font-inter-regular text-base mb-6 leading-6">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur sodales ligula in libero. Sed dignissim lacinia nunc. Curabitur tortor. Pellentesque nibh. Aenean quam. In scelerisque sem at dolor. Maecenas mattis. Sed convallis tristique sem.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
