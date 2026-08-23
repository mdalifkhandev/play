import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export function CreatorTools() {
  const router = useRouter();
  const tools = [
    {
      label: 'Dashboard',
      icon: 'grid-outline' as const,
      route: '/screens/menu/analytic' as const,
    },
    {
      label: 'Balance',
      icon: 'wallet-outline' as const,
      route: '/screens/menu/balance' as const,
    },
    {
      label: 'Rewards',
      icon: 'trophy-outline' as const,
      route: '/screens/menu/reward' as const,
    },
  ];

  return (
    <View className="mt-8">
      <View className="flex-row items-center justify-between px-4 mb-4">
        <Text className="text-[#A3E635] text-[10px] font-bold uppercase tracking-wider">CREATOR TOOLS</Text>
        <Ionicons name="checkmark-circle" size={14} color="#A3E635" />
      </View>

      <View className="flex-row px-4 gap-3">
        {tools.map(tool => (
          <Pressable
            key={tool.label}
            onPress={() => router.push(tool.route)}
            className="flex-1 border border-[#A3E635]/30 rounded-xl py-4 items-center justify-center bg-[#111]"
          >
            <Ionicons name={tool.icon} size={24} color="#A3E635" />
            <Text className="text-white text-[10px] font-semibold mt-2">{tool.label}</Text>
            <View className="absolute bottom-2 right-2">
              <Ionicons name="chevron-forward" size={10} color="#A3E635" />
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
