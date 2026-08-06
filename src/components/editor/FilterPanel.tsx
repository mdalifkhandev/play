import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';

interface FilterPanelProps {
  activePanel: string | null;
  activeFilter: string;
  setActiveFilter: (val: string) => void;
  mockImage: string;
}

const FILTERS = ['Normal', 'Vivid', 'Mono', 'Vintage', 'Warm'];

export function FilterPanel({ activePanel, activeFilter, setActiveFilter, mockImage }: FilterPanelProps) {
  if (activePanel !== 'filters') return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-4">
      {FILTERS.map((filter) => (
        <Pressable key={filter} onPress={() => setActiveFilter(filter)} className="items-center mr-4">
          <View className={`w-16 h-16 rounded-full border-2 ${activeFilter === filter ? 'border-[#98FF2F]' : 'border-transparent'} mb-2 overflow-hidden bg-black`}>
            <Image source={{ uri: mockImage }} className="w-full h-full opacity-80" contentFit="cover" />
          </View>
          <Text className={`font-inter-medium text-sm ${activeFilter === filter ? 'text-[#98FF2F]' : 'text-white'}`}>{filter}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
