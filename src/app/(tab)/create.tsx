import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CreateScreen() {
  const { soundUrl, title } = useLocalSearchParams<{ soundUrl?: string; title?: string }>();

  return (
    <View className="flex-1 bg-black items-center justify-center p-4">
      <Text className="text-white text-2xl font-bold mb-4">Create Screen</Text>
      {title ? (
        <View className="bg-[#2A2A2A] p-4 rounded-xl items-center flex-row">
          <Ionicons name="musical-notes" size={24} color="#98FF2F" className="mr-3" />
          <View className="ml-3">
            <Text className="text-white font-semibold text-lg">{title}</Text>
            <Text className="text-[#888] text-sm mt-1">Sound attached and ready!</Text>
          </View>
        </View>
      ) : (
        <Text className="text-[#888] text-base text-center">
          No music selected. Tap "Search" to find sounds.
        </Text>
      )}
    </View>
  );
}
