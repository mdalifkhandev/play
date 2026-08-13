import React from 'react';
import { View, Text, ScrollView, Pressable, Image as RNImage } from 'react-native';

interface FilterPanelProps {
  activePanel: string | null;
  activeFilter: string;
  setActiveFilter: (val: string) => void;
  mockImage: string;
}

const FILTERS = ['Normal', 'Vivid', 'Mono', 'Vintage', 'Warm'];

const filterOverlayColor = (filter: string) => {
  if (filter === 'Vivid') return 'rgba(255, 50, 50, 0.18)';
  if (filter === 'Mono') return 'rgba(0, 0, 0, 0.45)';
  if (filter === 'Vintage') return 'rgba(112, 66, 20, 0.3)';
  if (filter === 'Warm') return 'rgba(255, 165, 0, 0.22)';
  return 'transparent';
};

export function FilterPanel({ activePanel, activeFilter, setActiveFilter, mockImage }: FilterPanelProps) {
  if (activePanel !== 'filters') return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-4">
      {FILTERS.map((filter) => (
        <Pressable key={filter} onPress={() => setActiveFilter(filter)} className="items-center mr-4">
          <View className={`w-16 h-16 rounded-full border-2 ${activeFilter === filter ? 'border-[#98FF2F]' : 'border-transparent'} mb-2 overflow-hidden bg-[#222]`}>
            <RNImage source={{ uri: mockImage }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            {filter !== 'Normal' && (
              <View className="absolute inset-0" style={{ backgroundColor: filterOverlayColor(filter) }} />
            )}
          </View>
          <Text className={`font-inter-medium text-sm ${activeFilter === filter ? 'text-[#98FF2F]' : 'text-white'}`}>{filter}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
