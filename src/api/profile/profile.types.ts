import type { ReelFeedItem } from '../reels/reels.types';

export type ProfileUser = {
  id: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  coinBalance?: number;
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

export type PublicProfileData = MyProfileData & {
  followState: FollowState;
};
