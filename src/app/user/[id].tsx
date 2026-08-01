import { View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-black items-center justify-center">
      <Pressable 
        style={{ top: insets.top + 10, left: 20 }}
        className="absolute z-10 w-10 h-10 rounded-full bg-white/20 items-center justify-center"
        onPress={() => router.back()}
      >
        <Ionicons name="chevron-back" size={24} color="#FFF" />
      </Pressable>

      <Text className="text-white text-2xl font-bold mb-2">User Profile</Text>
      <Text className="text-gray-400 text-base">ID: {id}</Text>
      <Text className="text-gray-500 text-sm mt-4 text-center px-8">
        This is a placeholder for the user profile screen. Design will be added later.
      </Text>
    </View>
  );
}
