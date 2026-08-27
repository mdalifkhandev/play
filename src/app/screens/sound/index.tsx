import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { handleApiError } from '../../../api/client';
import { searchMusicTracks } from '../../../api/music/music.api';
import type { MusicTrack } from '../../../api/music/music.types';
import { createRemoteAudioSource, normalizeRemoteAudioUrl, REMOTE_AUDIO_PLAYER_OPTIONS } from '../../../utils/audioSource';

const PAGE_SIZE = 30;

export default function SoundScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sound, setSound] = useState<AudioPlayer | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const activePlayerRef = useRef<AudioPlayer | null>(null);
  const isPlayerReadyRef = useRef(false);
  const lastTapRef = useRef(0);
  const requestKeyRef = useRef('');

  const stopActivePlayer = useCallback(() => {
    const player = activePlayerRef.current;
    const isReady = isPlayerReadyRef.current;

    activePlayerRef.current = null;
    isPlayerReadyRef.current = false;

    if (!player) return;

    const releasePlayer = () => {
      try { player.pause(); } catch {}
      try { player.remove(); } catch {
        try { player.release(); } catch {}
      }
    };

    if (!isReady) {
      setTimeout(releasePlayer, 700);
      return;
    }

    releasePlayer();
  }, []);

  const loadTracks = useCallback(async (nextPage = 1, nextQuery = query, mode: 'initial' | 'refresh' | 'more' = 'initial') => {
    const requestKey = `${nextQuery.trim().toLowerCase()}:${nextPage}:${mode}`;
    if (requestKeyRef.current === requestKey && (isLoading || isRefreshing || isLoadingMore)) return;
    requestKeyRef.current = requestKey;

    setError(null);
    if (mode === 'refresh') setIsRefreshing(true);
    else if (mode === 'more') setIsLoadingMore(true);
    else setIsLoading(true);

    try {
      const result = await searchMusicTracks({
        search: nextQuery,
        page: nextPage,
        limit: PAGE_SIZE,
        order: nextQuery.trim() ? 'popularity_total' : 'popularity_week',
      });

      const playableTracks = result.tracks
        .map((track) => ({ ...track, audioPreviewUrl: normalizeRemoteAudioUrl(track.audioPreviewUrl) }))
        .filter((track) => Boolean(track.audioPreviewUrl));
      console.log('Music tracks loaded:', {
        query: nextQuery || 'popular',
        page: nextPage,
        received: result.tracks.length,
        playable: playableTracks.length,
        hasNextPage: result.pagination.hasNextPage,
      });
      setTracks((current) => nextPage === 1 ? playableTracks : [...current, ...playableTracks]);
      setPage(result.pagination.page);
      setHasNextPage(result.pagination.hasNextPage);
    } catch (err: any) {
      console.log('Failed to load sounds:', err);
      const status = err?.response?.status;
      const code = err?.response?.data?.error?.code;
      const message = code === 'MUSIC_PROVIDER_NOT_CONFIGURED' || status === 503
        ? 'Music provider is not configured. Set JAMENDO_CLIENT_ID in backend .env.'
        : handleApiError(err, 'Could not load sounds.');
      setError(message);
      if (nextPage === 1) setTracks([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [isLoading, isLoadingMore, isRefreshing, query]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTracks(1, query, 'initial');
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    return () => {
      stopActivePlayer();
    };
  }, [stopActivePlayer]);

  const toggleSound = (item: MusicTrack) => {
    const now = Date.now();
    if (now - lastTapRef.current < 350) return;
    lastTapRef.current = now;

    if (playingId === item.providerTrackId || loadingId === item.providerTrackId) {
      stopActivePlayer();
      setPlayingId(null);
      setLoadingId(null);
      setSound(null);
      return;
    }

    stopActivePlayer();
    setSound(null);
    setLoadingId(item.providerTrackId);
    setPlayingId(null);

    try {
      const audioSource = createRemoteAudioSource(item.audioPreviewUrl);
      if (!audioSource) {
        throw new Error('Audio preview URL is missing.');
      }
      const newSound = createAudioPlayer(audioSource, REMOTE_AUDIO_PLAYER_OPTIONS);
      activePlayerRef.current = newSound;
      isPlayerReadyRef.current = false;
      newSound.play();
      setSound(newSound);

      newSound.addListener('playbackStatusUpdate', (status) => {
        if (activePlayerRef.current !== newSound) return;
        if (status.error) {
          console.log('Audio playback error:', {
            error: status.error,
            trackId: item.providerTrackId,
            title: item.title,
            audioPreviewUrl: item.audioPreviewUrl,
          });
          setLoadingId(null);
          setPlayingId(null);
        }
        if (status.isLoaded) isPlayerReadyRef.current = true;
        if (status.isLoaded && status.playing) {
          setLoadingId(null);
          setPlayingId(item.providerTrackId);
        }
        if (status.didJustFinish) setPlayingId(null);
      });
    } catch (err) {
      console.log('Error playing sound', err);
      setLoadingId(null);
    }
  };

  const handleSelectSound = (item: MusicTrack) => {
    stopActivePlayer();
    router.push({
      pathname: '/(tab)/create',
      params: {
        soundUrl: item.audioPreviewUrl,
        title: item.title,
        soundDuration: String(item.durationSeconds),
        musicId: item.providerTrackId,
        musicArtist: item.artistName,
        musicCoverUrl: item.coverImageUrl || '',
      },
    });
  };

  const refresh = () => {
    loadTracks(1, query, 'refresh');
  };

  const loadMore = () => {
    if (!hasNextPage || isLoadingMore || isLoading || isRefreshing) return;
    loadTracks(page + 1, query, 'more');
  };

  return (
    <View className="flex-1 bg-black">
      <View
        className="px-4 pb-4 border-b border-[#2A2A2A]"
        style={{ paddingTop: insets.top + 10 }}
      >
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </Pressable>
          <Text className="text-white text-lg font-bold">Sounds</Text>
        </View>

        <View className="mt-4 flex-row items-center rounded-xl bg-[#1C1C1E] px-3 h-11">
          <Ionicons name="search" size={18} color="#888" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search music"
            placeholderTextColor="#777"
            returnKeyType="search"
            className="ml-2 flex-1 text-white p-0"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color="#777" />
            </Pressable>
          )}
        </View>

        <View className="mt-3 flex-row items-center justify-between">
          <Text className="text-[#888] text-sm">
            {tracks.length > 0 ? `${tracks.length} sounds loaded` : 'No sounds loaded yet'}
          </Text>
          <Pressable
            onPress={refresh}
            disabled={isRefreshing || isLoading}
            className="flex-row items-center rounded-full border border-[#98FF2F]/40 px-3 py-1.5"
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color="#98FF2F" />
            ) : (
              <Ionicons name="refresh" size={15} color="#98FF2F" />
            )}
            <Text className="text-[#98FF2F] text-sm font-semibold ml-1.5">Refresh</Text>
          </Pressable>
        </View>
      </View>

      {isLoading && tracks.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#98FF2F" />
          <Text className="text-[#888] mt-3">Loading sounds...</Text>
        </View>
      ) : error && tracks.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="musical-notes-outline" size={46} color="#555" />
          <Text className="text-white font-semibold mt-4 text-center">Music could not be loaded</Text>
          <Text className="text-[#888] mt-2 text-center">{error}</Text>
          <Pressable onPress={refresh} className="mt-5 rounded-xl bg-[#98FF2F] px-6 py-3">
            <Text className="text-black font-bold">Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(item) => item.providerTrackId}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor="#98FF2F" />}
          contentContainerStyle={{ paddingBottom: 100 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={isLoadingMore ? <ActivityIndicator color="#98FF2F" className="my-5" /> : null}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Ionicons name="musical-notes-outline" size={42} color="#555" />
              <Text className="text-[#888] mt-3">No sounds found.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              className="flex-row items-center justify-between px-4 py-3 border-b border-[#1C1C1E]"
              onPress={() => handleSelectSound(item)}
            >
              <View className="flex-row items-center flex-1 pr-3">
                <View className="w-14 h-14 rounded-lg bg-[#2A2A2A] mr-3 items-center justify-center relative overflow-hidden">
                  {item.coverImageUrl ? (
                    <Image source={{ uri: item.coverImageUrl }} style={{ width: 56, height: 56 }} contentFit="cover" />
                  ) : (
                    <Ionicons name="musical-notes" size={24} color="#98FF2F" />
                  )}
                  {playingId === item.providerTrackId && (
                    <View className="absolute inset-0 bg-black/50 items-center justify-center">
                      <Ionicons name="stats-chart" size={20} color="#98FF2F" />
                    </View>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold text-base" numberOfLines={1}>{item.title}</Text>
                  <Text className="text-[#888] text-sm mt-1" numberOfLines={1}>{item.artistName}</Text>
                  <Text className="text-[#666] text-xs mt-0.5">{formatDuration(item.durationSeconds)}</Text>
                </View>
              </View>
              <Pressable
                className={`w-12 h-10 rounded-lg items-center justify-center ${playingId === item.providerTrackId ? 'bg-[#FF3B30]' : 'bg-[#98FF2F]'}`}
                onPress={() => toggleSound(item)}
              >
                {loadingId === item.providerTrackId ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Ionicons name={playingId === item.providerTrackId ? 'stop' : 'play'} size={20} color={playingId === item.providerTrackId ? '#FFF' : '#000'} />
                )}
              </Pressable>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

function formatDuration(seconds: number) {
  const safeSeconds = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}
