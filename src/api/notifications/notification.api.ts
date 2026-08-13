import { apiClient } from '../client';
import type { RegisterPushTokenRequest, RegisterPushTokenResponse } from './notification.types';

export const registerPushToken = async (data: RegisterPushTokenRequest) => {
  const response = await apiClient.post<{ data: RegisterPushTokenResponse }>(
    '/notifications/tokens',
    data,
  );

  return response.data.data;
};
