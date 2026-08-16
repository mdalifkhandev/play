import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { createAudioPlayer } from 'expo-audio';
import { SearchIcon } from '../../../components/icons/SearchIcon';
import { useLocalSearchParams } from 'expo-router';
import { useMusicSearch } from '../../../hooks/music/useMusicSearch';
import { toggleSavedTrack, getSavedTracks } from '../../../api/music/music.api';
import type { MusicTrack } from '../../../api/music/music.types';

const formatDuration = (seconds: number) => {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.round(seconds)) : 0;
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export default function SoundScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    returnTo,
    uri,
    mediaType,
    originalVolume,
    addedVolume,
    trimLeft,
    trimRight,
    videoTrimLeft,
    videoTrimRight,
    videoTrimStart,
    videoTrimEnd,
    videoDuration,
    overlayText,
    textOffsetX,
    textOffsetY,
    musicOffsetX,
    musicOffsetY,
    showMusicCard,
    exposure,
    contrast,
    activeFilter,
    activeEffect
  } = useLocalSearchParams<{
    returnTo?: string;
    uri?: string;
    mediaType?: 'photo' | 'video';
    originalVolume?: string;
    addedVolume?: string;
    trimLeft?: string;
    trimRight?: string;
    videoTrimLeft?: string;
    videoTrimRight?: string;
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

  const [activeTab, setActiveTab] = useState('Trending');
  const {
    tracks,
    searchQuery,
    setSearchQuery,
    isLoading: isLoadingTracks,
    isLoadingMore,
    hasNextPage,
    error: loadError,
    loadMore,
    retry,
  } = useMusicSearch(activeTab, '');


  // Audio state
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Saved Tracks state
  const [savedTracks, setSavedTracks] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load saved tracks on mount
    getSavedTracks({ limit: 50 }).then(data => {
      if (data && data.tracks) {
        setSavedTracks(new Set(data.tracks.map(t => t.providerTrackId)));
      }
    }).catch(e => console.log('Failed to load saved tracks', e));
  }, []);

  const handleSave = async (track: MusicTrack) => {
    // Optimistic update
    setSavedTracks(prev => {
      const next = new Set(prev);
      if (next.has(track.providerTrackId)) {
        next.delete(track.providerTrackId);
      } else {
        next.add(track.providerTrackId);
      }
      return next;
    });

    try {
      const result = await toggleSavedTrack({
        providerTrackId: track.providerTrackId,
        title: track.title,
        artistName: track.artistName,
        coverImageUrl: track.coverImageUrl,
        audioPreviewUrl: track.audioPreviewUrl,
        durationSeconds: track.durationSeconds,
      });
      // Revert if the result doesn't match our optimistic update
      setSavedTracks(prev => {
        const next = new Set(prev);
        if (result.saved) {
          next.add(track.providerTrackId);
        } else {
          next.delete(track.providerTrackId);
        }
        return next;
      });
    } catch (e) {
      console.log('Failed to toggle save track', e);
      // Revert on error
      setSavedTracks(prev => {
        const next = new Set(prev);
        if (next.has(track.providerTrackId)) {
          next.delete(track.providerTrackId);
        } else {
          next.add(track.providerTrackId);
        }
        return next;
      });
    }
  };

  // Use a ref to strictly track the active player and prevent overlapping sounds
  const activePlayerRef = useRef<any>(null);
  const isPlayerReadyRef = useRef<boolean>(false);
  const lastTapRef = useRef<number>(0);

  const stopActivePlayer = useCallback(() => {
    const player = activePlayerRef.current;

    activePlayerRef.current = null;
    isPlayerReadyRef.current = false;

    if (!player) return;

    try { player.pause(); } catch (e) { }
    try { player.release(); } catch (e) { }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopActivePlayer();
    };
  }, [stopActivePlayer]);

  const handleTogglePlay = (track: MusicTrack) => {
    const now = Date.now();
    if (now - lastTapRef.current < 350) return; // Debounce rapid taps
    lastTapRef.current = now;

    // If clicking the currently playing/loading track, stop it
    if (playingId === track.providerTrackId || loadingId === track.providerTrackId) {
      stopActivePlayer();
      setPlayingId(null);
      setLoadingId(null);
      return;
    }

    // Stop current track if switching
    stopActivePlayer();
    setLoadingId(track.providerTrackId);
    setPlayingId(null);

    try {
      const newSound = createAudioPlayer(track.audioPreviewUrl);
      newSound.play();
      activePlayerRef.current = newSound;
      isPlayerReadyRef.current = false;

      newSound.addListener('playbackStatusUpdate', (status: any) => {
        if (activePlayerRef.current !== newSound) return;

        if (status.isLoaded) {
          isPlayerReadyRef.current = true;
        }
        if (status.error) {
          console.log('Audio playback error:', status.error);
          setLoadingId(null);
          setPlayingId(null);
        }
        if (status.isLoaded && status.playing) {
          setLoadingId(null);
          setPlayingId(track.providerTrackId);
        }
        if (status.didJustFinish) {
          setPlayingId(null);
        }
      });
    } catch (e) {
      console.log('Error playing sound', e);
      setLoadingId(null);
      setPlayingId(null);
    }
  };

  const handleUse = (track: MusicTrack) => {
    stopActivePlayer();

    const targetPath = returnTo || '/(tab)/create';

    router.push({
      pathname: targetPath as any,
      params: {
        soundUrl: track.audioPreviewUrl,
        musicId: track.providerTrackId,
        title: track.title,
        musicArtist: track.artistName,
        musicCoverUrl: track.coverImageUrl || '',
        soundDuration: String(track.durationSeconds),
        ...(uri ? { uri } : {}),
        ...(mediaType ? { mediaType } : {}),
        ...(originalVolume ? { originalVolume } : {}),
        ...(addedVolume ? { addedVolume } : {}),
        trimLeft: '0',
        trimRight: '100',
        ...(videoTrimLeft ? { videoTrimLeft } : {}),
        ...(videoTrimRight ? { videoTrimRight } : {}),
        ...(videoTrimStart ? { videoTrimStart } : {}),
        ...(videoTrimEnd ? { videoTrimEnd } : {}),
        ...(videoDuration ? { videoDuration } : {}),
        ...(overlayText ? { overlayText } : {}),
        ...(textOffsetX ? { textOffsetX } : {}),
        ...(textOffsetY ? { textOffsetY } : {}),
        ...(musicOffsetX ? { musicOffsetX } : {}),
        ...(musicOffsetY ? { musicOffsetY } : {}),
        ...(showMusicCard ? { showMusicCard } : {}),
        ...(exposure ? { exposure } : {}),
        ...(contrast ? { contrast } : {}),
        ...(activeFilter ? { activeFilter } : {}),
        ...(activeEffect ? { activeEffect } : {})
      }
    });
  };

  return (
    <View className="flex-1 bg-[#121212]" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => {
          stopActivePlayer();
          router.back();
        }} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text className="flex-1 text-center text-white font-inter-semibold text-[17px] mr-6">
          Select Audio
        </Text>
      </View>

      {/* Search Bar */}
      <View className="flex-row items-center px-4 mb-2 mt-2 gap-3">
        <View className="flex-1 flex-row items-center bg-[#2A2A2A] rounded-full px-4 py-2">
          <SearchIcon width={20} height={20} />
          <TextInput
            className="flex-1 ml-2 text-white text-base font-inter-regular p-0 h-8"
            placeholder="GO"
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <Pressable>
          <Ionicons name="ellipsis-horizontal" size={24} color="#888" />
        </Pressable>
      </View>

      {/* Tabs */}
      <View className="flex-row px-4 border-b border-[#333] mb-4 gap-6">
        {['Trending', 'Mood', 'Genre'].map(tab => (
          <Pressable key={tab} onPress={() => setActiveTab(tab)} className={`pb-3 border-b-2 ${activeTab === tab ? 'border-[#98D83A]' : 'border-transparent'}`}>
            <Text className={`font-inter-semibold text-[15px] ${activeTab === tab ? 'text-white' : 'text-[#888]'}`}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* List */}
      <ScrollView className="flex-1 px-4">
        {isLoadingTracks && (
          <View className="items-center justify-center py-10">
            <ActivityIndicator size="large" color="#98FF2F" />
            <Text className="text-[#888] font-inter-medium mt-3">Loading music...</Text>
          </View>
        )}

        {!isLoadingTracks && loadError ? (
          <View className="items-center justify-center py-10 px-4">
            <Ionicons name="warning-outline" size={34} color="#98FF2F" />
            <Text className="text-white font-inter-semibold text-base mt-3 text-center">{loadError}</Text>
            <Pressable onPress={retry} className="border border-[#98D83A] rounded-lg px-5 py-2 mt-4">
              <Text className="text-[#98D83A] font-inter-semibold">Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {!isLoadingTracks && !loadError && tracks.length === 0 ? (
          <View className="items-center justify-center py-10 px-4">
            <Ionicons name="musical-notes-outline" size={34} color="#98FF2F" />
            <Text className="text-white font-inter-semibold text-base mt-3 text-center">No downloadable music found</Text>
          </View>
        ) : null}

        {!isLoadingTracks && tracks.map(track => {
          const isThisPlaying = playingId === track.providerTrackId;
          const isThisLoading = loadingId === track.providerTrackId;

          const isSaved = savedTracks.has(track.providerTrackId);

          return (
            // @ts-ignore - React Native View accepts key, but @types/react is mismatched
            <Pressable key={track.providerTrackId} onPress={() => handleUse(track)} className="flex-row items-center bg-[#1A1A1A] rounded-xl p-2.5 mb-3 border border-[#333]">
              <Pressable onPress={() => handleTogglePlay(track)} className="relative">
                <View className="w-[60px] h-[60px] rounded-lg bg-[#333] items-center justify-center relative overflow-hidden">
                  {track.coverImageUrl ? (
                    <Image source={{ uri: track.coverImageUrl }} className="absolute inset-0 w-full h-full" contentFit="cover" />
                  ) : (
                    <Ionicons name="musical-notes" size={28} color="#98FF2F" />
                  )}

                  {isThisLoading ? (
                    <View className="absolute inset-0 bg-black/60 items-center justify-center">
                      <ActivityIndicator size="small" color="#98FF2F" />
                    </View>
                  ) : (
                    <View className="absolute inset-0 bg-black/40 items-center justify-center">
                      <Ionicons name={isThisPlaying ? "pause" : "play"} size={24} color="#98FF2F" />
                    </View>
                  )}
                </View>
              </Pressable>

              <View className="flex-1 ml-3 pointer-events-none">
                <Text className="text-white font-inter-medium text-[16px] mb-0.5">{track.title}</Text>
                <Text className="text-[#888] font-inter-regular text-[13px]">
                  {track.artistName} • {formatDuration(track.durationSeconds)}
                </Text>
              </View>

              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  handleSave(track);
                }}
                className="p-2 ml-2"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={24} color={isSaved ? "#98D83A" : "#888"} />
              </Pressable>
            </Pressable>
          );
        })}
        {!isLoadingTracks && hasNextPage && (
          <Pressable
            onPress={loadMore}
            disabled={isLoadingMore}
            className="border border-[#98D83A] rounded-lg py-3 items-center mb-3"
          >
            {isLoadingMore ? (
              <ActivityIndicator size="small" color="#98FF2F" />
            ) : (
              <Text className="text-[#98D83A] font-inter-semibold">Load more</Text>
            )}
          </Pressable>
        )}
        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
