import { apiClient } from '../client';

const dataOf = <T>(response: { data?: { data?: T } }) => response.data?.data as T;

export interface RewardDashboard {
  period: string;
  postViews: number;
  netFollowers: number;
  likes: number;
  comments: number;
  shares: number;
  periodStats: {
    postViews: number;
    likes: number;
    netFollowers: number;
  };
  giftDiamonds: number;
  estimatedEarningsUsd: number;
  diamondsPerDollar: number;
}

export interface TrendingCreator {
  rank: number;
  id: string;
  name: string;
  avatarUrl?: string;
  postViews: number;
  likes: number;
  followersCount: number;
  isFollowing: boolean;
}

export async function getMyRewardDashboard(): Promise<RewardDashboard> {
  const response = await apiClient.get<{ data: RewardDashboard }>('/rewards/me');
  return dataOf<RewardDashboard>(response);
}

export async function getTrendingCreators(): Promise<TrendingCreator[]> {
  const response = await apiClient.get<{ data: TrendingCreator[] }>('/rewards/trending-creators');
  return dataOf<TrendingCreator[]>(response);
}
