import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, ScrollView, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link } from 'expo-router';

export type ChatMessage = {
  id: string;
  userAvatar: string;
  userName: string;
  isVerified?: boolean;
  message: string;
  type?: 'join' | 'message';
};

export const MOCK_CHAT: ChatMessage[] = [
  { id: '1', userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100', userName: 'Darrell Steward', message: 'Joined', type: 'join' },
  { id: '2', userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100', userName: 'Jenny', isVerified: true, message: 'Awesome clutch 👌👌' },
  { id: '3', userAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100', userName: 'Jenny Wilson', isVerified: true, message: 'Wow, your aim so perfect!' },
];

export function LiveChatStream({ messages = MOCK_CHAT }: { messages?: ChatMessage[] }) {
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // When keyboard is open, the container shrinks, so we don't need the inset padding.
  // We only need enough space to clear the comment box (~60px).
  // When closed, we need to clear the comment box + the safe area inset.
  const bottomOffset = isKeyboardVisible ? 50 : Math.max(insets.bottom, 10) + 35;

  return (
    <View style={{ bottom: bottomOffset }} className="absolute left-0 w-3/4 px-4 h-48 z-10 justify-end">
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingBottom: 10 }}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((chat) => (
          <Link key={chat.id} href={{ pathname: '/screens/user/[id]', params: { id: chat.id } }} asChild>
            <Pressable className="flex-row items-center bg-black/40 self-start rounded-full pr-4 py-1.5 pl-1.5">
              <Image source={{ uri: chat.userAvatar }} style={{ width: 32, height: 32, borderRadius: 16 }} />
              <View className="ml-2">
                <View className="flex-row items-center">
                  <Text className="text-white/80 text-xs font-semibold mr-1">{chat.userName}</Text>
                  {chat.isVerified && <Ionicons name="checkmark-circle" size={12} color="#1DA1F2" />}
                </View>
                <Text className={`text-sm ${chat.type === 'join' ? 'text-white/60' : 'text-white'} mt-0.5`}>{chat.message}</Text>
              </View>
            </Pressable>
          </Link>
        ))}
      </ScrollView>
    </View>
  );
}
