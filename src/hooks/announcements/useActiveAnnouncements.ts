import { useCallback, useEffect, useMemo, useState } from 'react';

import { getActiveAnnouncements, type AnnouncementItem, type AnnouncementPlacement } from '../../api/announcements/announcements.api';
import { handleApiError } from '../../api/client';

export function useActiveAnnouncements(placement?: AnnouncementPlacement) {
  const [data, setData] = useState<AnnouncementItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const items = await getActiveAnnouncements();
      setData(items);
    } catch (error) {
      console.log('Active announcements load failed:', handleApiError(error, 'Could not load announcements.'));
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const announcements = useMemo(() => {
    if (!placement) return data;
    return data.filter((item) => item.placement === placement || item.placement === 'maintenance');
  }, [data, placement]);

  return {
    data: announcements,
    isLoading,
    refetch: load,
  };
}
