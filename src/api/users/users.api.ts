import { apiClient } from '../client';

export const setKidsModePin = async (pin: string) => {
  const response = await apiClient.post('/users/me/kids-pin', { pin });
  return response.data;
};

export const verifyKidsModePin = async (pin: string) => {
  const response = await apiClient.post('/users/me/kids-pin/verify', { pin });
  return response.data;
};

export const updateKidsProfile = async (data: {
  name?: string;
  ageRange?: string;
  dailyLimitMs?: number;
  isActive?: boolean;
}) => {
  const response = await apiClient.put('/users/me/kids-profile', data);
  return response.data;
};
