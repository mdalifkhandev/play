import * as FileSystem from 'expo-file-system/legacy';

import { apiClient } from '../client';
import { uploadToCloudinary } from '../reels/reels.api';

export type CreatorRequirementKey =
  | 'profile'
  | 'followers'
  | 'views'
  | 'watch_time'
  | 'likes'
  | 'account_age'
  | 'reels'
  | 'guidelines';

export type CreatorRequirement = {
  key: CreatorRequirementKey;
  title: string;
  current: number;
  target: number;
  complete: boolean;
  locked?: boolean;
  enabled?: boolean;
};

export type CreatorApplicationStatus = 'pending' | 'approved' | 'rejected' | 'held';

export type CreatorEligibility = {
  status: 'not_started' | 'eligible' | CreatorApplicationStatus;
  progress: number;
  completedSteps: number;
  totalSteps: number;
  canApply: boolean;
  isCreator: boolean;
  application?: {
    id: string;
    status: CreatorApplicationStatus;
    adminReason?: string;
    reviewedAt?: string;
    createdAt: string;
  };
  requirements: CreatorRequirement[];
};

export type CreateCreatorApplicationRequest = {
  fullName: string;
  email: string;
  dateOfBirth?: string;
  occupationId?: string;
  occupation?: string;
  contentCategoryId?: string;
  contentCategory: string;
  contentLanguageCode?: string;
  contentLanguage: string;
  countryCode?: string;
  country: string;
  reason: string;
  idFrontUrl?: string;
  idBackUrl?: string;
};

export type Occupation = {
  id: string;
  name: string;
};

export type CreatorCategory = {
  id: string;
  name: string;
};

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
  publicUrl?: string | null;
};

const dataOf = <T>(response: { data?: { data?: T } }) => response.data?.data as T;

export async function getCreatorEligibility(): Promise<CreatorEligibility> {
  const response = await apiClient.get<{ data: CreatorEligibility }>('/creators/me/eligibility');
  return dataOf<CreatorEligibility>(response);
}

export async function submitCreatorApplication(input: CreateCreatorApplicationRequest) {
  const response = await apiClient.post<{ data: CreatorEligibility['application'] }>(
    '/creators/applications',
    input,
  );
  return dataOf<CreatorEligibility['application']>(response);
}

export async function uploadCreatorDocument(uri: string, onProgress?: (progress: number) => void): Promise<string> {
  const file = await createDocumentUploadFile(uri);
  const prepareResponse = await apiClient.post<{ data: UploadUrlResponse }>('/uploads/prepare', {
    fileName: file.name,
    mediaType: 'image',
    mimeType: file.type,
    fileSizeBytes: file.size,
    purpose: 'story',
  });
  const uploadData = prepareResponse.data.data;
  const params = {
    api_key: uploadData.apiKey,
    timestamp: String(uploadData.timestamp),
    signature: uploadData.signature,
    public_id: uploadData.publicId,
  };

  await uploadToCloudinary(uploadData.uploadUrl, uri, file.type, params, onProgress);

  const completeResponse = await completeCreatorDocumentUploadWithRetry(uploadData.uploadId);
  const completed = completeResponse.data.data;

  if (!completed.publicUrl) {
    throw new Error('Document uploaded but image URL was missing.');
  }

  return completed.publicUrl;
}

export async function getOccupations(query?: string): Promise<{ items: Occupation[] }> {
  const response = await apiClient.get<{ data: { items: Occupation[] } }>('/occupations', {
    params: {
      ...(query?.trim() ? { q: query.trim() } : {}),
      limit: 20,
    },
  });
  return dataOf<{ items: Occupation[] }>(response);
}

export async function createOccupation(name: string): Promise<Occupation> {
  const response = await apiClient.post<{ data: Occupation }>('/occupations', { name });
  return dataOf<Occupation>(response);
}

export async function getCreatorCategories(query?: string): Promise<{ items: CreatorCategory[] }> {
  const response = await apiClient.get<{ data: { items: CreatorCategory[] } }>('/creator-categories', {
    params: {
      ...(query?.trim() ? { q: query.trim() } : {}),
      limit: 20,
    },
  });
  return dataOf<{ items: CreatorCategory[] }>(response);
}

export async function createCreatorCategory(name: string): Promise<CreatorCategory> {
  const response = await apiClient.post<{ data: CreatorCategory }>('/creator-categories', { name });
  return dataOf<CreatorCategory>(response);
}

async function completeCreatorDocumentUploadWithRetry(uploadId: string) {
  const retryDelays = [1000, 2000, 4000];
  let lastError: unknown;

  for (let attempt = 0; attempt <= retryDelays.length; attempt += 1) {
    try {
      return await apiClient.post<{ data: CompleteUploadResponse }>('/uploads/complete', { uploadId });
    } catch (error: any) {
      lastError = error;
      const status = error?.response?.status;
      const code = error?.response?.data?.error?.code;
      const shouldRetry = attempt < retryDelays.length && (status === 502 || code === 'CLOUDINARY_PROVIDER_UNAVAILABLE');

      if (!shouldRetry) {
        throw error;
      }

      await sleep(retryDelays[attempt]);
    }
  }

  throw lastError;
}

async function createDocumentUploadFile(uri: string) {
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

  return `creator-document-${Date.now()}.jpg`;
}

function mimeTypeFromUri(uri: string) {
  const lowerUri = uri.toLowerCase().split('?')[0];
  if (lowerUri.endsWith('.jpg') || lowerUri.endsWith('.jpeg')) return 'image/jpeg';
  if (lowerUri.endsWith('.png')) return 'image/png';
  if (lowerUri.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
