import React from 'react';
import { View, Text } from 'react-native';

export function CollectionsTab() {
  return (
    <View className="flex-1 items-center justify-center mt-12 px-10">
      <Text className="text-white text-base font-bold mb-3">Your Collections</Text>
      <Text className="text-[#888] text-center text-xs leading-5">
        Only your favourite videos can be added to a collection. To create a collection, start by adding videos to Favourites.
      </Text>
    </View>
  );
}
