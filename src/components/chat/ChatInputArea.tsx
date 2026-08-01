import React from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

interface ChatInputAreaProps {
  message: string;
  onChangeMessage: (msg: string) => void;
  onFocus: () => void;
  onSend: () => void;
  onToggleAttachMenu: () => void;
  showAttachMenu: boolean;
}

export function ChatInputArea({
  message,
  onChangeMessage,
  onFocus,
  onSend,
  onToggleAttachMenu,
  showAttachMenu,
}: ChatInputAreaProps) {
  return (
    <View className="flex-row items-center px-4 py-3 bg-[#0A0A0A] z-20 border-t border-[#1C1C1E]">
      <Pressable
        className="w-12 h-12 rounded-full border border-[#333] items-center justify-center mr-3"
        onPress={onToggleAttachMenu}
      >
        <Ionicons name={showAttachMenu ? 'close' : 'add'} size={36} color="#FFF" />
      </Pressable>

      <View className="flex-1 h-12 border border-[#333] rounded-full px-4 justify-center mr-3">
        <TextInput
          className="text-white text-sm"
          placeholder="Type a message..."
          placeholderTextColor="#888"
          value={message}
          onChangeText={onChangeMessage}
          onFocus={onFocus}
        />
      </View>

      <Pressable
        className="w-12 h-12 rounded-full border border-[#333] items-center justify-center"
        onPress={onSend}
      >
        {/* We use standard require since the image is located via assets folder */}
        <Image
          source={require('../../../assets/icon/send.svg')}
          style={{ width: 24, height: 24, tintColor: '#FFF', marginLeft: -2, marginTop: -2 }}
          contentFit="contain"
        />
      </Pressable>
    </View>
  );
}
