import * as FileSystem from 'expo-file-system/legacy';

import { apiClient } from '../client';
import type { PublishReelInput, ReelPublishResult, ReelStatusResult, ReelFeedResponse } from './reels.types';

type UploadUrlResponse = {
  uploadId: string;
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  publicId: string;
};

type CompleteUploadResponse = {
  mediaAssetId: string;
  mediaKey: string;
};

const VIDEO_MIME_TYPE = 'video/mp4';

export async function publishReel(input: PublishReelInput): Promise<ReelPublishResult> {
  const file = await createUploadFile(input.videoUri);

  const uploadUrlResponse = await apiClient.post<{ data: UploadUrlResponse }>('/uploads/prepare', {
    fileName: file.name,
    mediaType: 'video',
    mimeType: file.type,
    fileSizeBytes: file.size,
    purpose: 'reel',
  });
  const uploadData = uploadUrlResponse.data.data;

  const formData = new FormData();
  formData.append('file', {
    uri: input.videoUri,
    name: file.name,
    type: file.type,
  } as any);
  formData.append('api_key', uploadData.apiKey);
  formData.append('timestamp', String(uploadData.timestamp));
  formData.append('signature', uploadData.signature);
  formData.append('public_id', uploadData.publicId);
  formData.append('overwrite', 'false');

  await uploadToCloudinary(uploadData.uploadUrl, formData, input.onProgress);

  const completeResponse = await completeUploadWithRetry(uploadData.uploadId);
  const completed = completeResponse.data.data;

  const reelResponse = await apiClient.post<{ data: ReelPublishResult }>(
    '/reels',
    {
      mediaAssetId: completed.mediaAssetId,
      caption: input.caption,
      visibility: 'public',
      forKids: input.forKids ?? false,
      audio: input.audio,
      videoEdit: input.videoEdit,
    },
    {
      headers: {
        'Idempotency-Key': `reel-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      },
    },
  );

  return reelResponse.data.data;
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

export async function uploadToCloudinary(uploadUrl: string, formData: FormData, onProgress?: (progress: number) => void) {
  const delays = [1000, 2000, 4000];
  let lastError: unknown;

  for (let attempt = 0; attempt <= delays.length; attempt += 1) {
    try {
      await new Promise<void>((resolve, reject) => {
        const request = new XMLHttpRequest();

        request.open('POST', uploadUrl);
        if (onProgress) {
          request.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              onProgress(progress);
            }
          };
        }
        
        request.onload = () => {
          if (request.status >= 200 && request.status < 300) {
            resolve();
            return;
          }
          reject(new Error(`Cloudinary upload failed with status ${request.status}.`));
        };
        request.onerror = () => reject(new Error('Cloudinary upload failed.'));
        request.ontimeout = () => reject(new Error('Cloudinary upload timed out.'));
        request.timeout = 120000;
        request.send(formData);
      });
      return; // Success
    } catch (error: any) {
      lastError = error;
      if (attempt < delays.length) {
        await sleep(delays[attempt]);
      }
    }
  }

  throw lastError;
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

async function createUploadFile(uri: string) {
  const info = await FileSystem.getInfoAsync(uri);

  return {
    name: fileNameFromUri(uri),
    type: mimeTypeFromUri(uri),
    size: info.exists && typeof info.size === 'number' ? info.size : 1,
  };
}

function fileNameFromUri(uri: string) {
  const lastPart = uri.split('/').pop()?.split('?')[0];

  if (lastPart && /\.[a-z0-9]+$/i.test(lastPart)) {
    return lastPart;
  }

  return `reel-${Date.now()}.mp4`;
}

function mimeTypeFromUri(uri: string) {
  const lowerUri = uri.toLowerCase().split('?')[0];
  if (lowerUri.endsWith('.mov')) return 'video/quicktime';
  if (lowerUri.endsWith('.mp4') || lowerUri.endsWith('.m4v')) return 'video/mp4';
  return VIDEO_MIME_TYPE;
}
