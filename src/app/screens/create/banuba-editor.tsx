import React, { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import VideoEditorPlugin, {
  AudioBrowser,
  AudioBrowserSource,
  DraftsConfig,
  DraftsOption,
  EditorConfig,
  ExportData,
  ExportedVideo,
  FeaturesConfigBuilder,
  VideoDurationConfig,
  VideoResolution,
} from 'video-editor-react-native';

const BANUBA_TOKEN = process.env.EXPO_PUBLIC_BANUBA_TOKEN;

const getExportedVideoUri = (result: any) => {
  const sources = result?.exportedVideoSources;

  if (Array.isArray(sources)) return sources[0];
  if (typeof sources === 'string') {
    try {
      const parsed = JSON.parse(sources);
      return Array.isArray(parsed) ? parsed[0] : sources;
    } catch (e) {
      return sources;
    }
  }

  return result?.exportedVideo || result?.videoUri || result?.uri;
};

export default function BanubaEditorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { uri } = useLocalSearchParams<{ uri?: string }>();
  const [isOpening, setIsOpening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const openBanubaEditor = async () => {
    if (!BANUBA_TOKEN) {
      setErrorMessage('Missing EXPO_PUBLIC_BANUBA_TOKEN in .env');
      return;
    }

    setErrorMessage(null);
    setIsOpening(true);

    try {
      const featuresConfig = new FeaturesConfigBuilder()
        .setAudioBrowser(AudioBrowser.fromSource({ source: AudioBrowserSource.local }))
        .setDraftsConfig(DraftsConfig.fromOption({ option: DraftsOption.askToSave }))
        .setEditorConfig(new EditorConfig({
          supportsAudioEditing: true,
          supportsColorEffects: true,
          supportsStickersOnVideo: true,
          supportsVisualEffects: true,
          supportsVoiceOver: true,
        }))
        .setVideoDurationConfig(new VideoDurationConfig({
          maxTotalVideoDuration: 120,
          videoDurations: [60, 30, 15],
        }))
        .setReleaseOnExport(true)
        .build();

      const exportData = new ExportData({
        exportedVideos: [
          new ExportedVideo({
            fileName: `play_banuba_${Date.now()}`,
            videoResolution: VideoResolution.hd720p,
          }),
        ],
      });

      const editor = new VideoEditorPlugin();
      const result = uri
        ? await editor.openFromEditor(BANUBA_TOKEN, featuresConfig, [uri], exportData)
        : await editor.openFromCamera(BANUBA_TOKEN, featuresConfig, exportData);

      const exportedUri = getExportedVideoUri(result);
      if (!exportedUri) {
        setErrorMessage('Banuba export finished, but no exported video URI was returned.');
        return;
      }

      router.replace({
        pathname: '/screens/create/post-details',
        params: {
          uri: exportedUri,
          mediaType: 'video',
          isBanubaExport: 'true',
          overlayText: '',
          soundUrl: '',
          title: '',
          originalVolume: '100',
          addedVolume: '100',
          trimLeft: '',
          trimRight: '',
          videoTrimLeft: '0',
          videoTrimRight: '100',
          exposure: '50',
          contrast: '50',
          activeFilter: 'Normal',
          activeEffect: '',
        },
      } as any);
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to open Banuba editor');
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <View className="flex-1 bg-[#121212]" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-[#222]">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text className="text-white font-inter-semibold text-[17px]">Advanced Editor</Text>
        <View className="w-8" />
      </View>

      <View className="flex-1 items-center justify-center px-6">
        <View className="w-20 h-20 rounded-2xl bg-[#98FF2F] items-center justify-center mb-6">
          <Ionicons name="film-outline" size={42} color="black" />
        </View>

        <Text className="text-white font-inter-bold text-2xl text-center mb-3">
          Banuba Video Editor
        </Text>
        <Text className="text-[#AAA] font-inter-regular text-center text-base mb-8">
          Record or edit a video with professional tools, then export the final video for upload.
        </Text>

        {errorMessage && (
          <View className="w-full bg-red-500/10 border border-red-500/40 rounded-xl p-4 mb-5">
            <Text className="text-red-200 font-inter-medium text-center">{errorMessage}</Text>
          </View>
        )}

        <Pressable
          onPress={openBanubaEditor}
          disabled={isOpening || Platform.OS === 'web'}
          className={`w-full rounded-xl py-4 items-center justify-center flex-row ${isOpening || Platform.OS === 'web' ? 'bg-[#444]' : 'bg-[#98FF2F]'}`}
        >
          {isOpening ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color={Platform.OS === 'web' ? 'white' : 'black'} />
              <Text className={`${Platform.OS === 'web' ? 'text-white' : 'text-black'} font-inter-bold text-base ml-2`}>
                Open Banuba Editor
              </Text>
            </>
          )}
        </Pressable>

        {Platform.OS === 'web' && (
          <Text className="text-[#888] font-inter-regular text-center mt-4">
            Banuba is a native SDK and does not run on web or Expo Go.
          </Text>
        )}
      </View>
    </View>
  );
}
