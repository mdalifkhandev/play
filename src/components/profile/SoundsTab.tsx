import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, Image as RNImage, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSavedTracks, toggleSavedTrack } from '../../api/music/music.api';
import type { MusicTrack } from '../../api/music/music.types';
import { createAudioPlayer } from 'expo-audio';
import { useRouter } from 'expo-router';

const formatDuration = (seconds: number) => {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.round(seconds)) : 0;
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export function SoundsTab() {
  const router = useRouter();
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Audio state
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const activePlayerRef = useRef<any>(null);
  const lastTapRef = useRef<number>(0);

  const stopActivePlayer = useCallback(() => {
    const player = activePlayerRef.current;
    activePlayerRef.current = null;
    if (!player) return;
    try { player.pause(); } catch (e) { }
    try { player.release(); } catch (e) { }
  }, []);

  useEffect(() => {
    return () => {
      stopActivePlayer();
    };
  }, [stopActivePlayer]);

  const loadTracks = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getSavedTracks({ limit: 50 });
      if (data && data.tracks) {
        setTracks(data.tracks as MusicTrack[]);
      }
    } catch (e) {
      console.log('Failed to load saved tracks', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTracks();
  }, [loadTracks]);

  const handleTogglePlay = (track: MusicTrack) => {
    const now = Date.now();
    if (now - lastTapRef.current < 350) return;
    lastTapRef.current = now;

    if (playingId === track.providerTrackId || loadingId === track.providerTrackId) {
      stopActivePlayer();
      setPlayingId(null);
      setLoadingId(null);
      return;
    }

    stopActivePlayer();
    setLoadingId(track.providerTrackId);
    setPlayingId(null);

    try {
      const newSound = createAudioPlayer(track.audioPreviewUrl);
      newSound.play();
      activePlayerRef.current = newSound;

      newSound.addListener('playbackStatusUpdate', (status: any) => {
        if (activePlayerRef.current !== newSound) return;

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
    router.push({
      pathname: '/(tab)/create' as any,
      params: {
        soundUrl: track.audioPreviewUrl,
        musicId: track.providerTrackId,
        title: track.title,
        musicArtist: track.artistName,
        musicCoverUrl: track.coverImageUrl || '',
        soundDuration: String(track.durationSeconds),
      }
    });
  };

  const handleUnsave = async (track: MusicTrack) => {
    // Optimistic remove
    setTracks(prev => prev.filter(t => t.providerTrackId !== track.providerTrackId));
    try {
      await toggleSavedTrack({
        providerTrackId: track.providerTrackId,
        title: track.title,
        artistName: track.artistName,
        coverImageUrl: track.coverImageUrl,
        audioPreviewUrl: track.audioPreviewUrl,
        durationSeconds: track.durationSeconds,
      });
    } catch (e) {
      // Revert if error
      setTracks(prev => [track, ...prev]);
    }
  };

  if (isLoading) {
    return (
      <View className="py-10 items-center justify-center">
        <ActivityIndicator size="small" color="#98FF2F" />
      </View>
    );
  }

  if (tracks.length === 0) {
    return (
      <View className="py-10 items-center justify-center">
        <Ionicons name="bookmark-outline" size={34} color="#888" />
        <Text className="text-[#888] font-semibold text-sm mt-3 text-center">No saved music found</Text>
      </View>
    );
  }

  return (
    <View className="mt-4 px-4 pb-10">
      {tracks.map((item) => {
        const isThisPlaying = playingId === item.providerTrackId;
        const isThisLoading = loadingId === item.providerTrackId;

        return (
          <Pressable key={item.providerTrackId} onPress={() => handleUse(item)} className="flex-row items-center justify-between mb-4 bg-[#1A1A1A] p-2 rounded-xl border border-[#333]">
            <View className="flex-row items-center flex-1">
              <Pressable onPress={() => handleTogglePlay(item)} className="w-[50px] h-[50px] rounded-lg bg-[#222] mr-3 overflow-hidden relative">
                {item.coverImageUrl ? (
                  <RNImage source={{ uri: item.coverImageUrl }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Ionicons name="musical-notes" size={20} color="#98FF2F" />
                  </View>
                )}
                
                {isThisLoading ? (
                  <View className="absolute inset-0 items-center justify-center bg-black/60">
                    <ActivityIndicator size="small" color="#98FF2F" />
                  </View>
                ) : (
                  <View className="absolute inset-0 items-center justify-center bg-black/40">
                    <Ionicons name={isThisPlaying ? "pause" : "play"} size={20} color="#FFF" />
                  </View>
                )}
              </Pressable>
              
              <View className="flex-1 mr-2 pointer-events-none">
                <Text className="text-white text-[15px] font-semibold mb-0.5" numberOfLines={1}>{item.title}</Text>
                <Text className="text-[#888] text-[12px] font-medium" numberOfLines={1}>{item.artistName} • {formatDuration(item.durationSeconds)}</Text>
              </View>
            </View>
            
            <View className="flex-row items-center">
              <Pressable onPress={(e) => { e.stopPropagation(); handleUnsave(item); }} className="p-2 mr-1">
                <Ionicons name="bookmark" size={22} color="#98FF2F" />
              </Pressable>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
