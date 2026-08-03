import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomButton } from '../../components/ui/CustomButton';
import * as ImagePicker from 'expo-image-picker';

export default function CreateScreen() {
  const { soundUrl, title } = useLocalSearchParams<{ soundUrl?: string; title?: string }>();
  const [facing, setFacing] = useState<CameraType>('back');
  const [camPermission, requestCamPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  
  const [recordingMode, setRecordingMode] = useState<'10m' | '60s' | '15s' | 'Photo'>('Photo');
  const [isRecording, setIsRecording] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const router = useRouter();

  const handleRecordAction = async () => {
    if (!cameraRef.current) return;
    
    if (recordingMode === 'Photo') {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        if (photo?.uri) {
          router.push({ pathname: '/screens/create/edit', params: { uri: photo.uri } });
        }
      } catch (error) {
        console.error('Failed to take picture:', error);
      }
    } else {
      if (isRecording) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        cameraRef.current.stopRecording();
        setIsRecording(false);
      } else {
        try {
          setIsRecording(true);
          const maxDuration = recordingMode === '15s' ? 15 : recordingMode === '60s' ? 60 : 600;

          // Pass maxDuration directly to recordAsync as suggested by user
          const video = await cameraRef.current.recordAsync({ maxDuration });
          setIsRecording(false);
          
          if (video?.uri) {
            router.push({ pathname: '/screens/create/edit', params: { uri: video.uri } });
          }
        } catch (error) {
          console.error('Failed to record video:', error);
          setIsRecording(false);
        }
      }
    }
  };

  const pickFromGallery = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      console.log('Picked from gallery:', result.assets[0].uri);
      router.push({ pathname: '/screens/create/edit', params: { uri: result.assets[0].uri } });
    }
  };

  const requestAllPermissions = async () => {
    if (!camPermission?.granted) await requestCamPermission();
    if (!micPermission?.granted) await requestMicPermission();
  };

  if (!camPermission || !micPermission) {
    // Permissions are still loading.
    return <View className="flex-1 bg-black" />;
  }

  if (!camPermission.granted || !micPermission.granted) {
    // Permissions are not granted yet.
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

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  return (
    <View className="flex-1 bg-black">
      <View className="flex-1 overflow-hidden rounded-b-xl">
        <CameraView 
          ref={cameraRef} 
          style={StyleSheet.absoluteFill} 
          facing={facing} 
          mode={recordingMode === 'Photo' ? 'picture' : 'video'}
        />

        {/* Top Centered Pill */}
        <View
          className="absolute top-0 left-0 right-0 items-center z-10"
          style={{ paddingTop: insets.top + 10 }}
        >
          <Pressable 
            onPress={() => router.push({ pathname: '/screens/create/sound', params: { returnTo: '/(tab)/create' } } as any)}
            className="bg-black/70 px-5 py-2 rounded-full flex-row items-center"
          >
            <Ionicons name="musical-note" size={16} color="white" className="mr-2" />
            <Text className="text-white font-inter-semibold text-sm">
              {title || 'Add sound'}
            </Text>
          </Pressable>
        </View>

        {/* Floating Controls Over Camera */}
        <View className="absolute bottom-6 left-0 right-0 z-10">

          {/* Mode Selector Row */}
          <View className="flex-row justify-center items-center mb-6 gap-6">
            {['10m', '60s', '15s', 'Photo'].map((mode) => (
              <Pressable key={mode} onPress={() => setRecordingMode(mode as any)}>
                {recordingMode === mode ? (
                  <View className="bg-white px-4 py-1.5 rounded-full">
                    <Text className="text-black font-inter-bold text-[15px]">{mode}</Text>
                  </View>
                ) : (
                  <Text className="text-white/80 font-inter-medium text-[15px]">{mode}</Text>
                )}
              </Pressable>
            ))}
          </View>

          {/* Record Button & Effects */}
          <View className="flex-row items-center justify-center relative">
            <Pressable
              onPress={handleRecordAction}
              className={`w-[72px] h-[72px] rounded-full border-[3px] items-center justify-center ${isRecording ? 'border-red-500' : 'border-white'}`}
            >
              <View className={`${isRecording ? 'w-8 h-8 rounded-lg bg-red-500' : 'w-[60px] h-[60px] bg-white rounded-full'}`} />
            </Pressable>
          </View>

        </View>
      </View>

      {/* Solid Black Bottom Bar */}
      <View className="h-24 bg-black flex-row items-center justify-between px-6 pb-6">
        <Pressable
          className="flex-row items-center bg-[#333] rounded-lg px-2 py-1.5 h-10 mt-5 "
          onPress={pickFromGallery}
        >
          <View className="w-6 h-6 bg-white rounded flex-row overflow-hidden border border-gray-400 mr-2 items-center justify-center">
            <Ionicons name="image" size={14} color="#666" />
          </View>
          <Text className="text-white font-inter-semibold text-xs">UPLOAD</Text>
        </Pressable>

        <View className="flex-row items-center gap-6 absolute left-32 right-0 justify-center pointer-events-none">
          <Text className="text-white font-inter-semibold text-[15px]">Post</Text>
          <Text className="text-white font-inter-bold text-[15px]">Video</Text>
          <Text className="text-gray-400 font-inter-semibold text-[15px]">Live</Text>
        </View>

        {/* Placeholder for symmetry */}
        <View className="w-[84px]" />
      </View>
    </View>
  );
}
