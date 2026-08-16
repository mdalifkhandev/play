import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { liveStreamApi } from '../../../api/live-streams/live-stream.api';
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
  const floatingReactionsRef = useRef<FloatingReactionsHandle>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isJoined) {
      timer = setInterval(() => setDuration((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isJoined]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      userAvatar: profile?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      userName: displayName,
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
          setViewerCount((prev) => prev + 1);
        },
        onUserOffline: (_connection, uid) => {
          setViewerCount((prev) => Math.max(0, prev - 1));
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
        {/* Top Header */}
        <View style={[styles.header, { marginTop: insets.top + 10 }]}>
          <View style={styles.hostInfo}>
            <Image 
              source={avatarSource(profile?.avatar)} 
              style={styles.hostAvatar} 
            />
            <View>
              <Text style={styles.hostName}>{displayName}</Text>
              <View style={styles.viewersContainer}>
                <Ionicons name="eye-outline" size={12} color="#FFF" />
                <Text style={styles.viewersText}>{viewerCount} Watching</Text>
              </View>
            </View>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>LIVE {formatDuration(duration)}</Text>
            </View>
            
            <TouchableOpacity onPress={confirmEndLiveStream} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#fff" />
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 0,
  },
  uiOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    justifyContent: 'space-between',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fff', fontSize: 16, marginTop: 10 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingRight: 16,
    paddingVertical: 4,
    borderRadius: 24,
  },
  hostAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    marginLeft: 2,
  },
  hostName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  viewersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewersText: {
    color: '#FFF',
    fontSize: 12,
    marginLeft: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 10,
  },
  liveBadgeText: { 
    color: '#fff', 
    fontWeight: 'bold',
    fontSize: 12,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center'
  },
  commentsContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 60,
  }
});
