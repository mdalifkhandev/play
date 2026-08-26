import { useState, useEffect, useCallback, useRef } from 'react';

export type FeedSectionPage<T> = {
  items: T[];
  nextCursor?: string | null;
};

export function useFeedSection<T extends { id: string }>(fetcher: (cursor?: string) => Promise<FeedSectionPage<T>>) {
  const [data, setData] = useState<T[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);
  const nextCursorRef = useRef<string | null>(null);
  const lastLoggedErrorRef = useRef<string | null>(null);

  const fetchData = useCallback(async (mode: 'initial' | 'refresh' | 'more' = 'initial') => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const cursor = mode === 'more' ? nextCursorRef.current || undefined : undefined;

    if (mode === 'more' && !cursor) {
      return;
    }

    if (mode === 'refresh') {
      setIsRefreshing(true);
    } else if (mode === 'more') {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      const res = await fetcher(cursor);
      if (!isMountedRef.current || requestId !== requestIdRef.current) return;
      setData((current) => {
        if (mode !== 'more') {
          return res.items;
        }

        const seen = new Set(current.map((item) => item.id));
        return [...current, ...res.items.filter((item) => !seen.has(item.id))];
      });
      const resolvedNextCursor = res.nextCursor || null;
      nextCursorRef.current = resolvedNextCursor;
      setNextCursor(resolvedNextCursor);
      setError(null);
    } catch (e: any) {
      if (!isMountedRef.current || requestId !== requestIdRef.current) return;
      const message = e?.message || 'Unable to load feed';
      if (lastLoggedErrorRef.current !== message) {
        console.log('Feed Error:', message);
        lastLoggedErrorRef.current = message;
      }
      setError(message);
    } finally {
      if (!isMountedRef.current || requestId !== requestIdRef.current) return;
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [fetcher]);

  useEffect(() => {
    isMountedRef.current = true;
    const timer = setTimeout(() => {
      fetchData('initial');
    }, 0);

    return () => {
      clearTimeout(timer);
      isMountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [fetchData]);

  const refetch = useCallback(() => fetchData('refresh'), [fetchData]);
  const loadMore = useCallback(() => {
    if (isLoading || isRefreshing || isLoadingMore || !nextCursor) return;
    void fetchData('more');
  }, [fetchData, isLoading, isLoadingMore, isRefreshing, nextCursor]);

  return {
    data,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    hasNextPage: Boolean(nextCursor),
    refetch,
    loadMore,
  };
}
