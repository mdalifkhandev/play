export type EngagementCountResponse = {
  likeCount?: number;
  shareCount?: number;
  isLiked?: boolean;
  isSaved?: boolean;
};

export type ReelComment = {
  id: string;
  text: string;
  authorId: string;
  authorName: string | null;
  authorAvatar: string | null;
  parentCommentId: string | null;
  likeCount: number;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ReelCommentsResponse = {
  items: ReelComment[];
  nextCursor: string | null;
  hasNextPage: boolean;
  totalCount?: number;
};
