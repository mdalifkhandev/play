import { useQuery } from '@tanstack/react-query';

import { getCreatorEligibility } from '../creators';
import {
  getMyLikedReels,
  getMyProfileSummary,
  getMyReels,
  getMySavedReels,
  getPublicProfileData,
  getPublicProfileDataByUsername,
} from './profile.api';

export const profileQueryKeys = {
  all: ['profile'] as const,
  me: () => [...profileQueryKeys.all, 'me'] as const,
  mySummary: () => [...profileQueryKeys.me(), 'summary'] as const,
  myReels: () => [...profileQueryKeys.me(), 'reels'] as const,
  mySavedReels: () => [...profileQueryKeys.me(), 'saved-reels'] as const,
  myLikedReels: () => [...profileQueryKeys.me(), 'liked-reels'] as const,
  publicProfile: (userId: string) => [...profileQueryKeys.all, 'public', userId] as const,
  publicProfileByUsername: (username: string) => [...profileQueryKeys.all, 'public-username', username] as const,
  creatorEligibility: () => [...profileQueryKeys.me(), 'creator-eligibility'] as const,
};

const PROFILE_STALE_TIME_MS = 30_000;
const PROFILE_LIST_STALE_TIME_MS = 45_000;
const PROFILE_GC_TIME_MS = 5 * 60_000;

export function useMyProfileSummaryQuery() {
  return useQuery({
    queryKey: profileQueryKeys.mySummary(),
    queryFn: getMyProfileSummary,
    staleTime: PROFILE_STALE_TIME_MS,
    gcTime: PROFILE_GC_TIME_MS,
  });
}

export function useCreatorEligibilityQuery() {
  return useQuery({
    queryKey: profileQueryKeys.creatorEligibility(),
    queryFn: getCreatorEligibility,
    staleTime: PROFILE_STALE_TIME_MS,
    gcTime: PROFILE_GC_TIME_MS,
  });
}

export function useMyReelsQuery(enabled = true) {
  return useQuery({
    queryKey: profileQueryKeys.myReels(),
    queryFn: getMyReels,
    enabled,
    staleTime: PROFILE_LIST_STALE_TIME_MS,
    gcTime: PROFILE_GC_TIME_MS,
  });
}

export function useMySavedReelsQuery(enabled = true) {
  return useQuery({
    queryKey: profileQueryKeys.mySavedReels(),
    queryFn: getMySavedReels,
    enabled,
    staleTime: PROFILE_LIST_STALE_TIME_MS,
    gcTime: PROFILE_GC_TIME_MS,
  });
}

export function useMyLikedReelsQuery(enabled = true) {
  return useQuery({
    queryKey: profileQueryKeys.myLikedReels(),
    queryFn: getMyLikedReels,
    enabled,
    staleTime: PROFILE_LIST_STALE_TIME_MS,
    gcTime: PROFILE_GC_TIME_MS,
  });
}

export function usePublicProfileQuery(userId: string, enabled = true) {
  return useQuery({
    queryKey: profileQueryKeys.publicProfile(userId),
    queryFn: () => getPublicProfileData(userId),
    enabled: enabled && Boolean(userId),
    staleTime: PROFILE_STALE_TIME_MS,
    gcTime: PROFILE_GC_TIME_MS,
  });
}

export function usePublicProfileByUsernameQuery(username: string, enabled = true) {
  return useQuery({
    queryKey: profileQueryKeys.publicProfileByUsername(username),
    queryFn: () => getPublicProfileDataByUsername(username),
    enabled: enabled && Boolean(username),
    staleTime: PROFILE_STALE_TIME_MS,
    gcTime: PROFILE_GC_TIME_MS,
  });
}
