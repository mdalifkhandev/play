import { useQuery } from '@tanstack/react-query';

import { getPublicPlatformSettings } from './settings.api';

export const settingsQueryKeys = {
  all: ['platform-settings'] as const,
  public: () => [...settingsQueryKeys.all, 'public'] as const,
};

export function usePublicPlatformSettingsQuery() {
  return useQuery({
    queryKey: settingsQueryKeys.public(),
    queryFn: getPublicPlatformSettings,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: false,
    refetchInterval: 120_000,
  });
}
