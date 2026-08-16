import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { useState } from 'react';

export function LiveSingleHeader({ hostAvatar, hostName, viewers, hostId = '1' }: { hostAvatar: any, hostName: string, viewers: string, hostId?: string }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(false);

  return (
    <View style={{ marginTop: insets.top + 10 }} className="flex-row justify-between items-center px-4 z-10">
      <View className="flex-row items-center flex-1">
        <Pressable onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </Pressable>
        
        <Link href={{ pathname: '/screens/user/[id]', params: { id: hostId } }} asChild>
          <Pressable className="flex-row items-center bg-black/40 rounded-full pr-4 py-1">
            <View className="relative ml-1">
              <Image source={hostAvatar} style={{ width: 36, height: 36, borderRadius: 18 }} />
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
          </Pressable>
        </Link>
      </View>

      <Pressable 
        onPress={() => setIsFollowing(!isFollowing)}
        className={`${isFollowing ? 'bg-transparent border border-white/50' : 'bg-white'} px-4 py-1.5 rounded-full ml-2`}
      >
        <Text className={`${isFollowing ? 'text-white' : 'text-black'} text-sm font-bold`}>
          {isFollowing ? 'Following' : 'Follow'}
        </Text>
      </Pressable>
    </View>
  );
}
