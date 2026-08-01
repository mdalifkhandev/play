import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function CreatorTools() {
  return (
    <View className="mt-8">
      <View className="flex-row items-center justify-between px-4 mb-4">
        <Text className="text-[#666] text-[10px] font-bold uppercase tracking-wider">CREATOR TOOLS</Text>
        <Ionicons name="lock-closed-outline" size={12} color="#666" />
      </View>

      <View className="flex-row px-4 gap-3">
        <Pressable className="flex-1 border border-[#222] rounded-xl py-4 items-center justify-center bg-[#0a0a0a]">
          <Ionicons name="grid-outline" size={24} color="#444" />
          <Text className="text-[#444] text-[10px] font-semibold mt-2">Dashboard</Text>
          <View className="absolute bottom-2 right-2">
            <Ionicons name="lock-closed" size={10} color="#444" />
          </View>
        </Pressable>
        
        <Pressable className="flex-1 border border-[#222] rounded-xl py-4 items-center justify-center bg-[#0a0a0a]">
          <Ionicons name="cellular-outline" size={24} color="#444" />
          <Text className="text-[#444] text-[10px] font-semibold mt-2">Subscription</Text>
          <View className="absolute bottom-2 right-2">
            <Ionicons name="lock-closed" size={10} color="#444" />
          </View>
        </Pressable>
        
        <Pressable className="flex-1 border border-[#222] rounded-xl py-4 items-center justify-center bg-[#0a0a0a]">
          <Ionicons name="ticket-outline" size={24} color="#444" />
          <Text className="text-[#444] text-[10px] font-semibold mt-2">Earning</Text>
          <View className="absolute bottom-2 right-2">
            <Ionicons name="lock-closed" size={10} color="#444" />
          </View>
        </Pressable>
      </View>
    </View>
  );
}
