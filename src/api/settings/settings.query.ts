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
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
