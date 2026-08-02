import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../../../components/ui/Header';

export default function AboutUsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#121212]">
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }} className="px-6 pt-16">
        <Header showBackButton={true} title="About Us" />

        <View className="mt-8">
          <Text className="text-white text-lg font-inter-bold mb-3">About Us</Text>
          <Text className="text-gray-400 font-inter-regular text-base mb-8 leading-6">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
          </Text>

          <Text className="text-white text-lg font-inter-bold mb-3">Our Mission</Text>
          <Text className="text-gray-400 font-inter-regular text-base mb-8 leading-6">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet.
          </Text>

          <Text className="text-white text-lg font-inter-bold mb-3">Our Vision</Text>
          <Text className="text-gray-400 font-inter-regular text-base mb-8 leading-6">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur sodales ligula in libero. Sed dignissim lacinia nunc. Curabitur tortor. Pellentesque nibh. Aenean quam. In scelerisque sem at dolor. Maecenas mattis.
          </Text>
          
          <Text className="text-white text-lg font-inter-bold mb-3">Why Choose Us</Text>
          <Text className="text-gray-400 font-inter-regular text-base mb-6 leading-6">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin quam. Etiam ultrices. Suspendisse in justo eu magna luctus suscipit. Sed lectus.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
