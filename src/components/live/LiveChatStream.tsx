import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, ScrollView, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { avatarSource } from '../../utils/avatar';

export type ChatMessage = {
  id: string;
  userAvatar?: string;
  userName: string;
  isVerified?: boolean;
  message: string;
  type?: 'join' | 'message' | 'gift';
  giftName?: string;
  giftIconUrl?: string;
  createdAt?: string;
};

export const MOCK_CHAT: ChatMessage[] = [
  { id: '1', userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100', userName: 'Darrell Steward', message: 'Joined', type: 'join' },
  { id: '2', userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100', userName: 'Jenny', isVerified: true, message: 'Awesome clutch 👌👌' },
  { id: '3', userAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100', userName: 'Jenny Wilson', isVerified: true, message: 'Wow, your aim so perfect!' },
];

export function LiveChatStream({ messages = [], onCommentPress }: { messages?: ChatMessage[], onCommentPress?: (chat: ChatMessage) => void }) {
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
          onCommentPress && chat.type !== 'join' && chat.type !== 'gift' ? (
            <Pressable key={chat.id} onPress={() => onCommentPress(chat)} className="flex-row items-center bg-black/40 self-start rounded-full pr-4 py-1.5 pl-1.5">
              <Image source={avatarSource(chat.userAvatar)} style={{ width: 32, height: 32, borderRadius: 16 }} />
              <View className="ml-2">
                <View className="flex-row items-center">
                  <Text className="text-white/60 text-[10px] font-medium mr-1">{chat.userName}</Text>
                  {chat.isVerified && <Ionicons name="checkmark-circle" size={10} color="#3B82F6" />}
                </View>
                <Text className="text-white text-[13px] leading-5">{chat.message}</Text>
              </View>
            </Pressable>
          ) : chat.type === 'gift' ? (
            <View key={chat.id} className="flex-row items-center bg-pink-500/80 border border-pink-400 self-start rounded-full pr-4 py-1.5 pl-1.5 shadow-md shadow-pink-500/20">
              <Image source={avatarSource(chat.userAvatar)} style={{ width: 32, height: 32, borderRadius: 16 }} />
              <View className="ml-2 flex-row items-center">
                <View>
                  <View className="flex-row items-center">
                    <Text className="text-white/90 text-[10px] font-medium mr-1">{chat.userName}</Text>
                    {chat.isVerified && <Ionicons name="checkmark-circle" size={10} color="#3B82F6" />}
                  </View>
                  <Text className="text-white font-bold text-[13px] leading-5">Sent a {chat.giftName}!</Text>
                </View>
                {chat.giftIconUrl && (
                  <Image source={{ uri: chat.giftIconUrl }} style={{ width: 36, height: 36, marginLeft: 8 }} contentFit="contain" />
                )}
              </View>
            </View>
          ) : (
            <View key={chat.id} className="flex-row items-center bg-black/40 self-start rounded-full pr-4 py-1.5 pl-1.5">
              <Image source={avatarSource(chat.userAvatar)} style={{ width: 32, height: 32, borderRadius: 16 }} />
              <View className="ml-2">
                <View className="flex-row items-center">
                  <Text className="text-white/60 text-[10px] font-medium mr-1">{chat.userName}</Text>
                  {chat.isVerified && <Ionicons name="checkmark-circle" size={10} color="#3B82F6" />}
                </View>
                <Text className="text-white text-[13px] leading-5">{chat.message}</Text>
              </View>
            </View>
          )
        ))}
      </ScrollView>
    </View>
  );
}
