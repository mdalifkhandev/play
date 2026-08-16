import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, useRef } from 'react';
import { Keyboard, Pressable, TextInput, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  inputText?: string;
  onChangeText?: (text: string) => void;
  onSend?: () => void;
  onHeartPress?: () => void;
  onGiftPress?: () => void;
  isHost?: boolean;
  onCameraFlip?: () => void;
  onSharePress?: () => void;
  replyToUser?: string | null;
  onCancelReply?: () => void;
};

export function LiveBottomActions({ inputText, onChangeText, onSend, onHeartPress, onGiftPress, isHost, onCameraFlip, onSharePress, replyToUser, onCancelReply }: Props) {
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (replyToUser) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [replyToUser]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const bottomPadding = isKeyboardVisible ? 10 : Math.max(insets.bottom, 10);

  return (
    <View style={{ paddingBottom: bottomPadding }} className="absolute bottom-2 left-0 right-0 px-4 flex-row items-center z-10 pt-2">
        <View className="flex-row flex-1 bg-black/40 rounded-full items-center p-1 pl-3">
          <Pressable onPress={onGiftPress}>
            <Ionicons name="gift-outline" size={24} color="#FFD700" />
          </Pressable>
          <View className="flex-1 px-2 py-1">
            {replyToUser && (
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-white/60 text-[10px]">Replying to @{replyToUser}</Text>
                <Pressable onPress={onCancelReply}>
                  <Ionicons name="close-circle" size={12} color="#FFF" />
                </Pressable>
              </View>
            )}
            <TextInput
              ref={inputRef}
              placeholder="Comment..."
              placeholderTextColor="#999"
              className="text-white py-1 text-sm"
              value={inputText}
              onChangeText={onChangeText}
              onSubmitEditing={onSend}
              returnKeyType="send"
            />
          </View>
          <Pressable
            className="bg-[#98FF2F] w-8 h-8 rounded-full items-center justify-center mr-1"
            onPress={onSend}
          >
            <Ionicons name="paper-plane" size={16} color="#000" />
          </Pressable>
        </View>

      <View className="flex-row items-center gap-3 ml-3">
        <Pressable 
          className="bg-black/40 w-10 h-10 rounded-full items-center justify-center"
          onPress={onSharePress}
        >
          <Ionicons name="share-social" size={20} color="#FFF" />
        </Pressable>
        {isHost ? (
          <Pressable
            className="bg-black/40 w-10 h-10 rounded-full items-center justify-center"
            onPress={onCameraFlip}
          >
            <Ionicons name="camera-reverse" size={24} color="#FFF" />
          </Pressable>
        ) : (
          <Pressable
            className="bg-[#FFEAEE] w-10 h-10 rounded-full items-center justify-center"
            onPress={onHeartPress}
          >
            <Ionicons name="heart" size={24} color="#FF3B30" />
          </Pressable>
        )}
      </View>
    </View>
  );
}
