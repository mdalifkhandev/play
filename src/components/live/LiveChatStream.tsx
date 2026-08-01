import { View, Text, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

type ChatMessage = {
  id: string;
  userAvatar: string;
  userName: string;
  isVerified?: boolean;
  message: string;
  type?: 'join' | 'message';
};

const MOCK_CHAT: ChatMessage[] = [
  { id: '1', userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100', userName: 'Darrell Steward', message: 'Joined', type: 'join' },
  { id: '2', userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100', userName: 'Jenny', isVerified: true, message: 'Awesome clutch 👌👌' },
  { id: '3', userAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100', userName: 'Jenny Wilson', isVerified: true, message: 'Wow, your aim so perfect!' },
];

export function LiveChatStream() {
  return (
    <View className="absolute bottom-24 left-0 w-3/4 px-4 h-48 z-10 justify-end">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 10 }}>
        {MOCK_CHAT.map((chat) => (
          <View key={chat.id} className="flex-row items-center bg-black/40 self-start rounded-full pr-4 py-1.5 pl-1.5">
            <Image source={{ uri: chat.userAvatar }} style={{ width: 32, height: 32, borderRadius: 16 }} />
            <View className="ml-2">
              <View className="flex-row items-center">
                <Text className="text-white/80 text-xs font-semibold mr-1">{chat.userName}</Text>
                {chat.isVerified && <Ionicons name="checkmark-circle" size={12} color="#1DA1F2" />}
              </View>
              <Text className={`text-sm ${chat.type === 'join' ? 'text-white/60' : 'text-white'} mt-0.5`}>{chat.message}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
