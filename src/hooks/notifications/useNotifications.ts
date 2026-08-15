import { useState, useEffect, useCallback, useRef } from 'react';
import { getNotifications, markNotificationsAsRead, deleteNotification } from '../../api/notifications/notification.api';
import type { NotificationItem } from '../../api/notifications/notification.types';

export function useNotifications() {
  const [data, setData] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  
  const isMountedRef = useRef(true);

  const fetchInitial = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getNotifications(20);
      if (!isMountedRef.current) return;
      setData(res.items);
      setNextCursor(res.nextCursor);
    } catch (e: any) {
      if (!isMountedRef.current) return;
      setError(e?.message || 'Unable to load notifications');
    } finally {
      if (!isMountedRef.current) return;
      setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const res = await getNotifications(20);
      if (!isMountedRef.current) return;
      setData(res.items);
      setNextCursor(res.nextCursor);
    } catch (e: any) {
      if (!isMountedRef.current) return;
      setError(e?.message || 'Unable to load notifications');
    } finally {
      if (!isMountedRef.current) return;
      setIsRefreshing(false);
    }
  }, []);

  const fetchNextPage = useCallback(async () => {
    if (!nextCursor || isLoadingMore || isLoading || isRefreshing) return;
    
    setIsLoadingMore(true);
    try {
      const res = await getNotifications(20, nextCursor);
      if (!isMountedRef.current) return;
      setData((prev) => [...prev, ...res.items]);
      setNextCursor(res.nextCursor);
    } catch (e: any) {
      // do not clear existing data on pagination error
    } finally {
      if (!isMountedRef.current) return;
      setIsLoadingMore(false);
    }
  }, [nextCursor, isLoadingMore, isLoading, isRefreshing]);

  const markAsRead = useCallback(async (notificationIds?: string[]) => {
    try {
      await markNotificationsAsRead({ notificationIds });
      
      // Update local state optimistically
      setData((prev) => 
        prev.map((item) => {
          if (!notificationIds || notificationIds.includes(item._id)) {
            return { ...item, isRead: true };
          }
          return item;
        })
      );
    } catch (e) {
      console.log('Failed to mark notifications as read', e);
    }
  }, []);

  const deleteItem = useCallback(async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      setData((prev) => prev.filter((item) => item._id !== notificationId));
    } catch (e) {
      console.log('Failed to delete notification', e);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchInitial();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchInitial]);

  return { 
    data, 
    isLoading, 
    isRefreshing, 
    isLoadingMore, 
    error, 
    refetch, 
    fetchNextPage,
    markAsRead,
    deleteItem
  };
}
