import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { KeyboardAvoidingView, Platform, StatusBar, StyleSheet, View } from 'react-native';
import { FloatingReactions, FloatingReactionsHandle } from '../../../components/live/FloatingReactions';
import { LiveBottomActions } from '../../../components/live/LiveBottomActions';
import { LiveChatStream } from '../../../components/live/LiveChatStream';
import { LiveSingleHeader } from '../../../components/live/LiveSingleHeader';
import { LiveGiftModal } from '../../../components/live/LiveGiftModal';

import { useRef, useState } from 'react';
import { MOCK_LIVES } from '../../(tab)/live';
import { ChatMessage, MOCK_CHAT } from '../../../components/live/LiveChatStream';
import { useAppStore } from '../../../store';
import { toast } from 'sonner-native';

export default function LiveSingleScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

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
  const [giftModalVisible, setGiftModalVisible] = useState(false);

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

  const handleSelectGift = (gift: { id: string, name: string, icon: string, price: number }) => {
    const success = useAppStore.getState().deductCoins(gift.price);
    
    if (success) {
      setGiftModalVisible(false);
      // Add message to chat
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        userName: 'You',
        message: `Sent a ${gift.icon} ${gift.name}`,
      };
      setMessages([...messages, newMessage]);
      floatingReactionsRef.current?.addReaction();
    } else {
      setGiftModalVisible(false);
      toast.error('Not enough coins!');
      setTimeout(() => {
        router.push('/screens/coins/wallet');
      }, 300);
    }
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
        onGiftPress={() => setGiftModalVisible(true)}
      />

      <LiveGiftModal 
        visible={giftModalVisible} 
        onClose={() => setGiftModalVisible(false)} 
        onSelectGift={handleSelectGift} 
      />
    </KeyboardAvoidingView>
  );
}
