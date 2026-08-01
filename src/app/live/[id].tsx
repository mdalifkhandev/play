import { useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { StatusBar, StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native';
import { LiveBottomActions } from '../../components/live/LiveBottomActions';
import { LiveChatStream } from '../../components/live/LiveChatStream';
import { LiveSingleHeader } from '../../components/live/LiveSingleHeader';
import { FloatingReactions, FloatingReactionsHandle } from '../../components/live/FloatingReactions';

import { useState, useRef } from 'react';
import { MOCK_LIVES } from '../(tab)/live';
import { MOCK_CHAT, ChatMessage } from '../../components/live/LiveChatStream';

export default function LiveSingleScreen() {
  const { id } = useLocalSearchParams();

  const mockData = MOCK_LIVES.find(m => m.id === id);
  const videoUrl = mockData?.videoUrl || 'https://vjs.zencdn.net/v/oceans.mp4';

  const player = useVideoPlayer(videoUrl, player => {
    player.loop = true;
    player.play();
  });

  const streamData = {
    hostAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100',
    hostName: 'Dianne Wilson',
    viewers: '41.3K',
  };

  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_CHAT);
  const [inputText, setInputText] = useState('');
  
  const floatingReactionsRef = useRef<FloatingReactionsHandle>(null);

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      userName: 'You',
      message: inputText.trim(),
    };
    setMessages([...messages, newMessage]);
    setInputText('');
  };

  const handleHeartPress = () => {
    floatingReactionsRef.current?.addReaction();
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      className="bg-black relative"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        nativeControls={false}
        contentFit="cover"
      />

      <View className="absolute inset-0 bg-black/20" />

      <LiveSingleHeader
        hostAvatar={streamData.hostAvatar}
        hostName={streamData.hostName}
        viewers={streamData.viewers}
      />

      <LiveChatStream messages={messages} />
      
      <FloatingReactions ref={floatingReactionsRef} />

      <LiveBottomActions 
        inputText={inputText}
        onChangeText={setInputText}
        onSend={handleSend}
        onHeartPress={handleHeartPress}
      />
    </KeyboardAvoidingView>
  );
}
