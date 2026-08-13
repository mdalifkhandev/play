import { useState, useCallback, useRef, useEffect } from 'react';
import { searchMusicTracks } from '../../api/music/music.api';
import type { MusicTrack } from '../../api/music/music.types';
import { handleApiError } from '../../api/client';

const MUSIC_PAGE_SIZE = 8;
const musicSearchCache = new Map<string, {
  tracks: MusicTrack[];
  page: number;
  hasNextPage: boolean;
}>();

export function useMusicSearch(activeTab: string, initialQuery: string = '') {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastRequestRef = useRef('');

  const fetchTracks = useCallback(async (nextPage = 1, query = searchQuery) => {
    const normalizedQuery = query.trim().toLowerCase();
    const cacheKey = `${activeTab}:${normalizedQuery}`;
    const requestKey = `${cacheKey}:${nextPage}`;
    
    if (nextPage === 1) {
      const cached = musicSearchCache.get(cacheKey);
      if (cached) {
        setTracks(cached.tracks);
        setPage(cached.page);
        setHasNextPage(cached.hasNextPage);
        setError(null);
        return;
      }
    }

    // Prevent duplicate concurrent requests
    if (nextPage === 1 && lastRequestRef.current === requestKey && (isLoading || error)) {
      return;
    }
    lastRequestRef.current = requestKey;

    const isFirstPage = nextPage === 1;
    setError(null);
    isFirstPage ? setIsLoading(true) : setIsLoadingMore(true);

    try {
      const result = await searchMusicTracks({
        search: query,
        page: nextPage,
        limit: MUSIC_PAGE_SIZE,
        order: activeTab === 'Trending' ? 'popularity_total' : activeTab === 'Mood' ? 'popularity_week' : 'releasedate',
      });
      
      const playableTracks = result.tracks.filter(track => track.downloadAllowed);
      
      const nextTracks = isFirstPage ? playableTracks : [...tracks, ...playableTracks];
      setTracks(nextTracks);
      setPage(result.pagination.page);
      setHasNextPage(result.pagination.hasNextPage);
      musicSearchCache.set(cacheKey, {
        tracks: nextTracks,
        page: result.pagination.page,
        hasNextPage: result.pagination.hasNextPage,
      });
    } catch (err: any) {
      console.log('Music fetch error:', err);
      const message = handleApiError(err, 'Could not load music.');
      setError(
        err?.response?.status === 502
          ? 'Music provider is unavailable. Check backend JAMENDO_CLIENT_ID or try again later.'
          : message,
      );
      if (isFirstPage) {
        setTracks([]);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [activeTab, isLoading, error, searchQuery, tracks]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTracks(1, searchQuery);
    }, 350);

    return () => clearTimeout(timer);
  }, [activeTab, searchQuery]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && !isLoading && hasNextPage) {
      fetchTracks(page + 1, searchQuery);
    }
  }, [isLoadingMore, isLoading, hasNextPage, fetchTracks, page, searchQuery]);

  const retry = useCallback(() => {
    fetchTracks(1, searchQuery);
  }, [fetchTracks, searchQuery]);

  return {
    tracks,
    searchQuery,
    setSearchQuery,
    isLoading,
    isLoadingMore,
    hasNextPage,
    error,
    loadMore,
    retry,
  };
}
