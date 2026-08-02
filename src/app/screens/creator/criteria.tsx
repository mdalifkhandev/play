import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Header } from '../../../components/ui/Header';
import { CustomButton } from '../../../components/ui/CustomButton';

export default function CriteriaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const radius = 80;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const progress = 0.45;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      <Header title="LIVE Become a Creator" />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        
        {/* Progress Circle */}
        <View className="items-center mt-6 mb-8 relative justify-center">
          <Svg width={radius * 2 + strokeWidth * 2} height={radius * 2 + strokeWidth * 2}>
            {/* Background Circle */}
            <Circle
              stroke="#222"
              fill="transparent"
              cx={radius + strokeWidth}
              cy={radius + strokeWidth}
              r={radius}
              strokeWidth={strokeWidth}
            />
            {/* Progress Circle */}
            <Circle
              stroke="#E4FB52"
              fill="transparent"
              cx={radius + strokeWidth}
              cy={radius + strokeWidth}
              r={radius}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${radius + strokeWidth} ${radius + strokeWidth})`}
            />
          </Svg>
          <View className="absolute items-center justify-center">
            <Text className="text-[#E4FB52] text-5xl font-bold">45%</Text>
            <Text className="text-white text-xs tracking-widest mt-1">PROGRESS</Text>
          </View>
        </View>

        <Text className="text-[#CCC] text-center text-sm leading-5 mb-8 px-4">
          Complete all milestones below to unlock creator monetization features.
        </Text>

        {/* Milestones */}
        
        {/* Follower Milestone */}
        <View className="bg-[#151515] rounded-2xl p-4 flex-row items-center mb-3 border border-[#222]">
          <View className="w-12 h-12 rounded-xl bg-[#1A1A1A] items-center justify-center mr-4">
            <Ionicons name="person-outline" size={24} color="#E4FB52" />
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-medium mb-1">Followers</Text>
            <Text className="text-[#888] text-xs">450 / 1,000</Text>
          </View>
          <Ionicons name="checkmark-circle" size={28} color="#E4FB52" />
        </View>

        {/* Video Views Milestone */}
        <View className="bg-[#151515] rounded-2xl p-4 flex-row items-center mb-3 border border-[#222]">
          <View className="w-12 h-12 rounded-xl bg-[#1A1A1A] items-center justify-center mr-4">
            <Ionicons name="play-outline" size={24} color="#E4FB52" />
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-medium mb-1">Video Views</Text>
            <Text className="text-[#888] text-xs">60K / 100K</Text>
          </View>
          <Ionicons name="checkmark-circle" size={28} color="#E4FB52" />
        </View>

        {/* Account Age Milestone */}
        <View className="bg-[#151515] rounded-2xl p-4 flex-row items-center mb-3 border border-[#222]">
          <View className="w-12 h-12 rounded-xl bg-[#1A1A1A] items-center justify-center mr-4">
            <Ionicons name="calendar-outline" size={24} color="#888" />
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-medium mb-1">Account Age</Text>
            <Text className="text-[#888] text-xs">20 / 30 days</Text>
          </View>
          <Ionicons name="ellipse-outline" size={28} color="#555" />
        </View>

        {/* Community Guidelines Milestone */}
        <View className="bg-[#151515] rounded-2xl p-4 flex-row items-center mb-8 border border-[#222]">
          <View className="w-12 h-12 rounded-xl bg-[#1A1A1A] items-center justify-center mr-4 relative">
            <Ionicons name="shield-outline" size={24} color="#555" />
            <View className="absolute -top-1 -right-1 bg-[#151515] rounded-full p-0.5">
              <Ionicons name="lock-closed" size={10} color="#555" />
            </View>
          </View>
          <View className="flex-1">
            <Text className="text-[#888] text-base font-medium mb-1">Community Guidelines</Text>
            <Text className="text-[#555] text-xs">Pending review</Text>
          </View>
          <Ionicons name="ellipse-outline" size={28} color="#333" />
        </View>

        {/* Apply Button */}
        <CustomButton 
          title="APPLY NOW" 
          onPress={() => router.push('/screens/creator/apply')}
          containerStyle="bg-[#E4FB52]"
          textStyle="text-black"
        />
      </ScrollView>
    </View>
  );
}
