import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { createAudioPlayer } from 'expo-audio';
import { getReelStatus } from '../../../api/reels/reels.api';
import type { ReelStatusResult } from '../../../api/reels/reels.types';

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
    return Number(duration);
  }

  const parts = duration.split(':').map(Number);
  if (parts.length === 2 && parts.every(Number.isFinite)) {
    return parts[0] * 60 + parts[1];
  }

  return DEFAULT_AUDIO_DURATION_SEC;
};

export default function PostSuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    uri, mediaType, overlayText, soundUrl, title, soundDuration, musicId, musicArtist, musicCoverUrl,
    originalVolume, addedVolume, trimLeft, trimRight, videoTrimLeft, videoTrimRight,
    videoTrimStart, videoTrimEnd, videoDuration,
    exposure: expParam, contrast: contParam, activeFilter, activeEffect,
    reelId, reelStatus, reelProgress
  } = useLocalSearchParams<{
    uri: string; mediaType?: 'photo' | 'video'; overlayText: string; soundUrl: string; title: string; soundDuration?: string;
    musicId?: string; musicArtist?: string; musicCoverUrl?: string;
    originalVolume: string; addedVolume: string; trimLeft: string; trimRight: string;
    videoTrimLeft?: string; videoTrimRight?: string;
    videoTrimStart?: string; videoTrimEnd?: string; videoDuration?: string;
    exposure: string; contrast: string; activeFilter: string; activeEffect: string;
    reelId?: string; reelStatus?: string; reelProgress?: string;
  }>();

  const exposure = expParam ? parseInt(expParam) : 50;

  const mockImage = uri || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800';
  const [reel, setReel] = useState<ReelStatusResult | null>(
    reelId
      ? {
          id: reelId,
          status: (reelStatus as ReelStatusResult['status']) || 'queued',
          progress: reelProgress ? Number(reelProgress) : 0,
        }
      : null,
  );
  const [statusError, setStatusError] = useState('');
  const isReelProcessing = reel?.status === 'queued' || reel?.status === 'processing';

  // Audio Player for final preview
  const [sound, setSound] = useState<any>(null);
  const audioDurationSec = parseDurationSeconds(soundDuration, title);

  const getTrimTime = (percentStr?: string, fallbackPercent = 0) => {
    const percent = percentStr !== undefined && percentStr !== '' ? Number(percentStr) : fallbackPercent;
    return Math.floor((percent / 100) * audioDurationSec * 1000) / 1000;
  };

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
      let isReady = false;
      if (soundUrl) {
        try {
          const source = /^\d+$/.test(soundUrl) ? parseInt(soundUrl, 10) : soundUrl;
          player = createAudioPlayer(source);
          
          player.addListener('playbackStatusUpdate', (status: any) => {
            if (status.isLoaded) isReady = true;
          });

          seekSound(player, getTrimTime(trimLeft));
          player.play();
          setTimeout(() => seekSound(player, getTrimTime(trimLeft)), 100);
          player.loop = true;
          setSound(player);
        } catch (error) {
          console.log("Post success audio error:", error);
        }
      }
      return () => {
        if (player) {
          if (!isReady) {
            setTimeout(() => {
              try { player.pause(); } catch (e) {}
              try { player.remove(); } catch (e) {
                try { player.release(); } catch (e2) {}
              }
            }, 1000);
          } else {
            try { player.pause(); } catch (e) {}
            try { player.remove(); } catch (e) {
              try { player.release(); } catch (e2) {}
            }
          }
        }
        setSound(null);
      };
    }, [soundUrl])
  );

  useEffect(() => {
    if (sound) {
      if (addedVolume !== undefined) {
        sound.volume = Number(addedVolume) / 100;
      }
      seekSound(sound, getTrimTime(trimLeft));
    }
  }, [sound, addedVolume, trimLeft]);

  useEffect(() => {
    if (!sound) return;

    const watcher = setInterval(() => {
      const currentTime = Number(sound.currentTime ?? 0);
      const trimStartSec = getTrimTime(trimLeft);
      const trimEndSec = getTrimTime(trimRight, 100);

      if (currentTime >= trimEndSec || currentTime < trimStartSec - 0.25) {
        seekSound(sound, trimStartSec);
        try { sound.play(); } catch (e) { }
      }
    }, 200);

    return () => clearInterval(watcher);
  }, [audioDurationSec, sound, trimLeft, trimRight]);

  useEffect(() => {
    if (!reelId) return;
    let isMounted = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      try {
        const latest = await getReelStatus(reelId);
        if (!isMounted) return;
        setReel(latest);
        setStatusError('');

        if (latest.status === 'queued' || latest.status === 'processing') {
          timer = setTimeout(poll, 3000);
        }
      } catch (error: any) {
        if (!isMounted) return;
        setStatusError(error?.response?.data?.error?.message || error?.message || 'Could not check reel status.');
        timer = setTimeout(poll, 5000);
      }
    };

    poll();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [reelId]);

  const handleDone = () => {
    // Reset back to home or camera
    router.dismissAll();
    router.replace('/(tab)/home' as any);
  };

  return (
    <View
      className="flex-1 bg-[#0A0A0A]"
      style={{
        paddingTop: insets.top,
        paddingBottom: Math.max(insets.bottom + 40, 32)
      }}
    >

      <ScrollView 
        className="flex-1 px-6"
        contentContainerStyle={{ alignItems: 'center', justifyContent: 'center', flexGrow: 1, paddingVertical: 20 }}
        showsVerticalScrollIndicator={false}
      >

        {/* Success Icon */}
        <View className="w-24 h-24 bg-[#98FF2F] rounded-full items-center justify-center mb-6">
          {isReelProcessing ? (
            <ActivityIndicator size="large" color="black" />
          ) : reel?.status === 'failed' ? (
            <Ionicons name="alert" size={56} color="black" />
          ) : (
            <Ionicons name="checkmark-sharp" size={64} color="black" />
          )}
        </View>

        <Text className="text-white font-inter-bold text-2xl mb-2 text-center">
          {isReelProcessing
            ? 'Your reel is processing'
            : reel?.status === 'failed'
              ? 'Reel processing failed'
              : 'Your Post is now live!'}
        </Text>

        <Text className="text-[#888] font-inter-regular text-center mb-8 px-4">
          {isReelProcessing
            ? 'Backend is creating the final video with your music and edits.'
            : reel?.status === 'failed'
              ? reel.error?.message || 'Please try posting again.'
              : 'Shared with your community and the explore feed.'}
        </Text>

        {reelId && (
          <View className="w-full bg-[#171717] rounded-2xl p-4 mb-6 border border-[#2A2A2A]">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white font-inter-semibold text-base">Reel status</Text>
              <Text className="text-[#98FF2F] font-inter-semibold capitalize">{reel?.status || 'queued'}</Text>
            </View>
            <View className="h-2 bg-white/20 rounded-full overflow-hidden mb-2">
              <View className="h-full bg-[#98FF2F]" style={{ width: `${Math.max(0, Math.min(100, reel?.progress ?? 0))}%` }} />
            </View>
            <Text className="text-[#888] font-inter-regular text-xs">
              {statusError || `${Math.max(0, Math.min(100, reel?.progress ?? 0))}% complete`}
            </Text>
          </View>
        )}

        {/* Thumbnail Preview */}
        <View className="w-full aspect-[3/4] max-h-[400px] rounded-[32px] overflow-hidden mb-8 bg-[#111] relative">
          <Image
            source={{ uri: mockImage }}
            className="w-full h-full absolute inset-0"
            contentFit="cover"
            style={{
              transform: activeEffect === 'Zoom' ? [{ scale: 1.15 }] : [{ scale: 1 }]
            }}
          />

          {/* Simulate Glitch Effect */}
          {activeEffect === 'Glitch' && (
            <>
              <View className="absolute inset-0 bg-red-500/20" style={{ transform: [{ translateX: -3 }] }} pointerEvents="none" />
              <View className="absolute inset-0 bg-blue-500/20" style={{ transform: [{ translateX: 3 }] }} pointerEvents="none" />
            </>
          )}

          {/* Simulate Flash Effect */}
          {activeEffect === 'Flash' && (
            <View className="absolute inset-0 bg-white/40" pointerEvents="none" />
          )}

          {/* Simulate VHS Effect */}
          {activeEffect === 'VHS' && (
            <View className="absolute inset-0 bg-green-500/10 border-t-[3px] border-black/20" pointerEvents="none" style={{ top: 0, bottom: 0 }} />
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
          {activeFilter && activeFilter !== 'Normal' && (
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

          {overlayText && (
            <View className="absolute inset-0 items-center justify-center z-20 pointer-events-none">
              <Text className="text-white font-inter-bold text-3xl text-center px-4" style={{ textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: -2, height: 2 }, textShadowRadius: 8 }}>
                {overlayText}
              </Text>
            </View>
          )}

          {/* Mock Music Sticker if sound exists */}
          {soundUrl && title && (
            <View className="absolute top-1/4 self-center bg-black/60 px-4 py-2 rounded-full flex-row items-center z-20 pointer-events-none">
              <Ionicons name="musical-notes" size={16} color="white" />
              <Text className="text-white font-inter-medium text-sm ml-2" numberOfLines={1}>{title}</Text>
            </View>
          )}
        </View>

        <View className="w-full bg-[#171717] rounded-2xl p-4 mb-6 border border-[#2A2A2A]">
          <Text className="text-white font-inter-semibold text-base mb-3">Posted Audio</Text>
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[#BBB] font-inter-regular">Original sound</Text>
            <Text className="text-[#98FF2F] font-inter-semibold">{originalVolume || '100'}%</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-[#BBB] font-inter-regular">Added music</Text>
            <Text className="text-[#98FF2F] font-inter-semibold">{soundUrl ? `${addedVolume || '100'}%` : 'Off'}</Text>
          </View>
          {mediaType === 'video' && (
            <Text className="text-[#888] font-inter-regular text-xs mt-3">
              Video trim: {videoTrimStart && videoTrimEnd ? `${videoTrimStart}s - ${videoTrimEnd}s` : `${videoTrimLeft || '0'}% - ${videoTrimRight || '100'}%`}
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        <View className="w-full gap-4 mt-auto pt-4">
          <Pressable
            onPress={handleDone}
            className="w-full py-4 rounded-xl bg-[#98FF2F] items-center"
          >
            <Text className="text-black font-inter-semibold text-base">Done</Text>
          </Pressable>

          <Pressable
            className="w-full py-4 rounded-xl bg-[#2A2A2A] items-center flex-row justify-center"
          >
            <Ionicons name="share-outline" size={20} color="white" className="mr-2" />
            <Text className="text-white font-inter-semibold text-base ml-2">Share</Text>
          </Pressable>
        </View>

      </ScrollView>

    </View>
  );
}
