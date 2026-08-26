import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { getActiveAnnouncements, type AnnouncementItem, type AnnouncementPlacement } from '../../api/announcements/announcements.api';
import { handleApiError } from '../../api/client';

export const announcementQueryKeys = {
  all: ['announcements'] as const,
  active: () => [...announcementQueryKeys.all, 'active'] as const,
};

export function useActiveAnnouncements(placement?: AnnouncementPlacement) {
  const query = useQuery<AnnouncementItem[]>({
    queryKey: announcementQueryKeys.active(),
    queryFn: getActiveAnnouncements,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: 1,
  });

  const announcements = useMemo(() => {
    const data = query.data ?? [];
    if (!placement) return data;
    return data.filter((item) => item.placement === placement || item.placement === 'maintenance');
  }, [placement, query.data]);

  if (query.error) {
    console.log('Active announcements load failed:', handleApiError(query.error, 'Could not load announcements.'));
  }

  return {
    data: announcements,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
