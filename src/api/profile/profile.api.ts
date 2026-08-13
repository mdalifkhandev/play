import { apiClient } from '../client';
import type { ReelFeedResponse } from '../reels/reels.types';
import type { FollowState, MyProfileData, ProfileUser } from './profile.types';

const dataOf = <T>(response: { data?: { data?: T } }) => response.data?.data as T;

export async function getMe(): Promise<{ user: ProfileUser }> {
  const response = await apiClient.get<{ data: { user: ProfileUser } }>('/auth/me');
  return dataOf<{ user: ProfileUser }>(response);
}

export async function getFollowState(userId: string): Promise<FollowState> {
  const response = await apiClient.get<{ data: FollowState }>(`/users/${userId}/follow-state`);
  return dataOf<FollowState>(response);
}

export async function getMyReels(): Promise<ReelFeedResponse> {
  const response = await apiClient.get<{ data: ReelFeedResponse }>('/reels/me');
  return dataOf<ReelFeedResponse>(response);
}

export async function getMyProfileData(): Promise<MyProfileData> {
  const { user } = await getMe();
  const [followState, reelsResponse] = await Promise.all([
    getFollowState(user.id),
    getMyReels(),
  ]);
  const reels = reelsResponse.items || [];

  return {
    user,
    stats: {
      followersCount: followState.followersCount,
      followingCount: followState.followingCount,
      likesCount: reels.reduce((total, reel) => total + (reel.stats?.likes || 0), 0),
      reelsCount: reels.length,
    },
    reels,
  };
}
