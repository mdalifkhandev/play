import type { ReelFeedItem } from '../reels/reels.types';

export type ProfileUser = {
  id: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  coinBalance?: number;
  preferredLanguageCode?: string;
  subscription?: {
    plan?: 'monthly' | 'yearly';
    status: 'none' | 'active' | 'expired' | 'canceled';
    expiresAt?: string;
    isPremium: boolean;
  };
  profile: {
    username?: string;
    displayName?: string;
    bio?: string;
    photoUrl?: string;
    instagram?: string;
    youtube?: string;
    isSetupComplete?: boolean;
  };
};

export type FollowState = {
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
};

export type DiscoverUser = {
  id: string;
  email?: string;
  username?: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  isFollowing: boolean;
};

export type DiscoverUsersResponse = {
  items: DiscoverUser[];
};

export type ShareProfileData = {
  username: string;
  displayName: string;
  profileUrl: string;
  webUrl?: string;
  deepLink: string;
  title: string;
  message: string;
};

export type MyProfileData = {
  user: ProfileUser;
  stats: {
    followersCount: number;
    followingCount: number;
    likesCount: number;
    reelsCount: number;
  };
  reels: ReelFeedItem[];
  savedReels: ReelFeedItem[];
  likedReels: ReelFeedItem[];
};

export type MyProfileSummaryData = Pick<MyProfileData, 'user' | 'stats'>;

export type PublicProfileData = MyProfileData & {
  followState: FollowState;
};
