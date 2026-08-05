export type ReelAudioInput = {
  originalVolume: number;
  musicVolume: number;
  musicId?: string;
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
  effect: 'none';
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
  caption?: string;
  forKids?: boolean;
  audio: ReelAudioInput;
  videoEdit: ReelVideoEditInput;
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
