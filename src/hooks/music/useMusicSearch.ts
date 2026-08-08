import { useState, useCallback, useRef, useEffect } from 'react';
import { searchMusicTracks } from '../../api/music/music.api';
import type { MusicTrack } from '../../api/music/music.types';
import { handleApiError } from '../../api/client';

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
    const requestKey = `${activeTab}:${query.trim().toLowerCase()}:${nextPage}`;
    
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
        limit: 20,
        order: activeTab === 'Trending' ? 'popularity_total' : activeTab === 'Mood' ? 'popularity_week' : 'releasedate',
      });
      
      const playableTracks = result.tracks.filter(track => track.downloadAllowed);
      
      setTracks(prev => isFirstPage ? playableTracks : [...prev, ...playableTracks]);
      setPage(result.pagination.page);
      setHasNextPage(result.pagination.hasNextPage);
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
  }, [activeTab, isLoading, error, searchQuery]);

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
