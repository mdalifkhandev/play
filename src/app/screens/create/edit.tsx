import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform, Keyboard, Animated, PanResponder, ActivityIndicator, Dimensions, Image as RNImage } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Device from 'expo-device';
import { MediaVideoPreview } from '../../../components/editor/MediaVideoPreview';
import { CustomSlider } from '../../../components/editor/CustomSlider';
import { TextOverlay } from '../../../components/editor/TextOverlay';
import { MusicCard } from '../../../components/editor/MusicCard';
import { EditorRightActions } from '../../../components/editor/EditorRightActions';
import { BottomPreviewBar } from '../../../components/editor/BottomPreviewBar';
import { FilterPanel } from '../../../components/editor/FilterPanel';
import { EffectPanel } from '../../../components/editor/EffectPanel';

import { useVideoEditorPlayer } from '../../../hooks/editor/useVideoEditorPlayer';
import { useTrimState } from '../../../hooks/editor/useTrimState';
import { usePreviewProgress } from '../../../hooks/editor/usePreviewProgress';
import { useMediaExport } from '../../../hooks/editor/useMediaExport';

const { width } = Dimensions.get('window');
const DEFAULT_AUDIO_DURATION_SEC = 30;
const LOCAL_SOUND_DURATIONS: Record<string, number> = {
  'Cinematic Sound Effect': 12,
};

const parseDurationSeconds = (duration?: string, title?: string) => {
  if (title && LOCAL_SOUND_DURATIONS[title]) {
    return LOCAL_SOUND_DURATIONS[title];
  }
  if (!duration) return DEFAULT_AUDIO_DURATION_SEC;
  if (/^\d+(\.\d+)?$/.test(duration)) {
    const seconds = Number(duration);
    return Number.isFinite(seconds) && seconds > 0 ? seconds : DEFAULT_AUDIO_DURATION_SEC;
  }
  const parts = duration.split(':').map(Number);
  if (parts.length === 2 && parts.every(Number.isFinite)) {
    const seconds = parts[0] * 60 + parts[1];
    return seconds > 0 ? seconds : DEFAULT_AUDIO_DURATION_SEC;
  }
  return DEFAULT_AUDIO_DURATION_SEC;
};

const firstParam = (value?: string | string[]) => Array.isArray(value) ? value[0] : value;

const normalizeMediaUri = (value?: string | string[]) => {
  const mediaUri = firstParam(value);
  if (!mediaUri) return undefined;

  try {
    return decodeURI(mediaUri);
  } catch {
    return mediaUri;
  }
};

const parseNumberParam = (value?: string | string[], fallback = 0) => {
  const parsed = Number(firstParam(value));
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default function EditMediaScreen() {
  const {
    uri, mediaType, soundUrl, title, soundDuration, musicId, musicArtist, musicCoverUrl,
    originalVolume, addedVolume, trimLeft, trimRight, videoTrimLeft, videoTrimRight,
    videoTrimStart, videoTrimEnd, videoDuration,
    overlayText: initialOverlayText,
    textOffsetX,
    textOffsetY,
    musicOffsetX,
    musicOffsetY,
    showMusicCard: initialShowMusicCard,
    exposure: initialExposure,
    contrast: initialContrast,
    activeFilter: initialActiveFilter,
    activeEffect: initialActiveEffect
  } = useLocalSearchParams<{
    uri: string; mediaType?: 'photo' | 'video'; soundUrl: string; title: string; soundDuration?: string;
    musicId?: string; musicArtist?: string; musicCoverUrl?: string;
    originalVolume?: string; addedVolume?: string; trimLeft?: string; trimRight?: string;
    videoTrimLeft?: string; videoTrimRight?: string;
    videoTrimStart?: string; videoTrimEnd?: string; videoDuration?: string;
    overlayText?: string;
    textOffsetX?: string;
    textOffsetY?: string;
    musicOffsetX?: string;
    musicOffsetY?: string;
    showMusicCard?: string;
    exposure?: string;
    contrast?: string;
    activeFilter?: string;
    activeEffect?: string;
  }>();

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const normalizedParamMediaType = firstParam(mediaType);
  const normalizedMediaType: 'photo' | 'video' | undefined =
    normalizedParamMediaType === 'video' || normalizedParamMediaType === 'photo' ? normalizedParamMediaType : undefined;
  const mockImage = normalizeMediaUri(uri) || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800';
  const isVideo = normalizedMediaType === 'video';
  const [selectedSoundUrl, setSelectedSoundUrl] = useState(firstParam(soundUrl) || '');
  const [selectedTitle, setSelectedTitle] = useState(firstParam(title) || '');
  const [selectedMusicId, setSelectedMusicId] = useState(firstParam(musicId) || '');
  const [selectedMusicArtist, setSelectedMusicArtist] = useState(firstParam(musicArtist) || '');
  const [selectedMusicCoverUrl, setSelectedMusicCoverUrl] = useState(firstParam(musicCoverUrl) || '');
  const [selectedSoundDuration, setSelectedSoundDuration] = useState(firstParam(soundDuration) || '');
  const [selectedOriginalVolume, setSelectedOriginalVolume] = useState(firstParam(originalVolume) || '');
  const [selectedAddedVolume, setSelectedAddedVolume] = useState(firstParam(addedVolume) || '');
  const audioDurationSec = parseDurationSeconds(selectedSoundDuration, selectedTitle);
  const [videoDurationSec, setVideoDurationSec] = useState(videoDuration ? Number(videoDuration) : 0);
  const isLowEndDevice = (Device.totalMemory ?? 0) < 3 * 1024 * 1024 * 1024;
  
  // Custom Hooks
  const { videoTrimStartSec, videoTrimEndSec, selectedVideoDurationSec } = useTrimState({
    videoTrimLeft, videoTrimRight, videoTrimStart, videoTrimEnd, videoDurationSec
  });

  const isPreviewPlayingRef = useRef(true);
  
  const { videoPlayer, sound, getTrimTime, seekSound, isMediaReady } = useVideoEditorPlayer({
    uri: mockImage,
    isVideo,
    soundUrl: selectedSoundUrl,
    trimLeft,
    isPreviewPlayingRef,
    audioDurationSec
  });

  const previewDurationSec = isVideo ? Math.max(1, selectedVideoDurationSec) : 10;

  const {
    isPreviewPlaying,
    setIsPreviewPlaying,
    togglePreviewPlayback,
    previewCurrentTime,
    previewProgressPercent
  } = usePreviewProgress({
    isVideo,
    videoPlayer,
    sound,
    previewDurationSec,
    videoDurationSec,
    videoTrimStartSec,
    videoTrimEndSec,
    trimLeft,
    trimRight,
    audioDurationSec,
    getTrimTime,
    seekSound,
    isPreviewPlayingRef,
    isMediaReady
  });

  // Local State
  const [showMusicCard, setShowMusicCard] = useState(initialShowMusicCard !== 'false');
  const [hasVideoFrame, setHasVideoFrame] = useState(false);
  const [photoFailedUri, setPhotoFailedUri] = useState<string | null>(null);
  const [isTextMode, setIsTextMode] = useState(false);
  const [overlayText, setOverlayText] = useState(firstParam(initialOverlayText) || '');
  const [exposure, setExposure] = useState(parseNumberParam(initialExposure, 50));
  const [contrast, setContrast] = useState(parseNumberParam(initialContrast, 50));
  const [activeFilter, setActiveFilter] = useState(firstParam(initialActiveFilter) || 'Normal');
  const [activeEffect, setActiveEffect] = useState<string | null>(firstParam(initialActiveEffect) || null);
  const [activePanel, setActivePanel] = useState<'options' | 'filters' | 'effects' | null>(null);
  
  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  const photoLoadFailed = !isVideo && photoFailedUri === mockImage;
  const showLoadingOverlay = isVideo && !isMediaReady;
  const showPreviewBar = isVideo || !!selectedSoundUrl;

  const formatSeconds = (seconds: number) => {
    const safeSeconds = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
    const mins = Math.floor(safeSeconds / 60);
    const remainingSecs = safeSeconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  // Video Duration Checker for missing initial duration
  useEffect(() => {
    if (!isVideo) return;
    const durationChecker = setInterval(() => {
      if (videoPlayer && Number.isFinite(videoPlayer.duration) && videoPlayer.duration > 0) {
        setVideoDurationSec(Math.floor(videoPlayer.duration));
        clearInterval(durationChecker);
      }
    }, 250);
    return () => clearInterval(durationChecker);
  }, [isVideo, videoPlayer]);

  // Apply volume changes to existing audio player
  useEffect(() => {
    if (sound && selectedAddedVolume !== undefined) {
      sound.volume = Number(selectedAddedVolume || 100) / 100;
    }
  }, [sound, selectedAddedVolume]);

  const removeMusic = () => {
    try { sound?.pause(); } catch {}
    try { sound?.release?.(); } catch {}
    try { if (videoPlayer) videoPlayer.muted = true; } catch {}
    setShowMusicCard(false);
    setSelectedSoundUrl('');
    setSelectedTitle('');
    setSelectedMusicId('');
    setSelectedMusicArtist('');
    setSelectedMusicCoverUrl('');
    setSelectedSoundDuration('');
    setSelectedOriginalVolume('0');
    setSelectedAddedVolume('0');
  };

  // Drag logic for Music Card
  const pan = useRef(new Animated.ValueXY({
    x: parseNumberParam(musicOffsetX, 0),
    y: parseNumberParam(musicOffsetY, 0),
  })).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        if (!isMountedRef.current) return;
        pan.flattenOffset();
      }
    })
  ).current;

  // Text overlay refs
  const inputRef = useRef<TextInput>(null);
  const latestOverlayText = useRef(overlayText);
  latestOverlayText.current = overlayText;
  const latestIsTextMode = useRef(isTextMode);
  latestIsTextMode.current = isTextMode;
  const textPan = useRef(new Animated.ValueXY({
    x: parseNumberParam(textOffsetX, 0),
    y: parseNumberParam(textOffsetY, 0),
  })).current;
  const textPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => latestOverlayText.current.trim().length > 0 && !latestIsTextMode.current,
      onStartShouldSetPanResponder: () => latestOverlayText.current.trim().length > 0 && !latestIsTextMode.current,
      onPanResponderGrant: () => {
        textPan.setOffset({ x: (textPan.x as any)._value, y: (textPan.y as any)._value });
        textPan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: textPan.x, dy: textPan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        if (!isMountedRef.current) return;
        textPan.flattenOffset();
      }
    })
  ).current;

  useEffect(() => {
    if (isTextMode && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isTextMode]);

  const handleDoneText = () => {
    Keyboard.dismiss();
    setIsTextMode(false);
  };

  const { isExporting, navigateToPostDetails } = useMediaExport({
    mockImage, mediaType: normalizedMediaType, soundUrl: selectedSoundUrl, overlayText, originalVolume: selectedOriginalVolume, addedVolume: selectedAddedVolume,
    trimLeft, trimRight, audioDurationSec, videoTrimStartSec, videoTrimEndSec,
    activeFilter, activeEffect, textPan, title: selectedTitle, soundDuration: selectedSoundDuration, musicId: selectedMusicId, musicArtist: selectedMusicArtist,
    musicCoverUrl: selectedMusicCoverUrl, videoTrimLeft, videoTrimRight, videoTrimStart, videoTrimEnd,
    videoDurationSec, exposure, contrast, videoPlayer, sound
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black">
      <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
        
        {!isTextMode && !activePanel && (
          <View className="flex-row items-center justify-between px-4 py-4">
            <Pressable onPress={() => router.back()} className="w-8 h-8 items-center justify-center">
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
            <Text className="text-white font-inter-semibold text-lg">Edit</Text>
            <View className="w-8" />
          </View>
        )}

        {isTextMode && (
          <View className="flex-row items-center justify-between px-4 py-4">
            <Pressable onPress={() => setIsTextMode(false)} className="w-8 h-8 items-center justify-center">
              <Text className="text-white font-inter-medium">Cancel</Text>
            </Pressable>
            <Pressable onPress={handleDoneText} className="bg-[#98FF2F] px-4 py-1.5 rounded-lg">
              <Text className="text-black font-inter-semibold">Done</Text>
            </Pressable>
          </View>
        )}

        <View className="flex-1 relative">
          <View className="flex-1 bg-black overflow-hidden relative items-center justify-center">
            {isVideo ? (
              <View className="w-full h-full absolute inset-0" style={{ transform: activeEffect === 'Zoom' ? [{ scale: 1.15 }] : [{ scale: 1 }] }}>
                <MediaVideoPreview player={videoPlayer} hasFirstFrame={hasVideoFrame} onFirstFrameRender={() => setHasVideoFrame(true)} />
              </View>
            ) : (
              <RNImage
                source={{ uri: mockImage }}
                resizeMode="cover"
                onError={(error) => {
                  setPhotoFailedUri(mockImage);
                  console.log('Photo preview load failed:', error);
                }}
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  transform: activeEffect === 'Zoom' ? [{ scale: 1.15 }] : [{ scale: 1 }],
                }}
              />
            )}

            {photoLoadFailed && !isVideo && (
              <View className="absolute inset-0 items-center justify-center bg-black px-6">
                <Ionicons name="image-outline" size={48} color="#98FF2F" />
                <Text className="text-white font-inter-semibold mt-3 text-center">Photo preview could not load</Text>
              </View>
            )}

            {showLoadingOverlay && (
              <View className="absolute inset-0 items-center justify-center bg-black/50">
                <ActivityIndicator size="large" color="#98FF2F" />
              </View>
            )}

            {activeEffect === 'Glitch' && (
              <>
                <View className="absolute inset-0 bg-red-500/20" style={{ transform: [{ translateX: -4 }] }} pointerEvents="none" />
                <View className="absolute inset-0 bg-blue-500/20" style={{ transform: [{ translateX: 4 }] }} pointerEvents="none" />
              </>
            )}

            {activeEffect === 'Flash' && <View className="absolute inset-0 bg-white/40" pointerEvents="none" />}

            {activeEffect === 'VHS' && <View className="absolute inset-0 bg-green-500/10 border-t-2 border-black/20" pointerEvents="none" style={{ top: 0, bottom: 0 }} />}

            {activeEffect === 'Sparkle' && (
              <View className="absolute inset-0" pointerEvents="none">
                <View className="absolute top-1/4 left-1/4"><Ionicons name="sparkles" size={24} color="white" /></View>
                <View className="absolute top-1/2 right-1/4"><Ionicons name="sparkles" size={32} color="white" /></View>
                <View className="absolute bottom-1/4 left-1/3"><Ionicons name="sparkles" size={16} color="white" /></View>
              </View>
            )}

            {exposure !== 50 && (
              <View className="absolute inset-0 pointer-events-none" style={{ backgroundColor: exposure > 50 ? 'white' : 'black', opacity: Math.abs(exposure - 50) / 100 }} />
            )}

            {activeFilter !== 'Normal' && (
              <View className="absolute inset-0 pointer-events-none" style={{ backgroundColor: activeFilter === 'Vivid' ? 'rgba(255, 50, 50, 0.15)' : activeFilter === 'Mono' ? 'rgba(0, 0, 0, 0.7)' : activeFilter === 'Vintage' ? 'rgba(112, 66, 20, 0.3)' : activeFilter === 'Warm' ? 'rgba(255, 165, 0, 0.2)' : 'transparent' }} />
            )}

            {isTextMode && <View className="absolute inset-0 bg-black/40" />}

            {!isTextMode && !activePanel && (
              <View className="absolute left-4 top-10 bg-black/60 px-3 py-1.5 rounded-full flex-row items-center z-20">
                <Ionicons name={isVideo ? 'videocam' : 'image'} size={14} color="#98FF2F" />
                <Text className="text-white font-inter-semibold text-xs ml-1.5">{isVideo ? 'Video' : 'Photo'}</Text>
              </View>
            )}

            <TextOverlay overlayText={overlayText} isTextMode={isTextMode} activePanel={activePanel} textPanResponder={textPanResponder} textPan={textPan} />

            <MusicCard soundUrl={selectedSoundUrl} title={selectedTitle} musicCoverUrl={selectedMusicCoverUrl} musicArtist={selectedMusicArtist} showMusicCard={showMusicCard} isTextMode={isTextMode} activePanel={activePanel} panResponder={panResponder} pan={pan} onClose={removeMusic} />

            {showPreviewBar && (
              <BottomPreviewBar isTextMode={isTextMode} activePanel={activePanel} togglePreviewPlayback={togglePreviewPlayback} isPreviewPlaying={isPreviewPlaying} previewCurrentTime={previewCurrentTime} previewDurationSec={previewDurationSec} previewProgressPercent={previewProgressPercent} formatSeconds={formatSeconds} />
            )}

            <EditorRightActions isTextMode={isTextMode} activePanel={activePanel} router={router} mockImage={mockImage} mediaType={normalizedMediaType} soundUrl={selectedSoundUrl} title={selectedTitle} soundDuration={selectedSoundDuration} musicId={selectedMusicId} musicArtist={selectedMusicArtist} musicCoverUrl={selectedMusicCoverUrl} originalVolume={selectedOriginalVolume} addedVolume={selectedAddedVolume} trimLeft={trimLeft} trimRight={trimRight} videoTrimLeft={videoTrimLeft} videoTrimRight={videoTrimRight} videoTrimStart={videoTrimStart} videoTrimEnd={videoTrimEnd} videoDurationSec={videoDurationSec} overlayText={overlayText} textOffsetX={(textPan.x as any)._value} textOffsetY={(textPan.y as any)._value} musicOffsetX={(pan.x as any)._value} musicOffsetY={(pan.y as any)._value} showMusicCard={showMusicCard} exposure={exposure} contrast={contrast} activeFilter={activeFilter} activeEffect={activeEffect} setIsTextMode={setIsTextMode} setActivePanel={setActivePanel} isLowEndDevice={isLowEndDevice} />
          </View>
        </View>

        {activePanel && (
          <View className="absolute bottom-0 left-0 right-0 bg-[#222]/90 rounded-t-3xl p-6 z-30 shadow-lg" style={{ paddingBottom: Math.max(insets.bottom + 24, 24) }}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white font-inter-semibold text-lg capitalize">{activePanel}</Text>
              <Pressable onPress={() => setActivePanel(null)} className="bg-[#98FF2F] px-4 py-1.5 rounded-lg">
                <Text className="text-black font-inter-semibold">Done</Text>
              </Pressable>
            </View>

            {activePanel === 'options' && (
              <View className="gap-2">
                <CustomSlider label="Exposure" value={exposure} onValueChange={setExposure} />
                <CustomSlider label="Contrast" value={contrast} onValueChange={setContrast} />
              </View>
            )}

            <FilterPanel activePanel={activePanel} activeFilter={activeFilter} setActiveFilter={setActiveFilter} mockImage={mockImage} />
            <EffectPanel activePanel={activePanel} activeEffect={activeEffect} setActiveEffect={setActiveEffect} />
          </View>
        )}

        {isTextMode ? (
          <View className="bg-[#222] flex-row items-center px-4 py-3" style={{ paddingBottom: Math.max(insets.bottom + 12, 12) }}>
            <Ionicons name="add" size={28} color="#98FF2F" />
            {/* @ts-ignore - React Native TextInput accepts ref, but @types/react is mismatched */}
            <TextInput ref={inputRef} className="flex-1 text-white font-inter-regular text-base ml-2 bg-[#333] px-4 py-2 rounded-lg" placeholder="Type something..." placeholderTextColor="#888" value={overlayText} onChangeText={setOverlayText} returnKeyType="done" onSubmitEditing={handleDoneText} autoFocus />
            <Pressable onPress={handleDoneText} className="ml-3"><Ionicons name="send" size={24} color="#98FF2F" /></Pressable>
          </View>
        ) : !activePanel ? (
          <View className="flex-row items-center justify-center px-4 pt-4 gap-4" style={{ paddingBottom: Math.max(insets.bottom + 20, 20) }}>
            <Pressable onPress={() => router.back()} className="px-8 py-3 rounded-xl border border-[#98D83A] bg-[#222]">
              <Text className="text-[#98D83A] font-inter-semibold">Cancel</Text>
            </Pressable>
            <Pressable onPress={navigateToPostDetails} disabled={isExporting} className={`px-8 py-3 rounded-xl bg-[#98D83A] ${isExporting ? 'opacity-60' : ''}`}>
              {isExporting ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="black" />
                  <Text className="text-black font-inter-semibold">Uploading...</Text>
                </View>
              ) : (
                <Text className="text-black font-inter-semibold">Next</Text>
              )}
            </Pressable>
          </View>
        ) : null}

      </View>
    </KeyboardAvoidingView>
  );
}
