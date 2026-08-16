import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { KeyboardAvoidingView, Platform, StatusBar, StyleSheet, View, ActivityIndicator } from 'react-native';
import { FloatingReactions, FloatingReactionsHandle } from '../../../components/live/FloatingReactions';
import { LiveBottomActions } from '../../../components/live/LiveBottomActions';
import { LiveChatStream } from '../../../components/live/LiveChatStream';
import { LiveSingleHeader } from '../../../components/live/LiveSingleHeader';
import { LiveGiftModal } from '../../../components/live/LiveGiftModal';

import { useRef, useState, useEffect } from 'react';

import { ChatMessage, MOCK_CHAT } from '../../../components/live/LiveChatStream';
import { useAppStore } from '../../../store';
import { toast } from 'sonner-native';
import { liveStreamApi } from '../../../api/live-streams/live-stream.api';
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  IRtcEngine,
  RtcSurfaceView,
} from 'react-native-agora';

export default function LiveSingleScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const player = useVideoPlayer('https://vjs.zencdn.net/v/oceans.mp4', player => {
    player.loop = true;
    player.play();
  });

  const [isJoined, setIsJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number>(0);
  const agoraEngineRef = useRef<IRtcEngine | null>(null);
  
  const [streamInfo, setStreamInfo] = useState<{ hostAvatar: string; hostName: string; viewers: string } | null>(null);

  useEffect(() => {
    // Fetch stream info and join via Agora
    const joinStream = async () => {
      try {
        const tokenData = await liveStreamApi.getStreamToken(id as string);
        
        // Also we could fetch stream details if we had a getStreamById endpoint, but for now we rely on the list view or generic data
        setStreamInfo({
          hostAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100', // Default
          hostName: 'Live Host',
          viewers: '1',
        });

        const appId = process.env.EXPO_PUBLIC_AGORA_APP_ID;
        if (!appId) throw new Error('Missing Agora App ID in environment');

        const engine = createAgoraRtcEngine();
        agoraEngineRef.current = engine;
        
        engine.initialize({ appId, channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting });
        engine.enableVideo();
        
        engine.registerEventHandler({
          onJoinChannelSuccess: () => setIsJoined(true),
          onUserJoined: (_conn, uid) => setRemoteUid(uid),
          onUserOffline: (_conn, uid) => {
            setRemoteUid(0);
            toast.error('The host has ended the stream.');
            if (router.canGoBack()) router.back();
            else router.replace('/');
          },
        });

        engine.setClientRole(ClientRoleType.ClientRoleAudience);
        engine.joinChannel(tokenData.token, tokenData.channelName, tokenData.uid, {
          clientRoleType: ClientRoleType.ClientRoleAudience,
          autoSubscribeAudio: true,
          autoSubscribeVideo: true,
        });
      } catch (e) {
        console.error('Failed to join live stream', e);
        toast.error('Failed to join live stream');
      }
    };
    
    joinStream();
    
    return () => {
      if (agoraEngineRef.current) {
        agoraEngineRef.current.leaveChannel();
        agoraEngineRef.current.release();
        agoraEngineRef.current = null;
      }
    };
  }, [id]);

  const streamData = streamInfo || {
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

      {isJoined && remoteUid !== 0 ? (
        <RtcSurfaceView
          canvas={{ uid: remoteUid }}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#FF3B30" />
        </View>
      )}

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
