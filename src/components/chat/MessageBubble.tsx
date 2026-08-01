import React from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';

export interface MessageType {
  id: string;
  text: string;
  time: string;
  sender: 'me' | 'other';
  avatar?: string;
  attachmentType?: 'image' | 'video' | 'audio' | 'file';
  attachmentUrl?: string;
}

function VideoMessage({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
    player.muted = true;
  });
  return <VideoView player={player} style={{ width: 200, height: 200, borderRadius: 12, marginBottom: 8 }} />;
}

export function MessageBubble({ msg }: { msg: MessageType }) {
  const isMe = msg.sender === 'me';

  return (
    <View className={`flex-row mb-6 ${isMe ? 'justify-end' : 'justify-start'}`}>
      {!isMe && (
        <View className="mr-2 justify-end pb-1 relative">
          <Image
            source={{ uri: msg.avatar }}
            style={{ width: 32, height: 32, borderRadius: 16 }}
            contentFit="cover"
          />
          <View className="absolute bottom-1 right-0 w-2.5 h-2.5 bg-[#00C853] rounded-full border-2 border-[#0A0A0A]" />
        </View>
      )}

      <View
        className={`max-w-[75%] px-4 py-3 rounded-2xl ${
          isMe ? 'bg-[#1C1C1E] rounded-br-sm' : 'bg-[#A3E635] rounded-bl-sm'
        }`}
      >
        {msg.attachmentType === 'image' && (
          <Image
            source={{ uri: msg.attachmentUrl }}
            style={{ width: 200, height: 200, borderRadius: 12, marginBottom: 8 }}
            contentFit="cover"
          />
        )}
        {msg.attachmentType === 'video' && msg.attachmentUrl && (
          <VideoMessage uri={msg.attachmentUrl} />
        )}
        {msg.attachmentType === 'audio' && (
          <View className="flex-row items-center mb-2 bg-[#333] p-2 rounded-lg">
            <Ionicons name="musical-notes" size={24} color="#FFF" />
            <Text className="text-white ml-2">Audio File</Text>
          </View>
        )}
        {msg.attachmentType === 'file' && (
          <View className="flex-row items-center mb-2 bg-[#333] p-2 rounded-lg">
            <Ionicons name="document" size={24} color="#FFF" />
            <Text className="text-white ml-2">Document</Text>
          </View>
        )}
        <Text className={`text-base ${isMe ? 'text-white' : 'text-black'}`}>
          {msg.text}
        </Text>
        <Text className={`text-[10px] mt-1 ${isMe ? 'text-[#888]' : 'text-black/60'}`}>
          {msg.time}
        </Text>
      </View>
    </View>
  );
}
