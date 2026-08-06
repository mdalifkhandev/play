import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EffectPanelProps {
  activePanel: string | null;
  activeEffect: string | null;
  setActiveEffect: (val: string | null) => void;
}

const EFFECTS = ['None', 'Glitch', 'Sparkle', 'Zoom', 'Flash', 'VHS'];

export function EffectPanel({ activePanel, activeEffect, setActiveEffect }: EffectPanelProps) {
  if (activePanel !== 'effects') return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-4">
      {EFFECTS.map((effect) => {
        const isActive = activeEffect === effect || (effect === 'None' && !activeEffect);
        return (
          <Pressable key={effect} onPress={() => setActiveEffect(effect === 'None' ? null : effect)} className="items-center mr-4">
            <View className={`w-16 h-16 rounded-2xl bg-[#333] items-center justify-center mb-2 border-2 ${isActive ? 'border-[#98FF2F]' : 'border-[#444]'}`}>
              <Ionicons name={effect === 'None' ? 'close' : 'sparkles'} size={24} color={isActive ? '#98FF2F' : 'white'} />
            </View>
            <Text className={`font-inter-medium text-sm ${isActive ? 'text-[#98FF2F]' : 'text-white'}`}>{effect}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
