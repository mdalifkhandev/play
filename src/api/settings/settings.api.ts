import { apiClient } from '../client';

export interface PublicPlatformSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  videosBetweenAds: number;
  languages: {
    code: string;
    name: string;
    active: boolean;
  }[];
  featureFlags: {
    liveStreaming: boolean;
    ads: boolean;
    kidsMode: boolean;
    rewards: boolean;
    subscriptions: boolean;
    creatorApplications: boolean;
    coinPurchase: boolean;
    withdrawals: boolean;
  };
  updatedAt: string;
}

export async function getPublicPlatformSettings() {
  const response = await apiClient.get<{ data: PublicPlatformSettings }>('/settings/public');
  return response.data.data;
}
