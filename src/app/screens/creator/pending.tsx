import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../../../components/ui/Header';

export default function PendingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <Header title="Application Status" />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center' }}>
        
        {/* Hourglass Icon */}
        <View className="mt-12 mb-8 items-center justify-center">
          {/* Concentric circles */}
          <View className="w-48 h-48 rounded-full border border-[#222] items-center justify-center">
            <View className="w-36 h-36 rounded-full border border-[#333] items-center justify-center">
              <View className="w-24 h-24 rounded-full bg-[#111] items-center justify-center">
                <Ionicons name="hourglass-outline" size={40} color="#E4FB52" />
              </View>
            </View>
          </View>
        </View>

        <Text className="text-white text-2xl font-bold mb-3 text-center">
          Application Under Review
        </Text>
        <Text className="text-[#888] text-center text-sm leading-5 mb-12 px-4">
          Our team is currently evaluating your creative profile and portfolio assets.
        </Text>

        {/* Stepper */}
        <View className="bg-[#151515] rounded-2xl p-6 w-full border border-[#222]">
          
          {/* Step 1 */}
          <View className="flex-row mb-6">
            <View className="items-center mr-4">
              <View className="w-8 h-8 rounded-full bg-[#E4FB52] items-center justify-center">
                <Ionicons name="checkmark" size={20} color="black" />
              </View>
              <View className="w-0.5 h-10 bg-[#E4FB52] mt-2" />
            </View>
            <View className="flex-1 pt-1">
              <Text className="text-[#E4FB52] text-base font-semibold mb-1">Step 1: Submitted</Text>
              <Text className="text-[#888] text-xs">Completed on October 24, 2023</Text>
            </View>
          </View>

          {/* Step 2 */}
          <View className="flex-row mb-6">
            <View className="items-center mr-4">
              <View className="w-8 h-8 rounded-full border-2 border-[#E4FB52] items-center justify-center">
                <View className="w-3 h-3 rounded-full bg-[#E4FB52]" />
              </View>
              <View className="w-0.5 h-10 bg-[#333] mt-2" />
            </View>
            <View className="flex-1 pt-1">
              <Text className="text-white text-base font-semibold mb-1">Step 2: Under Review</Text>
              <Text className="text-[#888] text-xs">Average review time: 3-5 business days</Text>
            </View>
          </View>

          {/* Step 3 */}
          <View className="flex-row">
            <View className="items-center mr-4">
              <View className="w-8 h-8 rounded-full border-2 border-[#333] items-center justify-center bg-[#1A1A1A]">
                <Ionicons name="flag-outline" size={16} color="#555" />
              </View>
            </View>
            <View className="flex-1 pt-1">
              <Text className="text-[#555] text-base font-semibold mb-1">Step 3: Decision</Text>
              <Text className="text-[#555] text-xs leading-5">You'll be notified via the portal and email</Text>
            </View>
          </View>
        </View>

        {/* Simulate Approval Button (For testing) */}
        <Pressable 
          onPress={() => router.push('/screens/creator/success')}
          className="mt-12 bg-[#222] px-6 py-3 rounded-xl border border-[#333]"
        >
          <Text className="text-[#888] text-xs font-medium">Simulate Approval (Test)</Text>
        </Pressable>

      </ScrollView>
    </View>
  );
}
