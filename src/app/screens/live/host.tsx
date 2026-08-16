import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { liveStreamApi } from '../../../api/live-streams/live-stream.api';
import { getMyProfileData } from '../../../api/profile/profile.api';
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  IRtcEngine,
  RtcSurfaceView,
} from 'react-native-agora';
import { useAppStore } from '../../../store';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator, PermissionsAndroid } from 'react-native';
import { LiveChatStream, ChatMessage, MOCK_CHAT } from '../../../components/live/LiveChatStream';
import { FloatingReactions, FloatingReactionsHandle } from '../../../components/live/FloatingReactions';
import { LiveBottomActions } from '../../../components/live/LiveBottomActions';
import { Image } from 'expo-image';
import { avatarSource } from '../../../utils/avatar';

export default function LiveHostScreen() {
  const { streamId } = useLocalSearchParams<{ streamId: string }>();
  const user = useAppStore((state) => state.user);
  const profile = user?.profile;
  const displayName = profile?.displayName || profile?.username || user?.email?.split('@')[0] || 'Host';
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const agoraEngineRef = useRef<IRtcEngine | null>(null);

  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenInfo, setTokenInfo] = useState<any>(null);

  // Live UI states
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_CHAT);
  const [inputText, setInputText] = useState('');
  const [duration, setDuration] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);
  const [hostName, setHostName] = useState(displayName);
  const [hostAvatar, setHostAvatar] = useState<string | undefined>(profile?.photoUrl);
  const floatingReactionsRef = useRef<FloatingReactionsHandle>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    let pollTimer: ReturnType<typeof setInterval>;

    if (isJoined) {
      timer = setInterval(() => setDuration((prev) => prev + 1), 1000);

      // Poll for viewer count
      pollTimer = setInterval(async () => {
        try {
          const stream = await liveStreamApi.getStreamById(streamId as string);
          setViewerCount(stream.viewerCount);
        } catch (e) {}
      }, 5000);
    }

    return () => {
      clearInterval(timer);
      clearInterval(pollTimer);
    };
  }, [isJoined, streamId]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      userAvatar: hostAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      userName: hostName,
      message: inputText.trim(),
    };
    setMessages([...messages, newMessage]);
    setInputText('');
  };

  const handleHeartPress = () => {
    floatingReactionsRef.current?.addReaction();
  };

  const confirmEndLiveStream = () => {
    Alert.alert(
      'End Live Stream',
      'Are you sure you want to end your live stream?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Stream', style: 'destructive', onPress: endLiveStream },
      ]
    );
  };

  useEffect(() => {
    if (!streamId) {
      Alert.alert('Error', 'Missing stream ID');
      if (router.canGoBack()) router.back();
      else router.replace('/');
      return;
    }
    
    initLiveStream();

    return () => {
      endLiveStream();
    };
  }, [streamId]);

  const initLiveStream = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
        if (
          granted[PermissionsAndroid.PERMISSIONS.CAMERA] !== PermissionsAndroid.RESULTS.GRANTED ||
          granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] !== PermissionsAndroid.RESULTS.GRANTED
        ) {
          throw new Error('Camera and microphone permissions are required to broadcast.');
        }
      }

      // 1. Tell backend to start stream
      await liveStreamApi.startStream(streamId as string);

      // Fetch latest profile info for the local host UI
      try {
        const myProfile = await getMyProfileData();
        const p = myProfile.user.profile;
        setHostName(p?.displayName || p?.username || displayName);
        setHostAvatar(p?.photoUrl || profile?.photoUrl);
      } catch (e) {
        // Fallback to stream details if profile fetch fails
        const streamDetails = await liveStreamApi.getStreamById(streamId as string);
        if (streamDetails.hostId) {
          setHostName(streamDetails.hostId.displayName || streamDetails.hostId.username || displayName);
          setHostAvatar(streamDetails.hostId.avatarUrl || profile?.photoUrl);
        }
      }

      // 2. Fetch token
      const tokenData = await liveStreamApi.getStreamToken(streamId as string);
      setTokenInfo(tokenData);

      // 3. Initialize Agora
      const appId = process.env.EXPO_PUBLIC_AGORA_APP_ID;
      if (!appId) {
        throw new Error('Missing Agora App ID in environment');
      }

      const engine = createAgoraRtcEngine();
      agoraEngineRef.current = engine;
      
      engine.initialize({
        appId,
        channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
      });

      // Enable video module
      engine.enableVideo();
      
      engine.registerEventHandler({
        onJoinChannelSuccess: (_connection, elapsed) => {
          console.log('Agora JoinChannelSuccess', elapsed);
          setIsJoined(true);
        },
        onUserJoined: (_connection, uid) => {
          // Audience joining doesn't trigger this in Agora, relying on backend polling
        },
        onUserOffline: (_connection, uid) => {
          // Audience leaving doesn't trigger this in Agora
        },
        onError: (err, msg) => {
          console.error('Agora Error:', err, msg);
          setError(`Agora Error: ${msg}`);
        },
      });

      engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
      engine.startPreview();

      // Join channel
      engine.joinChannel(
        tokenData.token,
        tokenData.channelName,
        tokenData.uid,
        {
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
          publishMicrophoneTrack: true,
          publishCameraTrack: true,
          autoSubscribeAudio: true,
          autoSubscribeVideo: true,
        }
      );

    } catch (e: any) {
      console.error('Failed to init live stream', e);
      setError(e?.message || 'Failed to initialize live stream');
      Alert.alert('Error', e?.message || 'Failed to initialize live stream');
    }
  };

  const endLiveStream = async () => {
    try {
      if (agoraEngineRef.current) {
        agoraEngineRef.current.leaveChannel();
        agoraEngineRef.current.release();
        agoraEngineRef.current = null;
      }
      if (streamId) {
        await liveStreamApi.endStream(streamId as string);
      }
    } catch (e) {
      console.error('Error ending stream', e);
    }
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Video Background Layer */}
      <View style={styles.videoContainer}>
        {isJoined && tokenInfo ? (
          <RtcSurfaceView
            canvas={{ uid: 0 }}
            style={{ flex: 1 }}
          />
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF3B30" />
            <Text style={styles.loadingText}>
              {error ? error : 'Starting Live Stream...'}
            </Text>
          </View>
        )}
      </View>

      {/* Dim overlay for better text readability */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.2)' }]} pointerEvents="none" />

      {/* UI Overlay Layer */}
      <View style={styles.uiOverlay}>
        <View className="flex-row justify-between items-center px-4" style={{ marginTop: insets.top + 10, zIndex: 20 }}>
          <View className="flex-row items-center bg-black/40 rounded-full pr-4 py-1">
            <View className="relative ml-1">
              <Image 
                source={avatarSource(hostAvatar)} 
                style={{ width: 36, height: 36, borderRadius: 18 }} 
              />
              <View className="absolute -bottom-1 self-center bg-[#FF3B30] px-1 rounded-sm">
                <Text className="text-[8px] text-white font-bold">LIVE</Text>
              </View>
            </View>
            <View className="ml-3">
              <View className="flex-row items-center">
                <Text className="text-white text-sm font-bold mr-1">{hostName}</Text>
                <Ionicons name="checkmark-circle" size={14} color="#FFF" />
              </View>
              <View className="flex-row items-center mt-0.5">
                <Ionicons name="eye-outline" size={12} color="#CCC" />
                <Text className="text-[#CCC] text-xs ml-1">{viewerCount} Watching</Text>
              </View>
            </View>
          </View>

          <View className="flex-row items-center gap-3">
            <View className="bg-[#FF3B30] px-2 py-1 rounded-sm">
              <Text className="text-white font-bold text-xs">LIVE {formatDuration(duration)}</Text>
            </View>
            
            <TouchableOpacity onPress={confirmEndLiveStream} className="bg-black/40 w-8 h-8 rounded-full items-center justify-center">
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Comments Area */}
        <View style={styles.commentsContainer}>
          <LiveChatStream messages={messages} />
        </View>

        {/* Reactions */}
        <FloatingReactions ref={floatingReactionsRef} />

        {/* Bottom Input Actions */}
        <LiveBottomActions
          inputText={inputText}
          onChangeText={setInputText}
          onSend={handleSend}
          onHeartPress={handleHeartPress}
          onGiftPress={() => {}} // Hosts don't buy gifts
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  videoContainer: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#000',
    zIndex: 0,
  },
  uiOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 10,
    justifyContent: 'space-between',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fff', fontSize: 16, marginTop: 10 },
  commentsContainer: {
    height: 250,
    marginHorizontal: 15,
    marginBottom: 10,
    marginTop: 'auto',
  },
});
