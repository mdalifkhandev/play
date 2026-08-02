import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Keyboard, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  inputText?: string;
  onChangeText?: (text: string) => void;
  onSend?: () => void;
  onHeartPress?: () => void;
};

export function LiveBottomActions({ inputText, onChangeText, onSend, onHeartPress }: Props) {
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

  const bottomPadding = isKeyboardVisible ? 10 : Math.max(insets.bottom, 10);

  return (
    <View style={{ paddingBottom: bottomPadding }} className="absolute bottom-2 left-0 right-0 px-4 flex-row items-center z-10 pt-2">
      <View className="flex-row flex-1 bg-black/40 rounded-full items-center p-1 pl-3">
        <Pressable>
          <Ionicons name="gift-outline" size={24} color="#FFD700" />
        </Pressable>
        <TextInput
          placeholder="Comment..."
          placeholderTextColor="#999"
          className="flex-1 text-white px-3 py-2 text-sm"
          value={inputText}
          onChangeText={onChangeText}
          onSubmitEditing={onSend}
          returnKeyType="send"
        />
        <Pressable
          className="bg-[#98FF2F] w-8 h-8 rounded-full items-center justify-center mr-1"
          onPress={onSend}
        >
          <Ionicons name="paper-plane" size={16} color="#000" />
        </Pressable>
      </View>

      <View className="flex-row items-center ml-3 gap-3">
        <Pressable className="bg-black/40 w-10 h-10 rounded-full items-center justify-center">
          <Ionicons name="share-social" size={20} color="#FFF" />
        </Pressable>
        <Pressable
          className="bg-[#FFEAEE] w-10 h-10 rounded-full items-center justify-center"
          onPress={onHeartPress}
        >
          <Ionicons name="heart" size={24} color="#FF3B30" />
        </Pressable>
      </View>
    </View>
  );
}
