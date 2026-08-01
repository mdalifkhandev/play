import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export function LiveSingleHeader({ hostAvatar, hostName, viewers }: { hostAvatar: string, hostName: string, viewers: string }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={{ marginTop: insets.top + 10 }} className="flex-row justify-between items-center px-4 z-10">
      <View className="flex-row items-center flex-1">
        <Pressable onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </Pressable>
        
        <View className="flex-row items-center bg-black/40 rounded-full pr-4 py-1">
          <View className="relative ml-1">
            <Image source={{ uri: hostAvatar }} style={{ width: 36, height: 36, borderRadius: 18 }} />
            <View className="absolute -bottom-1 self-center bg-[#FF3B30] px-1 rounded-sm">
              <Text className="text-[8px] text-white font-bold">LIVE</Text>
            </View>
          </View>
          
          <View className="ml-3">
            <View className="flex-row items-center">
              <Text className="text-white text-sm font-bold mr-1">{hostName}</Text>
              <Ionicons name="checkmark-circle" size={14} color="#FFF" />
            </View>
            <View className="flex-row items-center">
              <Ionicons name="eye-outline" size={12} color="#CCC" />
              <Text className="text-[#CCC] text-xs ml-1">{viewers} Watching...</Text>
            </View>
          </View>
        </View>
      </View>

      <Pressable className="bg-white px-5 py-1.5 rounded-full ml-2">
        <Text className="text-black text-sm font-bold">Follow</Text>
      </Pressable>
    </View>
  );
}
