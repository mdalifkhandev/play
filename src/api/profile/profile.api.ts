import { apiClient } from '../client';
import type { ReelFeedResponse } from '../reels/reels.types';
import type {
  DiscoverUsersResponse,
  FollowState,
  MyProfileData,
  MyProfileSummaryData,
  ProfileUser,
  PublicProfileData,
  ShareProfileData,
} from './profile.types';

const dataOf = <T>(response: { data?: { data?: T } }) => response.data?.data as T;

export async function getMe(): Promise<{ user: ProfileUser }> {
  const response = await apiClient.get<{ data: { user: ProfileUser } }>('/auth/me');
  return dataOf<{ user: ProfileUser }>(response);
}

export async function getFollowState(userId: string): Promise<FollowState> {
  const response = await apiClient.get<{ data: FollowState }>(`/users/${userId}/follow-state`);
  return dataOf<FollowState>(response);
}

export async function followUser(userId: string): Promise<FollowState> {
  const response = await apiClient.put<{ data: FollowState }>(`/users/${userId}/follow`);
  return dataOf<FollowState>(response);
}

export async function unfollowUser(userId: string): Promise<FollowState> {
  const response = await apiClient.delete<{ data: FollowState }>(`/users/${userId}/follow`);
  return dataOf<FollowState>(response);
}

export async function getMyReels(): Promise<ReelFeedResponse> {
  const response = await apiClient.get<{ data: ReelFeedResponse }>('/reels/me');
  return dataOf<ReelFeedResponse>(response);
}

export async function getMySavedReels(): Promise<ReelFeedResponse> {
  const response = await apiClient.get<{ data: ReelFeedResponse }>('/me/saved-reels');
  return dataOf<ReelFeedResponse>(response);
}

export async function getMyLikedReels(): Promise<ReelFeedResponse> {
  const response = await apiClient.get<{ data: ReelFeedResponse }>('/me/liked-reels');
  return dataOf<ReelFeedResponse>(response);
}

export async function getUserProfile(userId: string): Promise<{ user: ProfileUser }> {
  const response = await apiClient.get<{ data: { user: ProfileUser } }>(`/users/${userId}/profile`);
  return dataOf<{ user: ProfileUser }>(response);
}

export async function getUserProfileByUsername(username: string): Promise<{ user: ProfileUser }> {
  const response = await apiClient.get<{ data: { user: ProfileUser } }>(
    `/users/by-username/${encodeURIComponent(username)}/profile`,
  );
  return dataOf<{ user: ProfileUser }>(response);
}

export async function getUserReels(userId: string): Promise<ReelFeedResponse> {
  const response = await apiClient.get<{ data: ReelFeedResponse }>(`/reels/users/${userId}`);
  return dataOf<ReelFeedResponse>(response);
}

export async function discoverUsers(query = ''): Promise<DiscoverUsersResponse> {
  const response = await apiClient.get<{ data: DiscoverUsersResponse }>('/users/discover', {
    params: {
      q: query,
      limit: 50,
    },
  });
  return dataOf<DiscoverUsersResponse>(response);
}

export async function getShareProfile(): Promise<ShareProfileData> {
  const response = await apiClient.get<{ data: ShareProfileData }>('/users/me/share-profile');
  return dataOf<ShareProfileData>(response);
}

export async function updatePreferredLanguage(languageCode: string): Promise<{ preferredLanguageCode: string }> {
  const response = await apiClient.put<{ data: { preferredLanguageCode: string } }>('/users/me/language', {
    languageCode,
  });
  return dataOf<{ preferredLanguageCode: string }>(response);
}

export async function getMyProfileSummary(): Promise<MyProfileSummaryData> {
  const { user } = await getMe();
  const followState = await getFollowState(user.id);

  return {
    user,
    stats: {
      followersCount: followState.followersCount,
      followingCount: followState.followingCount,
      likesCount: 0,
      reelsCount: 0,
    },
  };
}

export async function getMyProfileData(): Promise<MyProfileData> {
  const { user } = await getMe();
  const [followState, reelsResponse, savedResponse, likedResponse] = await Promise.all([
    getFollowState(user.id),
    getMyReels(),
    getMySavedReels(),
    getMyLikedReels(),
  ]);
  const reels = reelsResponse.items || [];
  const savedReels = savedResponse.items || [];
  const likedReels = likedResponse.items || [];

  return {
    user,
    stats: {
      followersCount: followState.followersCount,
      followingCount: followState.followingCount,
      likesCount: reels.reduce((total, reel) => total + (reel.stats?.likes || 0), 0),
      reelsCount: reels.length,
    },
    reels,
    savedReels,
    likedReels,
  };
}

export async function getPublicProfileData(userId: string): Promise<PublicProfileData> {
  const [{ user }, followState, reelsResponse] = await Promise.all([
    getUserProfile(userId),
    getFollowState(userId),
    getUserReels(userId),
  ]);
  const reels = reelsResponse.items || [];

  return {
    user,
    followState,
    stats: {
      followersCount: followState.followersCount,
      followingCount: followState.followingCount,
      likesCount: reels.reduce((total, reel) => total + (reel.stats?.likes || 0), 0),
      reelsCount: reels.length,
    },
    reels,
    savedReels: [],
    likedReels: [],
  };
}

export async function getPublicProfileDataByUsername(username: string): Promise<PublicProfileData> {
  const { user } = await getUserProfileByUsername(username);
  return getPublicProfileData(user.id);
}
