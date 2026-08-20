import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { KeyboardAvoidingView, Platform, StatusBar, StyleSheet, View, ActivityIndicator, Alert, Share } from 'react-native';
import * as Linking from 'expo-linking';
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
  RenderModeType,
  RtcSurfaceView,
} from 'react-native-agora';
import { ensureChatSocket } from '../../../api/conversations/chatSocket';

export default function LiveSingleScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const user = useAppStore((state) => state.user);

  const [isJoined, setIsJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number>(0);
  
  const agoraEngineRef = useRef<IRtcEngine | null>(null);
  const lastLikeTimeRef = useRef<number>(0);
  const isLeavingRef = useRef(false);

  const [streamInfo, setStreamInfo] = useState<{ hostId: string; hostAvatar?: string; hostName: string; viewers: string, duration: number } | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    let pollTimer: ReturnType<typeof setInterval>;

    if (isJoined && streamInfo) {
      timer = setInterval(() => {
        setStreamInfo(prev => prev ? { ...prev, duration: prev.duration + 1 } : prev);
      }, 1000);

      pollTimer = setInterval(async () => {
        try {
          const fetchedComments = await liveStreamApi.getComments(id as string);
          if (fetchedComments && fetchedComments.length > 0) {
            const mappedComments: ChatMessage[] = fetchedComments.map(c => {
              const date = new Date(c.createdAt || Date.now());
              return {
                id: c.id,
                userAvatar: c.user.avatarUrl || undefined,
                userName: c.user.displayName || c.user.username,
                isVerified: c.user.isVerified,
                message: c.text,
                createdAt: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              };
            });
            
            setMessages(prev => {
              const filteredPrev = prev.filter(p => {
                // Keep real messages
                if (!p.id.includes('.')) return true;
                // Remove optimistic message if backend already returned it
                const isFetched = mappedComments.some(m => m.message === p.message && m.userName === p.userName);
                return !isFetched;
              });

              const prevIds = new Set(filteredPrev.map(p => p.id));
              const newItems = mappedComments.filter(m => !prevIds.has(m.id));
              if (newItems.length > 0) {
                return [...filteredPrev, ...newItems].slice(-50); // Keep last 50
              }
              return filteredPrev;
            });
          }
        } catch (e) {}
      }, 3000);
    }
    return () => {
      clearInterval(timer);
      clearInterval(pollTimer);
    };
  }, [isJoined, streamInfo !== null]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    isLeavingRef.current = false;

    const releaseAgoraEngine = () => {
      try {
        agoraEngineRef.current?.leaveChannel();
        agoraEngineRef.current?.release();
      } catch (error) {
        console.log('Live viewer Agora cleanup failed:', error);
      } finally {
        agoraEngineRef.current = null;
        setIsJoined(false);
        setRemoteUid(0);
      }
    };

    const joinStream = async () => {
      try {
        releaseAgoraEngine();
        const streamDetails = await liveStreamApi.joinStream(id as string);
        const tokenData = await liveStreamApi.getStreamToken(id as string);


        let initialDuration = 0;
        if (streamDetails.startedAt) {
          initialDuration = Math.floor((Date.now() - new Date(streamDetails.startedAt).getTime()) / 1000);
          if (initialDuration < 0) initialDuration = 0;
        }

        setStreamInfo({
          hostId: streamDetails.hostId.id,
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
          onJoinChannelSuccess: () => {
            setIsJoined(true);
            if (tokenData.hostUid) {
              setRemoteUid(tokenData.hostUid);
            }
          },
          onUserJoined: (_conn, uid) => setRemoteUid(uid),
          onUserOffline: (_conn, uid) => {
            if (isLeavingRef.current) return;
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

    // Setup socket connection
    const token = useAppStore.getState().token;
    let socket: any = null;
    
    const handleNewReaction = (data: any) => {
      if (data.type === 'HEART') {
        // Spawn 3 to 5 hearts for other users
        const numHearts = Math.floor(Math.random() * 3) + 3; // 3, 4, or 5
        for (let i = 0; i < numHearts; i++) {
          setTimeout(() => {
            floatingReactionsRef.current?.addReaction(data.avatarUrl);
          }, i * 150); // slight delay between each spawn
        }
      }
    };

    const handleNewGift = (data: any) => {
      setMessages((prev) => [
        ...prev.filter(message => !(
          message.type === 'gift' &&
          message.id.startsWith('gift-local-') &&
          message.userId === data.sender?.id &&
          message.giftName === (data.gift?.name || 'gift')
        )),
        {
          id: `gift-${Date.now()}-${Math.random()}`,
          userId: data.sender?.id,
          userName: data.sender?.displayName || data.sender?.username || 'Someone',
          userAvatar: data.sender?.avatarUrl,
          isVerified: data.sender?.isVerified,
          message: '',
          type: 'gift',
          giftName: data.gift?.name || 'gift',
          giftIconUrl: data.gift?.iconUrl,
          giftIcon: data.gift?.icon,
        },
      ]);
    };

    const handleLiveError = (error: any) => {
      toast.error(error?.message || 'Live action failed.');
    };

    const handleViewerCountUpdate = (data: any) => {
      if (String(data?.streamId) !== String(id)) return;
      setStreamInfo(prev => prev ? { ...prev, viewers: String(Math.max(0, data.viewerCount || 0)) } : prev);
    };

    let handleConnect: () => void = () => {};

    if (token) {
      socket = ensureChatSocket(token);
      if (socket) {
        socket.emit('live:join', { streamId: String(id) });
        
        handleConnect = () => {
          socket.emit('live:join', { streamId: String(id) });
        };
        socket.on('connect', handleConnect);
        
        socket.on('live:new_reaction', handleNewReaction);
        socket.on('live:new_gift', handleNewGift);
        socket.on('live:viewer_count_update', handleViewerCountUpdate);
        socket.on('live:error', handleLiveError);
      }
    }

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
      isLeavingRef.current = true;
      clearInterval(pollTimer);
      if (socket) {
        socket.emit('live:leave', { streamId: String(id) });
        socket.off('live:new_reaction', handleNewReaction);
        socket.off('live:new_gift', handleNewGift);
        socket.off('live:viewer_count_update', handleViewerCountUpdate);
        socket.off('live:error', handleLiveError);
        socket.off('connect', handleConnect);
      }
      releaseAgoraEngine();
      liveStreamApi.leaveStream(id as string).catch(() => { });
    };
  }, [id]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [giftModalVisible, setGiftModalVisible] = useState(false);

  const floatingReactionsRef = useRef<FloatingReactionsHandle>(null);

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    
    const messageText = inputText.trim();
    setInputText('');
    
    try {
      await liveStreamApi.postComment(id as string, messageText);
    } catch (e) {
      console.error('Failed to post comment', e);
      // Optional: restore input text on failure
      // setInputText(messageText);
    }
  };

  const handleHeartPress = () => {
    const avatarUrl = user?.profile?.photoUrl || undefined;
    floatingReactionsRef.current?.addReaction(avatarUrl);
    
    // Throttle backend calls to max 1 per second
    const now = Date.now();
    if (now - lastLikeTimeRef.current > 1000) {
      lastLikeTimeRef.current = now;
      const token = useAppStore.getState().token;
      if (token) {
        const socket = ensureChatSocket(token);
        if (socket) {
          socket.emit('live:like', { streamId: String(id) });
        }
      }
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = Linking.createURL(`screens/live/${id}`);
      await Share.share({
        message: `Join this live stream on Play All! \n\n${shareUrl}`,
      });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  const handleSelectGift = (gift: any) => {
    const success = useAppStore.getState().deductCoins(gift.price);

    if (success) {
      setGiftModalVisible(false);
      const localGiftMessageId = `gift-local-${Date.now()}-${Math.random()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: localGiftMessageId,
          userId: user?.id || user?._id,
          userName: user?.profile?.displayName || user?.profile?.username || user?.email?.split('@')[0] || 'You',
          userAvatar: user?.profile?.photoUrl || undefined,
          message: '',
          type: 'gift' as const,
          giftName: gift.name,
          giftIcon: gift.icon,
        },
      ].slice(-50));
      
      const token = useAppStore.getState().token;
      if (token) {
        const socket = ensureChatSocket(token);
        if (socket) {
          socket.emit(
            'live:gift',
            { streamId: String(id), giftId: String(gift.id), quantity: 1 },
            (response?: { success: boolean; message?: string }) => {
              if (response?.success) return;

              setMessages(prev => prev.filter(message => message.id !== localGiftMessageId));
              useAppStore.getState().addCoins(gift.price);
              toast.error(response?.message || 'Gift could not be sent.');
            },
          );
        } else {
          setMessages(prev => prev.filter(message => message.id !== localGiftMessageId));
          useAppStore.getState().addCoins(gift.price);
          toast.error('Live socket is not connected.');
        }
      } else {
        setMessages(prev => prev.filter(message => message.id !== localGiftMessageId));
        useAppStore.getState().addCoins(gift.price);
        toast.error('Please login again to send gifts.');
      }
      
      // We don't add the message locally anymore because the server will broadcast live:new_gift
      // and our handleNewGift listener will add it to the chat for everyone (including us).
      floatingReactionsRef.current?.addReaction();
    } else {
      setGiftModalVisible(false);
      toast.error('Not enough coins!');
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
          hostId={streamInfo.hostId}
          hostAvatar={avatarSource(streamInfo.hostAvatar)}
          hostName={streamInfo.hostName}
          viewers={`${streamInfo.viewers} (${formatDuration(streamInfo.duration)})`}
        />
      )}

      <LiveChatStream messages={messages} currentUserId={user?.id || user?._id} />

      <FloatingReactions ref={floatingReactionsRef} />

      <LiveBottomActions
        inputText={inputText}
        onChangeText={setInputText}
        onSend={sendMessage}
        onHeartPress={handleHeartPress}
        onGiftPress={() => setGiftModalVisible(true)}
        onSharePress={handleShare}
      />

      <LiveGiftModal
        visible={giftModalVisible}
        onClose={() => setGiftModalVisible(false)}
        onSelectGift={handleSelectGift}
      />
    </KeyboardAvoidingView>
  );
}
