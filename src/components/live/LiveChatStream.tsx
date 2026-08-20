import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, ScrollView, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { avatarSource } from '../../utils/avatar';

export type ChatMessage = {
  id: string;
  userId?: string;
  userAvatar?: string;
  userName: string;
  isVerified?: boolean;
  message: string;
  type?: 'join' | 'message' | 'gift';
  giftName?: string;
  giftIconUrl?: string;
  giftIcon?: string;
  createdAt?: string;
};

function isRemoteGiftIcon(icon?: string): icon is string {
  return !!icon && /^https?:\/\//i.test(icon);
}

function getGiftIconGlyph(icon?: string, giftName?: string) {
  const key = (icon || giftName || '').trim().toLowerCase();
  const glyphs: Record<string, string> = {
    crown: '👑',
    diamond: '💎',
    gem: '💎',
    love: '❤️',
    heart: '❤️',
    rocket: '🚀',
    rose: '🌹',
    gift: '🎁',
  };

  return glyphs[key] || '🎁';
}

export const MOCK_CHAT: ChatMessage[] = [
  { id: '1', userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100', userName: 'Darrell Steward', message: 'Joined', type: 'join' },
  { id: '2', userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100', userName: 'Jenny', isVerified: true, message: 'Awesome clutch 👌👌' },
  { id: '3', userAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100', userName: 'Jenny Wilson', isVerified: true, message: 'Wow, your aim so perfect!' },
];

export function LiveChatStream({
  messages = [],
  currentUserId,
  onCommentPress,
}: {
  messages?: ChatMessage[];
  currentUserId?: string;
  onCommentPress?: (chat: ChatMessage) => void;
}) {
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
            <Pressable
              key={chat.id}
              onPress={() => onCommentPress(chat)}
              className="flex-row items-start bg-black/40 self-start rounded-2xl pr-4 py-1.5 pl-1.5"
              style={{ maxWidth: '100%' }}
            >
              <Image source={avatarSource(chat.userAvatar)} style={{ width: 32, height: 32, borderRadius: 16 }} />
              <View className="ml-2" style={{ flexShrink: 1 }}>
                <View className="flex-row items-center">
                  <Text className="text-white/60 text-[10px] font-medium mr-1" numberOfLines={1} ellipsizeMode="tail">
                    {chat.userName}
                  </Text>
                  {chat.isVerified && <Ionicons name="checkmark-circle" size={10} color="#3B82F6" />}
                </View>
                <Text className="text-white text-[13px] leading-5" style={{ flexShrink: 1, flexWrap: 'wrap' }}>
                  {chat.message}
                </Text>
              </View>
            </Pressable>
          ) : chat.type === 'gift' ? (
            <View
              key={chat.id}
              className="flex-row items-start bg-black/40 self-start rounded-2xl pr-4 py-1.5 pl-1.5"
              style={{ maxWidth: '100%' }}
            >
              <Image source={avatarSource(chat.userAvatar)} style={{ width: 32, height: 32, borderRadius: 16 }} />
              <View className="ml-2" style={{ flexShrink: 1 }}>
                <View className="flex-row items-center">
                  <Text className="text-white/60 text-[10px] font-medium mr-1" numberOfLines={1} ellipsizeMode="tail">
                    {chat.userId && currentUserId && chat.userId === currentUserId ? 'You' : chat.userName}
                  </Text>
                  {chat.isVerified && <Ionicons name="checkmark-circle" size={10} color="#3B82F6" />}
                </View>
                <Text className="text-white text-[13px] leading-5" style={{ flexShrink: 1, flexWrap: 'wrap' }}>
                  {chat.userId && currentUserId && chat.userId === currentUserId
                    ? `You sent ${chat.giftName || 'a gift'}`
                    : `${chat.userName} sent ${chat.giftName || 'a gift'}`}
                </Text>
              </View>
              {(chat.giftIconUrl || chat.giftIcon) && (
                isRemoteGiftIcon(chat.giftIconUrl || chat.giftIcon) ? (
                  <Image source={{ uri: chat.giftIconUrl || chat.giftIcon }} style={{ width: 28, height: 28, marginLeft: 8 }} contentFit="contain" />
                ) : (
                  <Text className="text-xl ml-2">{getGiftIconGlyph(chat.giftIcon, chat.giftName)}</Text>
                )
              )}
            </View>
          ) : (
            <View
              key={chat.id}
              className="flex-row items-start bg-black/40 self-start rounded-2xl pr-4 py-1.5 pl-1.5"
              style={{ maxWidth: '100%' }}
            >
              <Image source={avatarSource(chat.userAvatar)} style={{ width: 32, height: 32, borderRadius: 16 }} />
              <View className="ml-2" style={{ flexShrink: 1 }}>
                <View className="flex-row items-center">
                  <Text className="text-white/60 text-[10px] font-medium mr-1" numberOfLines={1} ellipsizeMode="tail">
                    {chat.userName}
                  </Text>
                  {chat.isVerified && <Ionicons name="checkmark-circle" size={10} color="#3B82F6" />}
                </View>
                <Text className="text-white text-[13px] leading-5" style={{ flexShrink: 1, flexWrap: 'wrap' }}>
                  {chat.message}
                </Text>
              </View>
            </View>
          )
        ))}
      </ScrollView>
    </View>
  );
}
