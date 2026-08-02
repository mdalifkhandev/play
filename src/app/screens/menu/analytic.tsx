import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polyline } from 'react-native-svg';

const CHIPS = ['7 days', '28 days', '60 days', '90 days', 'Custom'];
const METRICS = [
  { id: 1, title: 'Post views', value: '12', change: '+123', selected: true },
  { id: 2, title: 'Post views', value: '12', change: '+2', selected: false },
  { id: 3, title: 'Likes', value: '12', change: '+2', selected: false },
  { id: 4, title: 'Comments', value: '12', change: '+2', selected: false },
  { id: 5, title: 'Shares', value: '12', change: '+2', selected: false },
];

export default function AnalyticScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeChip, setActiveChip] = useState('7 days');

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 72; // Padding

  return (
    <View className="flex-1 bg-[#0A0A0A]" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 mt-4 mb-3">
        <View className="w-10 h-10 justify-center">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2">
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>
        </View>
        <Text className="text-white text-base font-bold flex-1 text-center">Analytic</Text>
        <View className="w-10 h-10 justify-center items-end">
          <Pressable className="pr-2 -mr-2">
            <Ionicons name="settings-outline" size={24} color="white" />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        {/* Chips */}
        <View className="mb-6 mt-2">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {CHIPS.map((chip) => (
              <Pressable
                key={chip}
                onPress={() => setActiveChip(chip)}
                className={`px-4 py-1.5 rounded-full mr-3 ${activeChip === chip ? 'bg-white' : 'bg-[#333]'}`}
              >
                <Text className={`text-sm font-medium ${activeChip === chip ? 'text-black' : 'text-[#888]'}`}>{chip}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View className="px-5">
          <Text className="text-white text-base font-bold mb-1">Analytic</Text>
          <Text className="text-[#888] text-xs mb-4">Jul 6 - Jul 12</Text>

          {/* Metrics Grid */}
          <View className="flex-row flex-wrap justify-between">
            {METRICS.map((metric) => (
              <View
                key={metric.id}
                className={`w-[48%] rounded-xl p-4 mb-4 ${metric.selected ? 'bg-[#1C2026] border border-[#3B82F6]' : 'bg-[#151515] border border-[#222]'}`}
              >
                <Text className="text-[#CCC] text-xs font-medium mb-2">{metric.title}</Text>
                <Text className="text-white text-xl font-bold font-inter-bold mb-3">{metric.value}</Text>
                <View className="flex-row items-center">
                  <View className="w-4 h-4 rounded-full bg-[#3B82F6] items-center justify-center mr-1.5">
                    <Ionicons name="arrow-up" size={10} color="white" />
                  </View>
                  <Text className="text-[#3B82F6] text-xs font-medium">{metric.change}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Graph */}
          <View className="bg-[#151515] border border-[#222] rounded-2xl p-5 mb-6 mt-2">
            <View className="h-40 relative flex-row">
              {/* Y Axis Labels */}
              <View className="absolute right-0 h-full justify-between items-end z-10 py-2">
                <Text className="text-[#666] text-[10px]">1k4</Text>
                <Text className="text-[#666] text-[10px]">1k</Text>
                <Text className="text-[#666] text-[10px]">500</Text>
                <Text className="text-[#666] text-[10px]">200</Text>
                <Text className="text-[#666] text-[10px]">0</Text>
              </View>

              {/* Chart Area */}
              <View className="flex-1 mr-8">
                {/* Horizontal grid lines */}
                {[0, 25, 50, 75, 100].map((percent, index) => (
                  <View
                    key={index}
                    className="absolute w-full border-t border-[#333] border-dashed"
                    style={{ top: `${percent}%` }}
                  />
                ))}

                {/* The SVG Line Chart */}
                <Svg height="100%" width="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="mt-2">
                  <Polyline
                    points="0,90 10,85 20,70 30,68 40,65 50,55 60,50 70,55 80,60 90,30 100,20"
                    fill="none"
                    stroke="#83D616"
                    strokeWidth="2"
                  />
                </Svg>

                {/* X Axis Labels */}
                <View className="absolute -bottom-6 w-full flex-row justify-between">
                  <Text className="text-[#666] text-[10px] text-center">06{'\n'}Jul</Text>
                  <Text className="text-[#666] text-[10px] text-center">12{'\n'}Jul</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Traffic Source */}
          <View className="bg-[#151515] border border-[#222] rounded-2xl p-5 mb-6 mt-4">
            <Text className="text-white text-base font-bold mb-2">Traffic source</Text>
            <Text className="text-[#888] text-xs mb-6 leading-5">
              You'll be able to see this information once there's enough data for analysis.
            </Text>

            {[1, 2, 3, 4, 5].map((item) => (
              <View key={item} className="mb-4">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-white text-xs">-</Text>
                  <Text className="text-white text-xs">-%</Text>
                </View>
                <View className="h-1.5 w-full bg-[#333] rounded-full" />
              </View>
            ))}
          </View>

          {/* Search queries */}
          <View className="bg-[#151515] border border-[#222] rounded-2xl p-5 mb-6">
            <Text className="text-white text-base font-bold mb-2">Search queries</Text>
            <Text className="text-[#888] text-xs leading-5">
              Each search query has low traffic at the moment. Information will be available once at least 1 query has enough traffic.
            </Text>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}
