import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { KeyboardAvoidingView, Platform, StatusBar, StyleSheet, View, ActivityIndicator } from 'react-native';
import { FloatingReactions, FloatingReactionsHandle } from '../../../components/live/FloatingReactions';
import { LiveBottomActions } from '../../../components/live/LiveBottomActions';
import { LiveChatStream, ChatMessage, MOCK_CHAT } from '../../../components/live/LiveChatStream';
import { LiveSingleHeader } from '../../../components/live/LiveSingleHeader';
import { LiveGiftModal } from '../../../components/live/LiveGiftModal';

import { useRef, useState, useEffect } from 'react';

import { useAppStore } from '../../../store';
import { toast } from 'sonner-native';
import { liveStreamApi } from '../../../api/live-streams/live-stream.api';
import { avatarSource } from '../../../utils/avatar';
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

  const [isJoined, setIsJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number>(0);
  const agoraEngineRef = useRef<IRtcEngine | null>(null);

  const [streamInfo, setStreamInfo] = useState<{ hostAvatar?: string; hostName: string; viewers: string, duration: number } | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isJoined && streamInfo) {
      timer = setInterval(() => {
        setStreamInfo(prev => prev ? { ...prev, duration: prev.duration + 1 } : prev);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isJoined, streamInfo !== null]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const joinStream = async () => {
      try {
        const streamDetails = await liveStreamApi.joinStream(id as string);
        const tokenData = await liveStreamApi.getStreamToken(id as string);


        let initialDuration = 0;
        if (streamDetails.startedAt) {
          initialDuration = Math.floor((Date.now() - new Date(streamDetails.startedAt).getTime()) / 1000);
          if (initialDuration < 0) initialDuration = 0;
        }

        setStreamInfo({
          hostAvatar: streamDetails.hostId.avatarUrl,
          hostName: streamDetails.hostId.displayName || streamDetails.hostId.username || 'Live Host',
          viewers: streamDetails.viewerCount.toString(),
          duration: initialDuration,
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
      } catch (e: any) {
        console.error('Failed to join live stream', e);
        if (e?.response?.status === 409) {
          toast.error('This live stream is no longer active.');
        } else {
          toast.error('Failed to join live stream');
        }
        if (router.canGoBack()) router.back();
        else router.replace('/');
      }
    };

    joinStream();

    // Poll for viewer count updates
    const pollTimer = setInterval(async () => {
      try {
        const stream = await liveStreamApi.getStreamById(id as string);
        setStreamInfo(prev => prev ? { ...prev, viewers: stream.viewerCount.toString() } : prev);
      } catch (e) {
        // Ignore poll errors
      }
    }, 5000);

    return () => {
      clearInterval(pollTimer);
      agoraEngineRef.current?.leaveChannel();
      agoraEngineRef.current?.release();
      liveStreamApi.leaveStream(id as string).catch(() => { });
      agoraEngineRef.current = null;
    };
  }, [id]);

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

  const handleSelectGift = (gift: any) => {
    const success = useAppStore.getState().deductCoins(gift.price);

    if (success) {
      setGiftModalVisible(false);
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

      {streamInfo && (
        <LiveSingleHeader
          hostAvatar={avatarSource(streamInfo.hostAvatar)}
          hostName={streamInfo.hostName}
          viewers={`${streamInfo.viewers} (${formatDuration(streamInfo.duration)})`}
        />
      )}

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
