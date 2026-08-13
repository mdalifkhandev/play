export type ReelAudioInput = {
  originalVolume: number;
  musicVolume: number;
  musicId?: string;
  soundUri?: string;
  musicTitle?: string;
  musicArtist?: string;
  musicTrim?: {
    startMs: number;
    endMs: number;
  };
};

export type ReelVideoEditInput = {
  trim: {
    startMs: number;
    endMs: number;
  };
  filter: 'none' | 'vivid' | 'warm' | 'cool' | 'grayscale' | 'sepia';
  effect: 'none' | 'zoom' | 'glitch' | 'flash' | 'vhs' | 'sparkle';
  exposure: number;
  contrast: number;
  overlayText?: {
    text: string;
    x: number;
    y: number;
    fontSize: number;
  };
};

export type PublishReelInput = {
  videoUri: string;
  mediaType?: 'photo' | 'video';
  caption?: string;
  forKids?: boolean;
  audio?: ReelAudioInput;
  videoEdit?: any;
  onProgress?: (progress: number) => void;
};

export type ReelPublishResult = {
  reelId: string;
  status: 'queued' | 'processing' | 'ready' | 'failed';
  progress: number;
};

export type ReelStatusResult = {
  id: string;
  status: 'queued' | 'processing' | 'ready' | 'failed' | 'deleted';
  progress: number;
  media?: {
    rawUrl?: string | null;
    processedUrl?: string | null;
    thumbnailUrl?: string | null;
    durationMs?: number | null;
  };
  error?: {
    code?: string;
    message?: string;
    canRetry?: boolean;
  } | null;
};

export type ReelFeedItem = {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  durationMs: number;
  caption: string | null;
  user: {
    id: string;
    email: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
  stats: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  viewerState: {
    isLiked: boolean;
    isSaved: boolean;
  } | null;
  createdAt: string;
  publishedAt: string;
};

export type ReelFeedResponse = {
  items: ReelFeedItem[];
  nextCursor?: string;
};

export type ReelViewResponse = {
  viewCount: number;
  counted: boolean;
};
