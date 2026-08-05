import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, Image, Dimensions, PanResponder, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { createAudioPlayer } from 'expo-audio';
import { useVideoPlayer, VideoView } from 'expo-video';

const { width } = Dimensions.get('window');
const DEFAULT_MUSIC_DURATION_SEC = 15;
const LOCAL_SOUND_DURATIONS: Record<string, number> = {
  'Cinematic Sound Effect': 12,
};

const parseDurationSeconds = (duration?: string, title?: string) => {
  if (title && LOCAL_SOUND_DURATIONS[title]) {
    return LOCAL_SOUND_DURATIONS[title];
  }

  if (!duration) return DEFAULT_MUSIC_DURATION_SEC;

  if (/^\d+(\.\d+)?$/.test(duration)) {
    const seconds = Number(duration);
    return Number.isFinite(seconds) && seconds > 0 ? seconds : DEFAULT_MUSIC_DURATION_SEC;
  }

  const parts = duration.split(':').map(Number);
  if (parts.length === 2 && parts.every(Number.isFinite)) {
    const seconds = parts[0] * 60 + parts[1];
    return seconds > 0 ? seconds : DEFAULT_MUSIC_DURATION_SEC;
  }

  return DEFAULT_MUSIC_DURATION_SEC;
};

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
        const sliderWidth = width - 32; // Assuming px-4 on both sides
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
        <Text className="text-[#98FF2F] font-inter-medium">{value}%</Text>
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

export default function EditMusicScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { 
    uri, mediaType, soundUrl, title, soundDuration, musicId, musicArtist, musicCoverUrl,
    originalVolume: initOrigVol, 
    addedVolume: initAddedVol, 
    trimLeft: initTrimLeft, 
    trimRight: initTrimRight,
    videoTrimLeft: initVideoTrimLeft,
    videoTrimRight: initVideoTrimRight,
    videoTrimStart: initVideoTrimStart,
    videoTrimEnd: initVideoTrimEnd,
    videoDuration: initVideoDuration
  } = useLocalSearchParams<{ 
    uri: string; mediaType?: 'photo' | 'video'; soundUrl: string; title: string; soundDuration?: string;
    musicId?: string; musicArtist?: string; musicCoverUrl?: string;
    originalVolume?: string; addedVolume?: string; trimLeft?: string; trimRight?: string;
    videoTrimLeft?: string; videoTrimRight?: string;
    videoTrimStart?: string; videoTrimEnd?: string; videoDuration?: string;
  }>();

  const [originalVolume, setOriginalVolume] = useState(initOrigVol ? parseInt(initOrigVol, 10) : 100);
  const [addedVolume, setAddedVolume] = useState(initAddedVol ? parseInt(initAddedVol, 10) : 100);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  const [isOriginalMuted, setIsOriginalMuted] = useState(false);
  const [hasVideoFrame, setHasVideoFrame] = useState(false);
  const [videoDurationSec, setVideoDurationSec] = useState(initVideoDuration ? Number(initVideoDuration) : 0);
  const [musicDurationSec, setMusicDurationSec] = useState(() => parseDurationSeconds(soundDuration, title));
  const [sound, setSound] = useState<any>(null);
  const isVideo = mediaType === 'video';
  const [trimTarget, setTrimTarget] = useState<'music' | 'video'>(isVideo ? 'video' : 'music');
  const trimTargetRef = useRef<'music' | 'video'>(isVideo ? 'video' : 'music');
  
  // Trim states (percentages)
  const [trimLeft, setTrimLeft] = useState(initTrimLeft ? parseInt(initTrimLeft, 10) : 20);
  const [trimRight, setTrimRight] = useState(initTrimRight ? parseInt(initTrimRight, 10) : 70);
  const [videoTrimLeft, setVideoTrimLeft] = useState(initVideoTrimLeft ? parseInt(initVideoTrimLeft, 10) : 0);
  const [videoTrimRight, setVideoTrimRight] = useState(initVideoTrimRight ? parseInt(initVideoTrimRight, 10) : 100);

  const mockImage = uri || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800';
  const selectedVideoDurationSec = Math.max(1, ((videoTrimRight - videoTrimLeft) / 100) * videoDurationSec);
  const maxMusicTrimPercentSpan = isVideo ? Math.max(1, (selectedVideoDurationSec / musicDurationSec) * 100) : 100;
  const musicWindowSpan = Math.min(100, maxMusicTrimPercentSpan);
  const isVideoRef = useRef(isVideo);
  isVideoRef.current = isVideo;
  const musicWindowSpanRef = useRef(musicWindowSpan);
  musicWindowSpanRef.current = musicWindowSpan;
  const maxMusicTrimPercentSpanRef = useRef(maxMusicTrimPercentSpan);
  maxMusicTrimPercentSpanRef.current = maxMusicTrimPercentSpan;
  const activeTrimLeft = trimTarget === 'video' ? videoTrimLeft : trimLeft;
  const activeTrimRight = trimTarget === 'video' ? videoTrimRight : trimRight;
  const activeMaxDurationSec = trimTarget === 'video' ? videoDurationSec : musicDurationSec;
  const musicTrimStartSec = (trimLeft / 100) * musicDurationSec;
  const musicTrimEndSec = (trimRight / 100) * musicDurationSec;
  const videoPlayer = useVideoPlayer(isVideo ? { uri: mockImage, contentType: 'progressive' } : null, player => {
    player.loop = true;
    player.muted = false;
    player.volume = originalVolume / 100;
    player.play();
  });

  // Use refs to track latest values for PanResponder closures
  const latestAddedVolume = useRef(addedVolume);
  latestAddedVolume.current = addedVolume;
  const latestMusicTrimStartSec = useRef(musicTrimStartSec);
  latestMusicTrimStartSec.current = musicTrimStartSec;
  const latestMusicTrimEndSec = useRef(musicTrimEndSec);
  latestMusicTrimEndSec.current = musicTrimEndSec;

  const seekMusicToSelectedStart = (player: any) => {
    if (!player) return;

    if (typeof player.seekTo === 'function') {
      try { player.seekTo(latestMusicTrimStartSec.current); } catch (e) {}
    }

    try { player.currentTime = latestMusicTrimStartSec.current; } catch (e) {}
  };

  useEffect(() => {
    let player: any = null;
    if (soundUrl) {
      try {
        const source = /^\d+$/.test(soundUrl) ? parseInt(soundUrl, 10) : soundUrl;
        player = createAudioPlayer(source);
        // Set volume explicitly BEFORE playing to prevent audio leaks
        player.volume = latestAddedVolume.current / 100;
        seekMusicToSelectedStart(player);
        player.play();
        setTimeout(() => seekMusicToSelectedStart(player), 100);
        setTimeout(() => {
          const loadedDuration = Number(player.duration);
          if (!soundDuration && Number.isFinite(loadedDuration) && loadedDuration > 0) {
            setMusicDurationSec(Math.floor(loadedDuration));
          }
        }, 300);
        player.loop = true;
        setSound(player);
      } catch (e) {
        console.log("Error in edit-music preview", e);
      }
    }
    return () => {
      if (player) {
        player.pause();
        player.remove();
      }
    };
  }, [soundUrl]);

  useEffect(() => {
    setMusicDurationSec(parseDurationSeconds(soundDuration, title));
  }, [soundDuration, title]);

  // Sync play/pause state
  useEffect(() => {
    if (sound) {
      if (isMusicPlaying) {
        seekMusicToSelectedStart(sound);
        sound.play();
      } else {
        sound.pause();
      }
    }
  }, [isMusicPlaying, sound]);

  useEffect(() => {
    if (!sound) return;

    seekMusicToSelectedStart(sound);
    if (isMusicPlaying) {
      try { sound.play(); } catch (e) {}
    }
  }, [isMusicPlaying, musicTrimEndSec, musicTrimStartSec, sound]);

  useEffect(() => {
    if (!sound || !isMusicPlaying) return;

    const trimWatcher = setInterval(() => {
      const currentTime = Number(sound.currentTime ?? 0);
      if (currentTime >= latestMusicTrimEndSec.current || currentTime < latestMusicTrimStartSec.current - 0.25) {
        seekMusicToSelectedStart(sound);
        try { sound.play(); } catch (e) {}
      }
    }, 200);

    return () => clearInterval(trimWatcher);
  }, [isMusicPlaying, sound]);

  useEffect(() => {
    if (!isVideo) return;

    setHasVideoFrame(false);
    videoPlayer.replaceAsync({ uri: mockImage, contentType: 'progressive' }).then(() => {
      videoPlayer.currentTime = 0;
      videoPlayer.muted = isOriginalMuted;
      videoPlayer.volume = isOriginalMuted ? 0 : originalVolume / 100;
      if (Number.isFinite(videoPlayer.duration) && videoPlayer.duration > 0) {
        setVideoDurationSec(Math.round(videoPlayer.duration));
      }

      if (isVideoPlaying) {
        videoPlayer.play();
      } else {
        videoPlayer.pause();
      }
    }).catch(error => {
      console.error('Video trim preview load error:', error);
    });
  }, [isVideo, mockImage, videoPlayer]);

  useEffect(() => {
    if (!isVideo) return;

    const durationChecker = setInterval(() => {
      if (Number.isFinite(videoPlayer.duration) && videoPlayer.duration > 0) {
        setVideoDurationSec(Math.round(videoPlayer.duration));
        clearInterval(durationChecker);
      }
    }, 250);

    return () => clearInterval(durationChecker);
  }, [isVideo, videoPlayer]);

  useEffect(() => {
    if (!isVideo) return;

    if (trimRight - trimLeft > maxMusicTrimPercentSpan) {
      setTrimRight(Math.min(100, trimLeft + maxMusicTrimPercentSpan));
    }
  }, [isVideo, maxMusicTrimPercentSpan, trimLeft, trimRight]);

  useEffect(() => {
    if (!isVideo || trimTarget !== 'music') return;

    if (Math.abs((trimRight - trimLeft) - musicWindowSpan) > 0.5) {
      setMusicWindowStart(trimLeft);
    }
  }, [isVideo, musicWindowSpan, trimLeft, trimRight, trimTarget]);

  useEffect(() => {
    if (!isVideo) return;

    const clampedLeft = Math.min(trimLeft, 100 - musicWindowSpan);
    const expectedRight = clampedLeft + musicWindowSpan;

    if (Math.abs(trimLeft - clampedLeft) > 0.5 || Math.abs(trimRight - expectedRight) > 0.5) {
      setTrimLeft(clampedLeft);
      setTrimRight(expectedRight);
    }
  }, [isVideo, musicWindowSpan, trimLeft, trimRight, videoDurationSec]);

  useEffect(() => {
    if (!isVideo || hasVideoFrame) return;

    const fallback = setTimeout(() => {
      setHasVideoFrame(true);
    }, 1500);

    return () => clearTimeout(fallback);
  }, [hasVideoFrame, isVideo, mockImage]);

  useEffect(() => {
    if (!isVideo) return;

    videoPlayer.muted = isOriginalMuted;
    videoPlayer.volume = isOriginalMuted ? 0 : originalVolume / 100;

    if (isVideoPlaying) {
      videoPlayer.play();
    } else {
      videoPlayer.pause();
    }
  }, [isVideo, isOriginalMuted, isVideoPlaying, originalVolume, videoPlayer]);

  useEffect(() => {
    return () => {
      try {
        videoPlayer.pause();
      } catch (e) {}
    };
  }, [videoPlayer]);

  // Sync volume state dynamically when slider changes
  useEffect(() => {
    if (sound) {
      const vol = addedVolume / 100;
      sound.volume = vol;
      
      if (vol === 0) {
        sound.pause();
      } else if (isMusicPlaying) {
        // If it was paused purely due to volume=0, resume it if isPlaying is true
        // But avoid repeatedly calling play() while dragging
        try {
          seekMusicToSelectedStart(sound);
          sound.play();
        } catch(e) {}
      }
    }
  }, [addedVolume, isMusicPlaying, sound]);

  // Use refs to track latest values for PanResponder closures
  const latestTrimLeft = useRef(activeTrimLeft);
  latestTrimLeft.current = activeTrimLeft;
  const latestTrimRight = useRef(activeTrimRight);
  latestTrimRight.current = activeTrimRight;

  const setActiveTrimLeft = (value: number) => {
    if (trimTargetRef.current === 'video') {
      setVideoTrimLeft(value);
    } else {
      const clampedLeft = Math.min(value, trimRight - 10);
      setTrimLeft(clampedLeft);
      if (isVideo && trimRight - clampedLeft > maxMusicTrimPercentSpan) {
        setTrimRight(Math.min(100, clampedLeft + maxMusicTrimPercentSpan));
      }
    }
  };

  const setActiveTrimRight = (value: number) => {
    if (trimTargetRef.current === 'video') {
      setVideoTrimRight(value);
    } else {
      const maxRight = isVideo ? Math.min(100, trimLeft + maxMusicTrimPercentSpan) : 100;
      setTrimRight(Math.min(value, maxRight));
    }
  };

  const setMusicWindowStart = (left: number) => {
    const span = musicWindowSpanRef.current;
    const clampedLeft = Math.max(0, Math.min(100 - span, left));
    setTrimLeft(clampedLeft);
    setTrimRight(clampedLeft + span);
  };

  // Trim Left Handle
  const leftStart = useRef(activeTrimLeft);
  const leftPan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { leftStart.current = latestTrimLeft.current; },
    onPanResponderMove: (evt, gestureState) => {
      const w = width - 32;
      let newLeft = leftStart.current + (gestureState.dx / w) * 100;
      const minGap = trimTargetRef.current === 'music' && isVideoRef.current ? Math.min(10, maxMusicTrimPercentSpanRef.current) : 10;
      newLeft = Math.max(0, Math.min(latestTrimRight.current - minGap, newLeft)); // Keep it apart from right
      setActiveTrimLeft(newLeft);
    }
  })).current;

  // Trim Right Handle
  const rightStart = useRef(activeTrimRight);
  const rightPan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { rightStart.current = latestTrimRight.current; },
    onPanResponderMove: (evt, gestureState) => {
      const w = width - 32;
      let newRight = rightStart.current + (gestureState.dx / w) * 100;
      const minGap = trimTargetRef.current === 'music' && isVideoRef.current ? Math.min(10, maxMusicTrimPercentSpanRef.current) : 10;
      const maxRight = trimTargetRef.current === 'music' && isVideoRef.current
        ? Math.min(100, latestTrimLeft.current + maxMusicTrimPercentSpanRef.current)
        : 100;
      newRight = Math.max(latestTrimLeft.current + minGap, Math.min(maxRight, newRight));
      setActiveTrimRight(newRight);
    }
  })).current;

  const musicWindowStart = useRef(trimLeft);
  const musicWindowPan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => trimTargetRef.current === 'music' && isVideoRef.current,
    onMoveShouldSetPanResponder: () => trimTargetRef.current === 'music' && isVideoRef.current,
    onPanResponderGrant: () => { musicWindowStart.current = latestTrimLeft.current; },
    onPanResponderMove: (evt, gestureState) => {
      const w = width - 32;
      const newLeft = musicWindowStart.current + (gestureState.dx / w) * 100;
      setMusicWindowStart(newLeft);
    }
  })).current;

  // Format time helper (e.g. 15 -> "00:15")
  const formatTime = (percent: number, duration = activeMaxDurationSec) => {
    const clampedPercent = Math.max(0, Math.min(100, percent));
    const maxSeconds = Math.max(0, Math.floor(duration));
    const secs = Math.min(maxSeconds, Math.floor((clampedPercent / 100) * duration));
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;

    return `${mins < 10 ? '0' : ''}${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const pausePreviewPlayers = () => {
    try {
      videoPlayer.pause();
    } catch (e) {}

    if (sound) {
      try {
        sound.pause();
      } catch (e) {}
    }
  };

  return (
    <View className="flex-1 bg-[#121212]" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-[#222]">
        <Pressable onPress={() => {
          pausePreviewPlayers();
          router.back();
        }} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text className="text-white font-inter-semibold text-[17px]">
          Edit Music
        </Text>
        <Pressable 
          onPress={() => {
            pausePreviewPlayers();
            const videoTrimStartSec = videoDurationSec > 0
              ? (videoTrimLeft / 100) * videoDurationSec
              : Number(initVideoTrimStart || 0);
            const videoTrimEndSec = videoDurationSec > 0
              ? (videoTrimRight / 100) * videoDurationSec
              : Number(initVideoTrimEnd || 0);
            // Save state by passing back to edit.tsx
            router.replace({
              pathname: '/screens/create/edit' as any,
              params: {
                uri,
                soundUrl,
                title,
                soundDuration: soundDuration || '',
                musicId: musicId || '',
                musicArtist: musicArtist || '',
                musicCoverUrl: musicCoverUrl || '',
                originalVolume: originalVolume.toString(),
                addedVolume: addedVolume.toString(),
                trimLeft: trimLeft.toString(),
                trimRight: trimRight.toString(),
                videoTrimLeft: videoTrimLeft.toString(),
                videoTrimRight: videoTrimRight.toString(),
                videoTrimStart: videoTrimStartSec.toString(),
                videoTrimEnd: videoTrimEndSec.toString(),
                videoDuration: videoDurationSec.toString(),
                mediaType: mediaType || 'photo'
              }
            });
          }}
          className="bg-[#98FF2F] px-4 py-1.5 rounded-lg"
        >
          <Text className="text-black font-inter-semibold text-[15px]">Save</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 40, 40) }}>
        {/* Main Preview (Square crop matching mockup) */}
        <View className="items-center justify-center mt-2 px-4">
          <View className="w-full aspect-square rounded-[32px] overflow-hidden relative bg-[#222]">
            {isVideo ? (
              <VideoView
                player={videoPlayer}
                className="absolute inset-0"
                style={{ width: '100%', height: '100%' }}
                nativeControls={false}
                contentFit="cover"
                surfaceType="textureView"
                onFirstFrameRender={() => setHasVideoFrame(true)}
              />
            ) : (
              <Image 
                source={{ uri: mockImage }} 
                className="w-full h-full"
                resizeMode="cover"
              />
            )}
            <View className="absolute inset-0 bg-black/20" />

            {isVideo && !hasVideoFrame && (
              <View className="absolute inset-0 items-center justify-center bg-[#1f1f1f]">
                <Ionicons name="play-circle" size={56} color="#98FF2F" />
                <Text className="text-white font-inter-medium mt-3">Loading video...</Text>
              </View>
            )}
            
            {/* Play Button */}
            {(!isVideo || hasVideoFrame) && (
            <View className="absolute inset-0 items-center justify-center">
              <Pressable 
                onPress={() => {
                  if (isVideo) {
                    setIsVideoPlaying(prev => !prev);
                  } else {
                    setIsMusicPlaying(prev => !prev);
                  }
                }}
                className="w-16 h-16 bg-black/50 rounded-full items-center justify-center"
              >
                <Ionicons
                  name={(isVideo ? isVideoPlaying : isMusicPlaying) ? "pause" : "play"}
                  size={28}
                  color="white"
                  style={{ marginLeft: (isVideo ? isVideoPlaying : isMusicPlaying) ? 0 : 4 }}
                />
              </Pressable>
            </View>
            )}
            
            {/* Mute Button */}
            <View className="absolute bottom-4 right-4">
              <Pressable 
                onPress={() => setIsOriginalMuted(!isOriginalMuted)}
                className={`w-12 h-12 rounded-full items-center justify-center ${isOriginalMuted ? 'bg-[#98FF2F]' : 'bg-black/50'}`}
              >
                <Ionicons name={isOriginalMuted ? "volume-mute" : "volume-medium"} size={24} color={isOriginalMuted ? "black" : "white"} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Music Info */}
        <View className="items-center mt-6">
          <Text className="text-white font-inter-semibold text-lg">{isVideo ? 'Edit video & music' : title || 'Original Audio'}</Text>
          <Text className="text-[#888] font-inter-regular mt-1">{isVideo ? 'Choose Video Trim or Music Trim below' : 'Select sound from library'}</Text>
        </View>

        {/* Trimmer Section */}
        <View className="px-4 mt-8">
          {isVideo && (
            <View className="flex-row bg-[#222] rounded-xl p-1 mb-5">
              {(['video', 'music'] as const).map((target) => (
                <Pressable
                  key={target}
                  onPress={() => {
                    trimTargetRef.current = target;
                    setTrimTarget(target);
                  }}
                  className={`flex-1 py-2 rounded-lg items-center ${trimTarget === target ? 'bg-[#98FF2F]' : ''}`}
                >
                  <Text className={`font-inter-semibold ${trimTarget === target ? 'text-black' : 'text-white'}`}>
                    {target === 'video' ? 'Video Trim' : 'Music Trim'}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {isVideo && trimTarget === 'music' && soundUrl && (
            <Pressable
              onPress={() => setIsMusicPlaying(prev => !prev)}
              className="flex-row items-center self-start bg-black/50 rounded-full px-3 py-2 mb-4"
            >
              <Ionicons name={isMusicPlaying ? 'pause' : 'play'} size={16} color="#98FF2F" />
              <Text className="text-white font-inter-medium text-sm ml-2">
                {isMusicPlaying ? 'Pause music' : 'Play music'}
              </Text>
            </Pressable>
          )}

          <View className="flex-row justify-between mb-4">
            <Text className="text-white font-inter-medium">{formatTime(activeTrimLeft)} / {formatTime(activeTrimRight)}</Text>
            <Text className="text-white font-inter-medium">{trimTarget === 'video' ? 'VIDEO TRIM' : 'MUSIC TRIM'}</Text>
          </View>

          {isVideo && trimTarget === 'music' && (
            <Text className="text-[#888] font-inter-regular text-sm mb-3">
              Drag the green window to choose the part of the song that plays for {formatTime(100, selectedVideoDurationSec)}.
            </Text>
          )}
          
          {/* Mock Trim Timeline (Interactive) */}
          <View className="h-16 w-full flex-row rounded-lg overflow-hidden relative bg-[#222]">
            <Image 
              source={{ uri: mockImage }} 
              className="w-full h-full opacity-50 absolute inset-0"
              resizeMode="cover"
            />
            <View 
              className="absolute inset-y-0 border-4 border-[#98FF2F] bg-black/10 flex-row justify-between rounded-lg overflow-hidden"
              style={{ left: `${activeTrimLeft}%`, right: `${100 - activeTrimRight}%` }}
              {...(isVideo && trimTarget === 'music' ? musicWindowPan.panHandlers : {})}
            >
              {/* Left Handle */}
              {!(isVideo && trimTarget === 'music') && (
                <View 
                  {...leftPan.panHandlers}
                  className="w-7 h-full bg-[#98FF2F] items-center justify-center absolute left-[-1px] z-10 rounded-l-lg"
                >
                  <View className="w-0.5 h-4 bg-black rounded-full" />
                </View>
              )}
              
              {/* Right Handle */}
              {isVideo && trimTarget === 'music' ? (
                <>
                  <View className="w-7 h-full bg-[#98FF2F] items-center justify-center absolute left-[-1px] z-10 rounded-l-lg">
                    <View className="w-0.5 h-4 bg-black rounded-full" />
                  </View>
                  <View className="w-7 h-full bg-[#98FF2F] items-center justify-center absolute right-[-1px] z-10 rounded-r-lg">
                    <View className="w-0.5 h-4 bg-black rounded-full" />
                  </View>
                  <View className="absolute inset-0 items-center justify-center pointer-events-none">
                    <Ionicons name="move" size={18} color="black" />
                  </View>
                </>
              ) : (
                <View 
                  {...rightPan.panHandlers}
                  className="w-7 h-full bg-[#98FF2F] items-center justify-center absolute right-[-1px] z-10 rounded-r-lg"
                >
                  <View className="w-0.5 h-4 bg-black rounded-full" />
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Volume Sliders */}
        <View className="px-4 mt-8 gap-4">
          <CustomSlider 
            label="Original Sound" 
            value={originalVolume} 
            onValueChange={setOriginalVolume} 
          />
          <CustomSlider 
            label="Added Music" 
            value={addedVolume} 
            onValueChange={setAddedVolume} 
          />
        </View>
      </ScrollView>

    </View>
  );
}
