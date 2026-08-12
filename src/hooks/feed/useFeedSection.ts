import { useState, useEffect, useCallback, useRef } from 'react';

export function useFeedSection<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async (refresh = false) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      const res = await fetcher();
      if (!isMountedRef.current || requestId !== requestIdRef.current) return;
      setData(res);
      setError(null);
    } catch (e: any) {
      if (!isMountedRef.current || requestId !== requestIdRef.current) return;
      setError(e?.message || 'Unable to load feed');
    } finally {
      if (!isMountedRef.current || requestId !== requestIdRef.current) return;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [fetcher]);

  useEffect(() => {
    isMountedRef.current = true;
    const timer = setTimeout(() => {
      fetchData();
    }, 0);

    return () => {
      clearTimeout(timer);
      isMountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [fetchData]);

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  return { data, isLoading, isRefreshing, error, refetch };
}
