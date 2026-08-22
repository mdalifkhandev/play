import * as FileSystem from 'expo-file-system/legacy';

import { apiClient, refreshAccessToken } from '../client';
import type { PublishReelInput, ReelFeedResponse, ReelPublishResult, ReelStatusResult, ReelViewResponse } from './reels.types';

type UploadUrlResponse = {
  uploadId: string;
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  publicId: string;
};

type CompleteUploadResponse = {
  id?: string;
  mediaAssetId?: string;
  mediaKey?: string | null;
};

const VIDEO_MIME_TYPE = 'video/mp4';

export async function publishReel(input: PublishReelInput): Promise<ReelPublishResult> {
  const mediaType = input.mediaType ?? 'video';
  const uploadMediaType = mediaType === 'photo' ? 'image' : 'video';
  const file = await createUploadFile(input.videoUri, mediaType);

  console.log('[PUBLISH_REEL] start', {
    mediaType,
    uploadMediaType,
    file,
    hasAudio: Boolean(input.audio),
    audio: input.audio,
    videoEdit: input.videoEdit,
  });

  await refreshAccessTokenIfPossible();

  console.log('[PUBLISH_REEL] prepare upload request', {
    fileName: file.name,
    mediaType: uploadMediaType,
    mimeType: file.type,
    fileSizeBytes: file.size,
    purpose: 'reel',
  });

  const uploadUrlResponse = await apiClient.post<{ data: UploadUrlResponse }>('/uploads/prepare', {
    fileName: file.name,
    mediaType: uploadMediaType,
    mimeType: file.type,
    fileSizeBytes: file.size,
    purpose: 'reel',
  });
  const uploadData = uploadUrlResponse.data.data;
  console.log('[PUBLISH_REEL] upload prepared', {
    uploadId: uploadData.uploadId,
    publicId: uploadData.publicId,
  });

  const params = {
    api_key: uploadData.apiKey,
    timestamp: String(uploadData.timestamp),
    signature: uploadData.signature,
    public_id: uploadData.publicId,
  };

  await uploadToCloudinary(uploadData.uploadUrl, input.videoUri, file.type, params, input.onProgress);
  console.log('[PUBLISH_REEL] cloudinary upload complete', { uploadId: uploadData.uploadId });

  await refreshAccessTokenIfPossible();

  const completeResponse = await completeUploadWithRetry(uploadData.uploadId);
  const completed = completeResponse.data.data;
  const mediaAssetId = completed.mediaAssetId || completed.id;
  console.log('[PUBLISH_REEL] upload complete response', {
    uploadId: uploadData.uploadId,
    mediaAssetId,
    mediaKey: completed.mediaKey,
  });

  if (!mediaAssetId) {
    throw new Error('Upload completed but media asset id was missing.');
  }

  const createPayload = {
    mediaAssetId,
    ...(completed.mediaKey ? { rawMediaKey: completed.mediaKey } : {}),
    caption: input.caption,
    mediaType,
    visibility: 'public',
    forKids: input.forKids ?? false,
    audio: input.audio,
    videoEdit: input.videoEdit,
  };

  console.log('[PUBLISH_REEL] create reel request', createPayload);

  const reelResponse = await apiClient.post<{ data: ReelPublishResult }>(
    '/reels',
    createPayload,
    {
      headers: {
        'Idempotency-Key': `reel-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      },
    },
  );

  console.log('[PUBLISH_REEL] create reel response', reelResponse.data.data);
  return reelResponse.data.data;
}

async function refreshAccessTokenIfPossible() {
  try {
    await refreshAccessToken();
  } catch (error) {
    console.log('Token refresh before reel upload step failed:', error);
  }
}

async function completeUploadWithRetry(uploadId: string) {
  const delays = [1000, 2000, 4000];
  let lastError: unknown;

  for (let attempt = 0; attempt <= delays.length; attempt += 1) {
    try {
      return await apiClient.post<{ data: CompleteUploadResponse }>('/uploads/complete', {
        uploadId,
      });
    } catch (error: any) {
      lastError = error;
      const status = error?.response?.status;
      const code = error?.response?.data?.error?.code;
      const message = String(error?.response?.data?.error?.message || '').toLowerCase();
      const shouldRetry =
        attempt < delays.length &&
        (status === 502 ||
          code === 'CLOUDINARY_PROVIDER_UNAVAILABLE' ||
          (status === 422 && code === 'UPLOAD_VERIFICATION_FAILED' && message.includes('duration')));

      if (!shouldRetry) {
        throw error;
      }

      await sleep(delays[attempt]);
    }
  }

  throw lastError;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function uploadToCloudinary(
  uploadUrl: string, 
  videoUri: string, 
  mimeType: string,
  params: Record<string, string>, 
  onProgress?: (progress: number) => void
) {
  const delays = [1000, 2000, 4000];
  let lastError: unknown;

  for (let attempt = 0; attempt <= delays.length; attempt += 1) {
    try {
      let uploadTask: FileSystem.UploadTask | null = null;
      
      if (onProgress) {
        uploadTask = FileSystem.createUploadTask(
          uploadUrl,
          videoUri,
          {
            httpMethod: 'POST',
            uploadType: FileSystem.FileSystemUploadType.MULTIPART,
            fieldName: 'file',
            mimeType,
            parameters: params,
          },
          (progressData) => {
            if (progressData.totalBytesExpectedToSend > 0) {
              const progress = Math.round((progressData.totalBytesSent / progressData.totalBytesExpectedToSend) * 100);
              onProgress(progress);
            }
          }
        );
        const result = await uploadTask.uploadAsync();
        if (result && result.status >= 200 && result.status < 300) {
          return; // Success
        }
        throw new Error(cloudinaryUploadErrorMessage(result?.status, result?.body));
      } else {
        const result = await FileSystem.uploadAsync(uploadUrl, videoUri, {
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: 'file',
          mimeType,
          parameters: params,
        });
        if (result.status >= 200 && result.status < 300) {
          return; // Success
        }
        throw new Error(cloudinaryUploadErrorMessage(result.status, result.body));
      }
    } catch (error: any) {
      lastError = error;
      if (attempt < delays.length) {
        await sleep(delays[attempt]);
      }
    }
  }

  throw lastError;
}

function cloudinaryUploadErrorMessage(status?: number, body?: string | null) {
  const bodyMessage = body ? ` ${body.slice(0, 300)}` : '';
  return `Cloudinary upload failed with status ${status ?? 'unknown'}.${bodyMessage}`;
}

export async function getReelStatus(reelId: string): Promise<ReelStatusResult> {
  const response = await apiClient.get<{ data: ReelStatusResult }>(`/reels/${reelId}`);
  return response.data.data;
}

export async function getFeed(cursor?: string): Promise<ReelFeedResponse> {
  const params = cursor ? { cursor } : {};
  const response = await apiClient.get<{ data: ReelFeedResponse }>('/reels/feed', { params });
  return response.data.data;
}

export async function getKidsFeed(cursor?: string): Promise<ReelFeedResponse> {
  const params = cursor ? { cursor } : {};
  const response = await apiClient.get<{ data: ReelFeedResponse }>('/reels/kids', { params });
  return response.data.data;
}

export async function searchReels(q: string, page = 1, limit = 20) {
  const response = await apiClient.get<{ data: { reels: any[], hasMore: boolean, page: number } }>('/reels/search', {
    params: { q, page, limit }
  });
  return response.data.data;
}

export async function getForYouFeed(cursor?: string): Promise<ReelFeedResponse> {
  const params = cursor ? { cursor } : {};
  const response = await apiClient.get<{ data: ReelFeedResponse }>('/reels/for-you', { params });
  return response.data.data;
}

export async function recordReelView(reelId: string): Promise<ReelViewResponse> {
  const response = await apiClient.post<{ data: ReelViewResponse }>(`/reels/${reelId}/views`);
  return response.data.data;
}

async function createUploadFile(uri: string, mediaType: 'photo' | 'video' = 'video') {
  const info = await FileSystem.getInfoAsync(uri);

  return {
    name: fileNameFromUri(uri, mediaType),
    type: mimeTypeFromUri(uri, mediaType),
    size: info.exists && typeof info.size === 'number' ? info.size : 1,
  };
}

function fileNameFromUri(uri: string, mediaType: 'photo' | 'video' = 'video') {
  const lastPart = uri.split('/').pop()?.split('?')[0];

  if (lastPart && /\.[a-z0-9]+$/i.test(lastPart)) {
    return lastPart;
  }

  if (mediaType === 'photo') return `reel-${Date.now()}.jpg`;
  return `reel-${Date.now()}.mp4`;
}

function mimeTypeFromUri(uri: string, mediaType: 'photo' | 'video' = 'video') {
  const lowerUri = uri.toLowerCase().split('?')[0];
  if (lowerUri.endsWith('.jpg') || lowerUri.endsWith('.jpeg')) return 'image/jpeg';
  if (lowerUri.endsWith('.png')) return 'image/png';
  if (lowerUri.endsWith('.webp')) return 'image/webp';
  if (lowerUri.endsWith('.mov')) return 'video/quicktime';
  if (lowerUri.endsWith('.mp4') || lowerUri.endsWith('.m4v')) return 'video/mp4';
  if (mediaType === 'photo') return 'image/jpeg';
  return VIDEO_MIME_TYPE;
}
