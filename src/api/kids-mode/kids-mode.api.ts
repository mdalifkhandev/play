import { apiClient } from '../client';

export type KidsModeAgeGroup = '3-6' | '7-9' | '10-15';

export type KidsModeStatus = {
  configured: boolean;
  isActive: boolean;
  canWatch: boolean;
  childNickname: string | null;
  ageGroup: KidsModeAgeGroup | null;
  dailyLimitMinutes: number | null;
  usedSeconds: number;
  remainingSeconds: number;
  limitReached: boolean;
};

export type SetupKidsModePayload = {
  pin: string;
  confirmPin: string;
  childNickname?: string;
  ageGroup: KidsModeAgeGroup;
  dailyLimitMinutes: number;
  currentPin?: string;
};

function unwrap<T>(response: { data?: { data?: T } }): T {
  const data = response.data?.data;
  if (data === undefined) {
    throw new Error('Invalid Kids Mode API response.');
  }
  return data;
}

export async function getKidsModeStatus() {
  return unwrap<KidsModeStatus>(await apiClient.get('/kids-mode/status'));
}

export async function setupKidsMode(payload: SetupKidsModePayload) {
  return unwrap<KidsModeStatus>(await apiClient.post('/kids-mode/setup', payload));
}

export async function enterKidsMode(pin: string) {
  return unwrap<KidsModeStatus>(await apiClient.post('/kids-mode/enter', { pin }));
}

export async function exitKidsMode(pin: string) {
  return unwrap<KidsModeStatus>(await apiClient.post('/kids-mode/exit', { pin }));
}
