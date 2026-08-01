import React from 'react';
import { Text, View } from 'react-native';

export function CreatorCard() {
  return (
    <View className="mt-8 mx-4 bg-[#141414] p-4 rounded-2xl border border-[#222] border-l-4 border-l-[#A3E635] overflow-hidden">
      <Text className="text-white text-[18px] font-inter-semibold w-[75%] leading-[22px]">
        You're on your way to becoming a
        Creator!
      </Text>

      <View className="mt-5 flex-row items-center">
        <View className="flex-1 h-1 bg-[#333] rounded-full overflow-hidden">
          <View className="h-full bg-[#A3E635] w-[45%]" />
        </View>
      </View>

      <View className="flex-row items-center justify-between mt-3">
        <Text className="text-[#A3E635] text-[11px] font-bold">45% Complete</Text>
        <Text className="text-[#888] text-[11px]">Step 2 of 4</Text>
      </View>
    </View>
  );
}
