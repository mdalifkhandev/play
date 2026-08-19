import { apiClient } from '../client';

export interface ActivityItem {
  _id: string;
  userId: string;
  actorId?: {
    _id: string;
    profile?: {
      username?: string;
      displayName?: string;
      photoUrl?: string;
    }
  };
  actionType: string;
  entityId?: {
    _id: string;
    thumbnailUrl?: string; // If populated, depends on what we populate
  };
  entityModel?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export const getActivities = async (days?: number): Promise<{ items: ActivityItem[] }> => {
  const params = days ? { days: `${days}days` } : {};
  const response = await apiClient.get('/activities', { params });
  return response.data.data;
};
