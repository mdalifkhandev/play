import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomButton } from '../../components/ui/CustomButton';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { liveStreamApi } from '../../api/live-streams/live-stream.api';

export default function CreateScreen() {
  const { soundUrl, title, soundDuration, musicId, musicArtist, musicCoverUrl } = useLocalSearchParams<{
    soundUrl?: string;
    title?: string;
    soundDuration?: string;
    musicId?: string;
    musicArtist?: string;
    musicCoverUrl?: string;
  }>();
  const [facing, setFacing] = useState<CameraType>('back');
  const [camPermission, requestCamPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);

  const [mainMode, setMainMode] = useState<'Photo' | 'Video' | 'Live'>('Video');
  const [recordingMode, setRecordingMode] = useState<'1m' | '30s' | '15s' | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isScreenFocused, setIsScreenFocused] = useState(false);
  const [isStoppingRecording, setIsStoppingRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const router = useRouter();

  const selectedSoundParams = soundUrl || title ? {
    soundUrl: soundUrl || '',
    title: title || '',
    soundDuration: soundDuration || '',
    musicId: musicId || '',
    musicArtist: musicArtist || '',
    musicCoverUrl: musicCoverUrl || '',
  } : {};
  const cameraMode = mainMode === 'Photo' ? 'picture' : 'video';

  const isCameraReadyRef = useRef(false);
  const isRecordingRef = useRef(false);
  const isStoppingRecordingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  const startTimer = () => {
    stopTimer();
    setRecordingTime(0);
    timerIntervalRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setRecordingTime(0);
  };

  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);

      return () => {
        setIsScreenFocused(false);
        setIsCameraReady(false);
        isCameraReadyRef.current = false;
        isRecordingRef.current = false;
        isStoppingRecordingRef.current = false;
        setIsRecording(false);
        setIsStoppingRecording(false);
        stopTimer();
      };
    }, [])
  );

  const handleCameraReady = () => {
    isCameraReadyRef.current = true;
    setIsCameraReady(true);
  };

  const flipCamera = () => {
    if (isRecording) return;

    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleRecordAction = async () => {
    if (!cameraRef.current || isStoppingRecordingRef.current) return;

    if (!isCameraReadyRef.current) {
      console.warn('Camera pipeline is not ready yet');
      return;
    }

    if (mainMode === 'Photo') {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: false,
        });
        if (photo?.uri && isMountedRef.current) {
          console.log('Photo captured, opening edit screen:', photo.uri);
          router.push({
            pathname: '/screens/create/edit',
            params: { uri: photo.uri, mediaType: 'photo', ...selectedSoundParams },
          });
        } else {
          console.warn('Photo capture returned no uri:', photo);
          Alert.alert('Photo failed', 'Photo data was missing. Please try again.');
        }
      } catch (error) {
        Alert.alert('Photo failed', 'Could not capture photo. Please try again.');
        console.error('Failed to take picture:', error);
      }
    } else if (mainMode === 'Live') {
      try {
        const result = await liveStreamApi.createStream({
          title: `Live Stream ${new Date().toLocaleTimeString()}`,
          category: 'General',
        });
        
        // Ensure router push matches the actual file path we are going to create
        router.push({
          pathname: '/screens/live/host',
          params: { streamId: result.id },
        });
      } catch (error) {
        Alert.alert('Failed to start Live', 'Could not create a live stream. Please try again.');
        console.error('Failed to create stream:', error);
      }
    } else if (isRecordingRef.current) {
      try {
        isStoppingRecordingRef.current = true;
        setIsStoppingRecording(true);
        cameraRef.current.stopRecording();
      } catch (error) {
        console.error('Failed to stop recording:', error);
      }
    } else {
      try {
        isRecordingRef.current = true;
        setIsRecording(true);
        startTimer();

        let maxDuration = 60;
        if (mainMode === 'Video') {
          maxDuration = recordingMode === '15s' ? 15 : recordingMode === '30s' ? 30 : 60;
        }

        const video = await cameraRef.current.recordAsync({
          maxDuration,
        });

        if (video?.uri && isMountedRef.current) {
          router.push({
            pathname: '/screens/create/edit',
            params: { uri: video.uri, mediaType: 'video', ...selectedSoundParams },
          });
        } else {
          Alert.alert('Recording Failed', `Video data missing. video=${JSON.stringify(video)}`);
        }
      } catch (error: any) {
        Alert.alert('Error Recording', error?.message || 'Failed to record video');
        console.error('Failed to record video/live stream:', error);
      } finally {
        isRecordingRef.current = false;
        isStoppingRecordingRef.current = false;
        setIsRecording(false);
        setIsStoppingRecording(false);
        stopTimer();
      }
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        quality: 0.7,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        if (asset.type === 'video') {
          const info = await FileSystem.getInfoAsync(asset.uri);
          // 500 MB limit
          if (info.exists && typeof info.size === 'number' && info.size > 500 * 1024 * 1024) {
            Alert.alert('Video too large', 'Please select a video smaller than 500MB.');
            return;
          }
        }

        if (isMountedRef.current) {
          router.push({
            pathname: '/screens/create/edit',
            params: {
              uri: asset.uri,
              mediaType: asset.type === 'video' ? 'video' : 'photo',
              ...selectedSoundParams,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error selecting media from gallery:', error);
    }
  };

  const requestAllPermissions = async () => {
    if (!camPermission?.granted && camPermission?.canAskAgain) await requestCamPermission();
    if (!micPermission?.granted && micPermission?.canAskAgain) await requestMicPermission();
  };

  useEffect(() => {
    if (camPermission && micPermission && (!camPermission.granted || !micPermission.granted)) {
      requestAllPermissions();
    }
  }, [camPermission, micPermission]);

  if (!camPermission || !micPermission) {
    return <View className="flex-1 bg-black" />;
  }

  if (!camPermission.granted || !micPermission.granted) {
    return (
      <View className="flex-1 bg-black items-center justify-center p-6">
        <Ionicons name="camera-outline" size={64} color="#888" className="mb-4" />
        <Text className="text-white text-center font-inter-semibold text-lg mb-6">
          We need Camera & Microphone access to create content
        </Text>
        <CustomButton title="Grant Permissions" variant="primary" onPress={requestAllPermissions} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <View className="flex-1 overflow-hidden rounded-b-xl">
        {isScreenFocused && (
          <CameraView
            // @ts-ignore - React Native component accepts ref, but @types/react is mismatched
            ref={cameraRef}
            style={{ flex: 1, width: '100%', height: '100%' }}
            facing={facing}
            mode={cameraMode}
            mute={false}
            videoStabilizationMode="off"
            onCameraReady={handleCameraReady}
            onMountError={(event) => console.error('Camera mount error:', event.message)}
          />
        )}

        {/* Top Header Controls */}
        <View
          className="absolute top-0 left-0 right-0 items-center z-10 flex-row justify-center"
          style={{ paddingTop: insets.top + 10 }}
        >
          {isRecording && (mainMode === 'Video' || mainMode === 'Live') && (
            <View 
              className="absolute left-4 bg-black/50 px-3 py-1.5 rounded-full flex-row items-center"
              style={{ top: insets.top + 20 }}
            >
              <View className="w-2 h-2 rounded-full bg-red-500 mr-2" />
              <Text className="text-white font-inter-semibold text-sm">
                {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}
              </Text>
            </View>
          )}

          {!isRecording && (
            <Pressable
              onPress={() => router.push({ pathname: '/screens/create/sound', params: { returnTo: '/(tab)/create' } } as any)}
              className="bg-black/70 px-5 py-2 rounded-full flex-row items-center"
            >
              <Ionicons name="musical-note" size={16} color="white" className="mr-2" />
              <Text className="text-white font-inter-semibold text-sm">
                {title || 'Add sound'}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Floating Capture Overlay */}
        <View className="absolute bottom-6 left-0 right-0 z-10">
          <View className="flex-row justify-center items-center mb-6 gap-6 h-8">
            {mainMode === 'Photo' && (
              <View className="bg-white px-4 rounded-full">
                <Text className="text-black font-inter-bold text-[15px]">Photo</Text>
              </View>
            )}

            {mainMode === 'Video' && ['1m', '30s', '15s'].map((mode) => (
              <Pressable
                key={mode}
                onPress={() => setRecordingMode((prev) => (prev === mode ? null : (mode as any)))}
              >
                {recordingMode === mode ? (
                  <View className="bg-white px-4 rounded-full">
                    <Text className="text-black font-inter-bold text-[15px]">{mode}</Text>
                  </View>
                ) : (
                  <Text className="text-white/80 font-inter-medium text-[15px]">{mode}</Text>
                )}
              </Pressable>
            ))}

            {mainMode === 'Live' && (
              <View className="bg-white px-4 rounded-full">
                <Text className="text-black font-inter-bold text-[15px]">Live</Text>
              </View>
            )}
          </View>

          <View className="flex-row items-center justify-center relative">
            <Pressable
              onPress={handleRecordAction}
              disabled={!isCameraReady || isStoppingRecording}
              className={`w-[72px] h-[72px] rounded-full border-[3px] items-center justify-center ${isRecording ? 'border-red-500' : 'border-white'
                } ${!isCameraReady || isStoppingRecording ? 'opacity-50' : ''}`}
            >
              <View
                className={`${isRecording ? 'w-8 h-8 rounded-lg bg-red-500' : 'w-[60px] h-[60px] bg-red-500 rounded-full'
                }`}
              />
            </Pressable>

            <Pressable
              onPress={flipCamera}
              disabled={isRecording}
              className={`absolute right-8 w-12 h-12 rounded-full bg-black/45 items-center justify-center ${isRecording ? 'opacity-40' : ''}`}
            >
              <Ionicons name="camera-reverse-outline" size={26} color="#FFF" />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Bottom Mode Navigation Bar */}
      <View className="h-24 bg-black flex-row items-center justify-between px-6 pb-6">
        <Pressable
          className="flex-row items-center bg-[#333] rounded-lg px-2 py-1.5 h-10 mt-5"
          onPress={pickFromGallery}
        >
          <View className="w-6 h-6 bg-white rounded flex-row overflow-hidden border border-gray-400 mr-2 items-center justify-center">
            <Ionicons name="image" size={14} color="#666" />
          </View>
          <Text className="text-white font-inter-semibold text-xs">UPLOAD</Text>
        </Pressable>

        <View className="flex-row items-center gap-6 absolute left-32 right-0 justify-center">
          {['Photo', 'Video', 'Live'].map((m) => (
            <Pressable
              key={m}
              onPress={() => {
                if (isRecording) return;
                setMainMode(m as any);
              }}
            >
              <Text
                className={
                  mainMode === m
                    ? 'text-white font-inter-bold text-[15px]'
                    : 'text-gray-400 font-inter-semibold text-[15px]'
                }
              >
                {m}
              </Text>
            </Pressable>
          ))}
        </View>

      </View>
    </View>
  );
}
