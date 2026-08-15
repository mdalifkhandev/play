import { apiClient } from '../client';
import type { 
  RegisterPushTokenRequest, 
  RegisterPushTokenResponse,
  GetNotificationsResponse,
  MarkNotificationsAsReadRequest
} from './notification.types';

export const registerPushToken = async (data: RegisterPushTokenRequest) => {
  const response = await apiClient.post<{ data: RegisterPushTokenResponse }>(
    '/notifications/tokens',
    data,
  );

  return response.data.data;
};

export const getNotifications = async (limit: number = 20, cursor?: string) => {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (cursor) {
    params.append('cursor', cursor);
  }

  const response = await apiClient.get<{ data: GetNotificationsResponse }>(
    `/notifications?${params.toString()}`,
  );

  return response.data.data;
};

export const markNotificationsAsRead = async (data: MarkNotificationsAsReadRequest) => {
  const response = await apiClient.patch<{ data: { modifiedCount: number } }>(
    '/notifications/read',
    data,
  );

  return response.data.data;
};

export const deleteNotification = async (notificationId: string) => {
  const response = await apiClient.delete<{ data: { deleted: boolean } }>(
    `/notifications/${notificationId}`,
  );

  return response.data.data;
};
