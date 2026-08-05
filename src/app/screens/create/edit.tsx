import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, Image, Pressable, TextInput, KeyboardAvoidingView, Platform, Keyboard, ScrollView, Animated, PanResponder, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createAudioPlayer } from 'expo-audio';
import { useVideoPlayer, VideoView } from 'expo-video';

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

function MediaVideoPreview({
  player,
  hasFirstFrame,
  onFirstFrameRender,
  compact = false
}: {
  player: any;
  hasFirstFrame: boolean;
  onFirstFrameRender: () => void;
  compact?: boolean;
}) {
  return (
    <View className="absolute inset-0 bg-black">
      <VideoView
        player={player}
        className="absolute inset-0"
        style={{ width: '100%', height: '100%' }}
        nativeControls={false}
        contentFit="cover"
        surfaceType="textureView"
        onFirstFrameRender={onFirstFrameRender}
      />
      {!hasFirstFrame && (
        <View className="absolute inset-0 items-center justify-center bg-black">
          <Ionicons name="play-circle" size={compact ? 24 : 56} color="#98FF2F" />
          {!compact && <Text className="text-white font-inter-medium mt-3">Loading video preview...</Text>}
        </View>
      )}
    </View>
  );
}

// Custom interactive slider using PanResponder
const CustomSlider = ({ value, onValueChange, label }: { value: number, onValueChange: (val: number) => void, label: string }) => {
  const latestValue = useRef(value);
  latestValue.current = value;
  const startVal = useRef(value);
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startVal.current = latestValue.current;
      },
      onPanResponderMove: (evt, gestureState) => {
        const sliderWidth = width - 80; // Approximate width for panel slider
        const dxPercent = (gestureState.dx / sliderWidth) * 100;
        let newValue = Math.round(startVal.current + dxPercent);
        newValue = Math.max(0, Math.min(100, newValue));
        onValueChange(newValue);
      }
    })
  ).current;

  return (
    <View className="mb-2 w-full">
      <View className="flex-row justify-between mb-2">
        <Text className="text-white font-inter-medium text-[15px]">{label}</Text>
      </View>
      <View 
        {...panResponder.panHandlers}
        className="w-full h-10 justify-center relative" // Larger touch target
      >
        <View className="w-full h-1 bg-white/20 rounded-full flex-row items-center relative">
          <View className="h-full bg-[#98FF2F] rounded-full" style={{ width: `${value}%` }} />
          <View className="w-5 h-5 rounded-full bg-[#98FF2F] absolute" style={{ left: `${value}%`, marginLeft: -10 }} />
        </View>
      </View>
    </View>
  );
};

export default function EditMediaScreen() {
  const { 
    uri, mediaType, soundUrl, title, soundDuration,
    originalVolume, addedVolume, trimLeft, trimRight, videoTrimLeft, videoTrimRight,
    videoTrimStart, videoTrimEnd, videoDuration
  } = useLocalSearchParams<{ 
    uri: string; mediaType?: 'photo' | 'video'; soundUrl: string; title: string; soundDuration?: string;
    originalVolume?: string; addedVolume?: string; trimLeft?: string; trimRight?: string;
    videoTrimLeft?: string; videoTrimRight?: string;
    videoTrimStart?: string; videoTrimEnd?: string; videoDuration?: string;
  }>();
  
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const mockImage = uri || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800';
  const isVideo = mediaType === 'video';
  const audioDurationSec = parseDurationSeconds(soundDuration, title);
  const videoPlayer = useVideoPlayer(isVideo ? { uri: mockImage, contentType: 'progressive' } : null, player => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  // Audio Player for Preview
  const [sound, setSound] = useState<any>(null);
  const [showMusicCard, setShowMusicCard] = useState(true);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(true);
  const [hasVideoFrame, setHasVideoFrame] = useState(false);
  const [videoDurationSec, setVideoDurationSec] = useState(videoDuration ? Number(videoDuration) : 0);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const isPreviewPlayingRef = useRef(isPreviewPlaying);
  isPreviewPlayingRef.current = isPreviewPlaying;

  // Drag logic for Music Card
  const pan = useRef(new Animated.ValueXY()).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      }
    })
  ).current;

  // Format time helper for display (e.g. 15 -> "00:15")
  const formatTime = (percentStr?: string) => {
    if (!percentStr) return '00:00';
    const percent = Number(percentStr);
    const secs = Math.min(Math.floor(audioDurationSec), Math.floor((Math.max(0, Math.min(100, percent)) / 100) * audioDurationSec));
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const getTrimTime = (percentStr?: string, fallbackPercent = 0) => {
    const percent = percentStr !== undefined && percentStr !== '' ? Number(percentStr) : fallbackPercent;
    return Math.floor((percent / 100) * audioDurationSec * 1000) / 1000;
  };

  const getVideoTrimPercent = (percentStr: string | undefined, fallbackPercent: number) => {
    const percent = percentStr !== undefined && percentStr !== '' ? Number(percentStr) : fallbackPercent;
    return Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : fallbackPercent;
  };

  const videoTrimStartPercent = getVideoTrimPercent(videoTrimLeft, 0);
  const videoTrimEndPercent = getVideoTrimPercent(videoTrimRight, 100);
  const savedVideoTrimStartSec = videoTrimStart !== undefined && videoTrimStart !== '' ? Number(videoTrimStart) : null;
  const savedVideoTrimEndSec = videoTrimEnd !== undefined && videoTrimEnd !== '' ? Number(videoTrimEnd) : null;
  const videoTrimStartSec = savedVideoTrimStartSec !== null && Number.isFinite(savedVideoTrimStartSec)
    ? savedVideoTrimStartSec
    : videoDurationSec > 0 ? (videoTrimStartPercent / 100) * videoDurationSec : 0;
  const videoTrimEndSec = savedVideoTrimEndSec !== null && Number.isFinite(savedVideoTrimEndSec)
    ? savedVideoTrimEndSec
    : videoDurationSec > 0 ? (videoTrimEndPercent / 100) * videoDurationSec : 0;
  const selectedVideoDurationSec = videoDurationSec > 0
    ? Math.max(1, videoTrimEndSec - videoTrimStartSec)
    : 1;

  const formatSeconds = (seconds: number) => {
    const safeSeconds = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
    const mins = Math.floor(safeSeconds / 60);
    const remainingSecs = safeSeconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const previewDurationSec = Math.max(1, isVideo ? selectedVideoDurationSec : audioDurationSec);
  const previewProgressPercent = Math.max(0, Math.min(100, (previewCurrentTime / previewDurationSec) * 100));

  const seekSound = (player: any, seconds: number) => {
    if (!player || !Number.isFinite(seconds)) return;

    if (typeof player.seekTo === 'function') {
      try { player.seekTo(seconds); } catch(e) {}
    }

    try { player.currentTime = seconds; } catch(e) {}
  };

  useFocusEffect(
    useCallback(() => {
      let player: any = null;
      if (soundUrl) {
        try {
          // Handle asset IDs passed as strings (e.g. from require())
          const source = /^\d+$/.test(soundUrl) ? parseInt(soundUrl, 10) : soundUrl;
          player = createAudioPlayer(source);
          seekSound(player, getTrimTime(trimLeft));
          if (isPreviewPlayingRef.current) {
            player.play();
          }
          setTimeout(() => seekSound(player, getTrimTime(trimLeft)), 100);
          player.loop = true; // Loop the preview music
          setSound(player);
        } catch (error) {
          console.log("Preview audio error:", error);
        }
      }
      return () => {
        if (player) {
          player.pause();
          try { player.remove(); } catch(e) {}
        }
        setSound(null);
      };
    }, [soundUrl])
  );

  useEffect(() => {
    if (!isVideo) return;

    setHasVideoFrame(false);
    videoPlayer.replaceAsync({ uri: mockImage, contentType: 'progressive' }).then(() => {
      videoPlayer.muted = true;
      if (Number.isFinite(videoPlayer.duration) && videoPlayer.duration > 0) {
        setVideoDurationSec(Math.floor(videoPlayer.duration));
      }
      const loadedDuration = Number(videoPlayer.duration);
      const startSec = Number.isFinite(loadedDuration) && loadedDuration > 0
        ? (videoTrimStartPercent / 100) * loadedDuration
        : 0;
      videoPlayer.currentTime = startSec;

      if (isPreviewPlaying) {
        videoPlayer.play();
      } else {
        videoPlayer.pause();
      }
    }).catch(error => {
      console.error('Video preview load error:', error);
    });
  }, [isVideo, mockImage, videoPlayer, videoTrimStartPercent]);

  useEffect(() => {
    if (!isVideo) return;

    const durationChecker = setInterval(() => {
      if (Number.isFinite(videoPlayer.duration) && videoPlayer.duration > 0) {
        setVideoDurationSec(Math.floor(videoPlayer.duration));
        clearInterval(durationChecker);
      }
    }, 250);

    return () => clearInterval(durationChecker);
  }, [isVideo, videoPlayer]);

  useEffect(() => {
    if (isPreviewPlaying) {
      if (isVideo) {
        if (videoDurationSec > 0 && (videoPlayer.currentTime < videoTrimStartSec || videoPlayer.currentTime >= videoTrimEndSec)) {
          try { videoPlayer.currentTime = videoTrimStartSec; } catch(e) {}
        }
        try { videoPlayer.play(); } catch(e) {}
      }
      if (sound) {
        try { sound.play(); } catch(e) {}
      }
    } else {
      if (isVideo) {
        try { videoPlayer.pause(); } catch(e) {}
      }
      if (sound) {
        try { sound.pause(); } catch(e) {}
      }
    }
  }, [isPreviewPlaying, isVideo, sound, videoDurationSec, videoPlayer, videoTrimEndSec, videoTrimStartSec]);

  // Apply edits (volume, trim) to the existing player without recreating it
  useEffect(() => {
    if (sound) {
      if (addedVolume !== undefined) {
        sound.volume = Number(addedVolume) / 100;
      }
      seekSound(sound, getTrimTime(trimLeft));
    }
  }, [sound, addedVolume, trimLeft]);

  useEffect(() => {
    if (!sound || !isPreviewPlaying) return;

    const watcher = setInterval(() => {
      const currentTime = Number(sound.currentTime ?? 0);
      const trimStartSec = getTrimTime(trimLeft);
      const trimEndSec = getTrimTime(trimRight, 100);

      if (currentTime >= trimEndSec || currentTime < trimStartSec - 0.25) {
        seekSound(sound, trimStartSec);
        if (isPreviewPlaying) {
          try { sound.play(); } catch(e) {}
        }
      }
    }, 200);

    return () => clearInterval(watcher);
  }, [audioDurationSec, isPreviewPlaying, sound, trimLeft, trimRight]);

  useEffect(() => {
    const progressTimer = setInterval(() => {
      const videoCurrentTime = Number(videoPlayer.currentTime ?? 0);
      const nextTime = isVideo ? videoCurrentTime - videoTrimStartSec : Number(sound?.currentTime ?? 0) - getTrimTime(trimLeft);
      const safeTime = Math.max(0, nextTime);
      const duration = previewDurationSec;

      if (isPreviewPlaying && isVideo && videoDurationSec > 0 && (videoCurrentTime >= videoTrimEndSec || videoCurrentTime < videoTrimStartSec - 0.1)) {
        try { videoPlayer.currentTime = videoTrimStartSec; } catch(e) {}
        if (sound) {
          seekSound(sound, getTrimTime(trimLeft));
        }
        setPreviewCurrentTime(0);
        return;
      }

      if (isPreviewPlaying && safeTime >= duration - 0.1) {
        if (isVideo) {
          try { videoPlayer.currentTime = videoTrimStartSec; } catch(e) {}
        }
        if (sound) {
          seekSound(sound, getTrimTime(trimLeft));
        }
        setPreviewCurrentTime(0);
        return;
      }

      setPreviewCurrentTime(Math.min(duration, safeTime));
    }, 200);

    return () => clearInterval(progressTimer);
  }, [isPreviewPlaying, isVideo, previewDurationSec, sound, trimLeft, videoPlayer, videoTrimEndSec, videoTrimStartSec]);

  useFocusEffect(
    useCallback(() => {
      setIsPreviewPlaying(true);

      return () => {
        try { videoPlayer.pause(); } catch(e) {}
        try { sound?.pause(); } catch(e) {}
      };
    }, [sound, videoPlayer])
  );

  const togglePreviewPlayback = () => {
    setIsPreviewPlaying(prev => !prev);
  };

  // Text overlay state
  const [isTextMode, setIsTextMode] = useState(false);
  const [overlayText, setOverlayText] = useState('');
  const inputRef = useRef<TextInput>(null);

  // Options state
  const [exposure, setExposure] = useState(50);
  const [contrast, setContrast] = useState(50);
  const [activeFilter, setActiveFilter] = useState('Normal');
  const [activeEffect, setActiveEffect] = useState<string | null>(null);
  
  // Side panel states
  const [activePanel, setActivePanel] = useState<'options' | 'filters' | 'effects' | null>(null);

  // Focus input when entering text mode
  useEffect(() => {
    if (isTextMode && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isTextMode]);

  const handleDoneText = () => {
    Keyboard.dismiss();
    setIsTextMode(false);
  };

  const navigateToEditMusic = () => {
    router.push({
      pathname: '/screens/create/edit-music',
      params: {
        uri: mockImage,
        mediaType: mediaType || 'photo',
        soundUrl: soundUrl || '',
        title: title || '',
        soundDuration: soundDuration || '',
        originalVolume: originalVolume?.toString() || '',
        addedVolume: addedVolume?.toString() || '',
        trimLeft: trimLeft?.toString() || '',
        trimRight: trimRight?.toString() || '',
        videoTrimLeft: videoTrimLeft?.toString() || '',
        videoTrimRight: videoTrimRight?.toString() || '',
        videoTrimStart: videoTrimStart || '',
        videoTrimEnd: videoTrimEnd || '',
        videoDuration: videoDurationSec.toString()
      }
    } as any);
  };

  const navigateToPostDetails = () => {
    router.push({
      pathname: '/screens/create/post-details',
      params: { 
        uri: mockImage, 
        mediaType: mediaType || 'photo',
        overlayText: overlayText, 
        soundUrl: soundUrl || '',
        title: title || '',
        soundDuration: soundDuration || '',
        originalVolume: originalVolume?.toString() || '',
        addedVolume: addedVolume?.toString() || '',
        trimLeft: trimLeft?.toString() || '',
        trimRight: trimRight?.toString() || '',
        videoTrimLeft: videoTrimLeft?.toString() || '',
        videoTrimRight: videoTrimRight?.toString() || '',
        videoTrimStart: videoTrimStart || '',
        videoTrimEnd: videoTrimEnd || '',
        videoDuration: videoDurationSec.toString(),
        exposure: exposure.toString(),
        contrast: contrast.toString(),
        activeFilter: activeFilter,
        activeEffect: activeEffect || ''
      }
    } as any);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-black"
    >
      <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
        
        {/* Header */}
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

        {/* Main Content Area */}
        <View className="flex-1 relative">
          <View className="flex-1 bg-black overflow-hidden relative items-center justify-center">
            
            {isVideo ? (
              <View
                className="w-full h-full absolute inset-0"
                style={{
                  transform: activeEffect === 'Zoom' ? [{ scale: 1.15 }] : [{ scale: 1 }]
                }}
              >
                <MediaVideoPreview
                  player={videoPlayer}
                  hasFirstFrame={hasVideoFrame}
                  onFirstFrameRender={() => setHasVideoFrame(true)}
                />
              </View>
            ) : (
              <Image 
                source={{ uri: mockImage }} 
                className="w-full h-full absolute inset-0"
                resizeMode="cover"
                style={{
                  transform: activeEffect === 'Zoom' ? [{ scale: 1.15 }] : [{ scale: 1 }]
                }}
              />
            )}
            
            {/* Simulate Glitch Effect (Chromatic Aberration) */}
            {activeEffect === 'Glitch' && (
              <>
                <View className="absolute inset-0 bg-red-500/20" style={{ transform: [{ translateX: -4 }] }} pointerEvents="none" />
                <View className="absolute inset-0 bg-blue-500/20" style={{ transform: [{ translateX: 4 }] }} pointerEvents="none" />
              </>
            )}

            {/* Simulate Flash Effect */}
            {activeEffect === 'Flash' && (
              <View className="absolute inset-0 bg-white/40" pointerEvents="none" />
            )}

            {/* Simulate VHS Effect */}
            {activeEffect === 'VHS' && (
              <View className="absolute inset-0 bg-green-500/10 border-t-2 border-black/20" pointerEvents="none" style={{ top: 0, bottom: 0 }} />
            )}

            {/* Simulate Sparkle Effect */}
            {activeEffect === 'Sparkle' && (
              <View className="absolute inset-0" pointerEvents="none">
                 <View className="absolute top-1/4 left-1/4"><Ionicons name="sparkles" size={24} color="white" /></View>
                 <View className="absolute top-1/2 right-1/4"><Ionicons name="sparkles" size={32} color="white" /></View>
                 <View className="absolute bottom-1/4 left-1/3"><Ionicons name="sparkles" size={16} color="white" /></View>
              </View>
            )}
            
            {/* Simulate Exposure Effect Overlay */}
            {exposure !== 50 && (
              <View 
                className="absolute inset-0 pointer-events-none" 
                style={{ 
                  backgroundColor: exposure > 50 ? 'white' : 'black',
                  opacity: Math.abs(exposure - 50) / 100
                }} 
              />
            )}

            {/* Simulate Filter Effect Overlay */}
            {activeFilter !== 'Normal' && (
              <View 
                className="absolute inset-0 pointer-events-none" 
                style={{ 
                  backgroundColor: 
                    activeFilter === 'Vivid' ? 'rgba(255, 50, 50, 0.15)' :
                    activeFilter === 'Mono' ? 'rgba(0, 0, 0, 0.7)' :
                    activeFilter === 'Vintage' ? 'rgba(112, 66, 20, 0.3)' :
                    activeFilter === 'Warm' ? 'rgba(255, 165, 0, 0.2)' : 'transparent',
                }} 
              />
            )}
            
            {/* Dim the background slightly when in text mode */}
            {isTextMode && (
              <View className="absolute inset-0 bg-black/40" />
            )}

            {/* Display Overlay Text */}
            {!isTextMode && !activePanel && (
              <View className="absolute left-4 top-10 bg-black/60 px-3 py-1.5 rounded-full flex-row items-center z-20">
                <Ionicons name={isVideo ? 'videocam' : 'image'} size={14} color="#98FF2F" />
                <Text className="text-white font-inter-semibold text-xs ml-1.5">
                  {isVideo ? 'Video' : 'Photo'}
                </Text>
              </View>
            )}

            {overlayText.length > 0 && (
              <Text className="text-white font-inter-bold text-3xl text-center px-4 z-10" style={{ textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: -1, height: 1 }, textShadowRadius: 10 }}>
                {overlayText}
              </Text>
            )}
            
            {/* Display Music Card (Draggable) */}
            {soundUrl && title && showMusicCard && !isTextMode && !activePanel && (
              <Animated.View 
                {...panResponder.panHandlers}
                style={{ transform: [{ translateX: pan.x }, { translateY: pan.y }] }}
                className="absolute top-10 self-center bg-black/60 px-4 py-2 rounded-full flex-col items-center justify-center z-10"
              >
                <View className="flex-row items-center gap-2">
                  <Ionicons name="musical-notes" size={16} color="white" />
                  <Text className="text-white font-inter-medium text-sm">{title}</Text>
                  <Pressable onPress={() => setShowMusicCard(false)} className="ml-2">
                    <Ionicons name="close-circle" size={18} color="#aaa" />
                  </Pressable>
                </View>
                {trimLeft !== undefined && trimRight !== undefined && (
                  <Text className="text-[#98FF2F] font-inter-medium text-[10px] mt-0.5">
                    {formatTime(trimLeft)} - {formatTime(trimRight)}
                  </Text>
                )}
              </Animated.View>
            )}

            {!isTextMode && !activePanel && (
              <View className="absolute left-4 right-4 bottom-36 bg-black/70 rounded-2xl px-4 py-3 z-20">
                <View className="flex-row items-center gap-3">
                  <Pressable
                    onPress={togglePreviewPlayback}
                    className="w-11 h-11 rounded-full bg-[#98FF2F] items-center justify-center"
                  >
                    <Ionicons
                      name={isPreviewPlaying ? 'pause' : 'play'}
                      size={22}
                      color="black"
                      style={{ marginLeft: isPreviewPlaying ? 0 : 2 }}
                    />
                  </Pressable>

                  <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-white font-inter-semibold text-xs">
                        {formatSeconds(previewCurrentTime)}
                      </Text>
                      <Text className="text-white font-inter-semibold text-xs">
                        {formatSeconds(previewDurationSec)}
                      </Text>
                    </View>
                    <View className="h-1.5 bg-white/25 rounded-full overflow-hidden">
                      <View
                        className="h-full bg-[#98FF2F] rounded-full"
                        style={{ width: `${previewProgressPercent}%` }}
                      />
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Right Floating Actions */}
            {!isTextMode && !activePanel && (
              <View className="absolute right-4 top-10 gap-4 z-20">
                <Pressable
                  onPress={() => router.push({
                    pathname: '/screens/create/sound',
                    params: {
                      returnTo: '/screens/create/edit',
                      uri,
                      mediaType: mediaType || 'photo',
                      originalVolume: originalVolume?.toString() || '',
                      addedVolume: addedVolume?.toString() || '',
                      trimLeft: trimLeft?.toString() || '',
                      trimRight: trimRight?.toString() || '',
                      soundDuration: soundDuration || '',
                      videoTrimLeft: videoTrimLeft?.toString() || '',
                      videoTrimRight: videoTrimRight?.toString() || '',
                      videoTrimStart: videoTrimStart || '',
                      videoTrimEnd: videoTrimEnd || '',
                      videoDuration: videoDurationSec.toString()
                    }
                  } as any)}
                  className="items-center relative"
                >
                  <View className="w-12 h-12 bg-black rounded-full items-center justify-center">
                  <Ionicons name="musical-notes-outline" size={20} color="#98D83A" />
                  </View>
                  <Text className="text-white text-[10px] mt-1 font-inter-medium">Sound</Text>
                  {soundUrl && (
                    <View className="absolute -top-1 -right-1 w-4 h-4 bg-[#98FF2F] rounded-full border border-black items-center justify-center">
                      <Ionicons name="checkmark" size={10} color="black" />
                    </View>
                  )}
                </Pressable>
                
                {/* Scissors - Route to Edit Music if sound is added, otherwise maybe just trim video */}
                <Pressable onPress={navigateToEditMusic} className="items-center">
                  <View className="w-12 h-12 bg-black rounded-full items-center justify-center">
                  <Ionicons name="cut-outline" size={20} color="#98D83A" />
                  </View>
                  <Text className="text-white text-[10px] mt-1 font-inter-medium">Trim</Text>
                </Pressable>
                
                {/* <Pressable onPress={() => setActivePanel('options')} className="items-center">
                  <View className="w-12 h-12 bg-black rounded-full items-center justify-center">
                  <Ionicons name="options-outline" size={20} color="#98D83A" />
                  </View>
                  <Text className="text-white text-[10px] mt-1 font-inter-medium">Adjust</Text>
                </Pressable> */}
                
                {/* Text Tool */}
                <Pressable onPress={() => setIsTextMode(true)} className="items-center">
                  <View className="w-12 h-12 bg-black rounded-full items-center justify-center">
                  <Text className="text-[#98D83A] font-serif text-lg font-bold">Tt</Text>
                  </View>
                  <Text className="text-white text-[10px] mt-1 font-inter-medium">Text</Text>
                </Pressable>
                
                <Pressable onPress={() => setActivePanel('filters')} className="items-center">
                  <View className="w-12 h-12 bg-black rounded-full items-center justify-center">
                  <Ionicons name="color-filter-outline" size={20} color="#98D83A" />
                  </View>
                  <Text className="text-white text-[10px] mt-1 font-inter-medium">Filter</Text>
                </Pressable>
                
                <Pressable onPress={() => setActivePanel('effects')} className="items-center">
                  <View className="w-12 h-12 bg-black rounded-full items-center justify-center">
                  <Ionicons name="tablet-landscape-outline" size={20} color="#98D83A" style={{ transform: [{ rotate: '-45deg' }] }} />
                  </View>
                  <Text className="text-white text-[10px] mt-1 font-inter-medium">Effect</Text>
                </Pressable>
              </View>
            )}

            {/* Bottom Thumbnail Overlay */}
            {!isTextMode && !activePanel && (
              <View className="absolute bottom-4 left-4 right-4 bg-black/60 rounded-2xl p-4 min-h-[100px] z-20">
                <View className="w-16 h-16 rounded-lg overflow-hidden relative border-2 border-[#98D83A]">
                  {isVideo ? (
                    <>
                      <View className="absolute inset-0 bg-[#222] items-center justify-center">
                        <Ionicons name="play" size={18} color="white" />
                      </View>
                    </>
                  ) : (
                    <Image source={{ uri: mockImage }} className="w-full h-full" />
                  )}
                  <View className="absolute top-1 right-1 bg-[#98D83A] rounded-full">
                    <Ionicons name="checkmark-circle" size={16} color="black" />
                  </View>
                </View>
              </View>
            )}

          </View>
        </View>

        {/* Bottom Panel Display for Tools */}
        {activePanel && (
          <View 
            className="absolute bottom-0 left-0 right-0 bg-[#222]/90 rounded-t-3xl p-6 z-30 shadow-lg"
            style={{ paddingBottom: Math.max(insets.bottom + 24, 24) }}
          >
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white font-inter-semibold text-lg capitalize">{activePanel}</Text>
              <Pressable onPress={() => setActivePanel(null)} className="bg-[#98FF2F] px-4 py-1.5 rounded-lg">
                <Text className="text-black font-inter-semibold">Done</Text>
              </Pressable>
            </View>

            {activePanel === 'options' && (
              <View className="gap-2">
                <CustomSlider 
                  label="Exposure" 
                  value={exposure} 
                  onValueChange={setExposure} 
                />
                <CustomSlider 
                  label="Contrast" 
                  value={contrast} 
                  onValueChange={setContrast} 
                />
              </View>
            )}

            {activePanel === 'filters' && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-4">
                {['Normal', 'Vivid', 'Mono', 'Vintage', 'Warm'].map((filter) => (
                  <Pressable key={filter} onPress={() => setActiveFilter(filter)} className="items-center mr-4">
                    <View className={`w-16 h-16 rounded-full border-2 ${activeFilter === filter ? 'border-[#98FF2F]' : 'border-transparent'} mb-2 overflow-hidden bg-black`}>
                       <Image source={{ uri: mockImage }} className="w-full h-full opacity-80" />
                    </View>
                    <Text className={`font-inter-medium text-sm ${activeFilter === filter ? 'text-[#98FF2F]' : 'text-white'}`}>{filter}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            {activePanel === 'effects' && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-4">
                {['None', 'Glitch', 'Sparkle', 'Zoom', 'Flash', 'VHS'].map((effect) => {
                  const isActive = activeEffect === effect || (effect === 'None' && !activeEffect);
                  return (
                    <Pressable key={effect} onPress={() => setActiveEffect(effect === 'None' ? null : effect)} className="items-center mr-4">
                      <View className={`w-16 h-16 rounded-2xl bg-[#333] items-center justify-center mb-2 border-2 ${isActive ? 'border-[#98FF2F]' : 'border-[#444]'}`}>
                         <Ionicons name={effect === 'None' ? 'close' : 'sparkles'} size={24} color={isActive ? '#98FF2F' : 'white'} />
                      </View>
                      <Text className={`font-inter-medium text-sm ${isActive ? 'text-[#98FF2F]' : 'text-white'}`}>{effect}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
        )}

        {/* Bottom Bar or Keyboard Input */}
        {isTextMode ? (
          <View className="bg-[#222] flex-row items-center px-4 py-3" style={{ paddingBottom: Math.max(insets.bottom + 12, 12) }}>
            <Ionicons name="add" size={28} color="#98FF2F" />
            <TextInput
              ref={inputRef}
              className="flex-1 text-white font-inter-regular text-base ml-2 bg-[#333] px-4 py-2 rounded-lg"
              placeholder="Type something..."
              placeholderTextColor="#888"
              value={overlayText}
              onChangeText={setOverlayText}
              returnKeyType="done"
              onSubmitEditing={handleDoneText}
              autoFocus
            />
            <Pressable onPress={handleDoneText} className="ml-3">
              <Ionicons name="send" size={24} color="#98FF2F" />
            </Pressable>
          </View>
        ) : !activePanel ? (
          <View className="flex-row items-center justify-center px-4 pt-4 gap-4" style={{ paddingBottom: Math.max(insets.bottom + 20, 20) }}>
            <Pressable 
              onPress={() => router.back()}
              className="px-8 py-3 rounded-xl border border-[#98D83A] bg-[#222]"
            >
              <Text className="text-[#98D83A] font-inter-semibold">Cancel</Text>
            </Pressable>
            <Pressable 
              onPress={navigateToPostDetails}
              className="px-8 py-3 rounded-xl bg-[#98D83A]"
            >
              <Text className="text-black font-inter-semibold">Next(1)</Text>
            </Pressable>
          </View>
        ) : null}

      </View>
    </KeyboardAvoidingView>
  );
}
