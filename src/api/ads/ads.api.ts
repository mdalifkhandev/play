import { apiClient } from '../client';
import * as FileSystem from 'expo-file-system/legacy';
import { uploadToCloudinary } from '../reels/reels.api';

export type AdCampaignStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'active'
  | 'paused'
  | 'held'
  | 'rejected'
  | 'completed'
  | 'cancelled';

export type AdAudienceType = 'same_interest' | 'interest_in_topic' | 'all_users';
export type AdAreaType = 'city' | 'country' | 'world';
export type AdCtaType = 'none' | 'learn_more' | 'send_message';

export type CreateAdCampaignRequest = {
  category: string;
  days: number;
  budgetUsd: number;
  targetUsers: number;
  placement: 'feed';
  audienceType: AdAudienceType;
  areaType: AdAreaType;
  city?: string;
  country?: string;
  mediaAssetId?: string;
  mediaKey?: string;
  mediaUrl?: string;
  title?: string;
  description?: string;
  destinationUrl?: string;
  ctaType?: AdCtaType;
  ctaLabel?: string;
};

export type AdPaymentStatus = 'unpaid' | 'paid' | 'failed' | 'refunded';
export type AdPaymentProvider = 'stripe' | 'coins';

export type AdCampaign = CreateAdCampaignRequest & {
  id: string;
  ownerId: string;
  owner?: {
    id: string;
    email?: string;
    displayName?: string;
    username?: string;
    photoUrl?: string;
  } | null;
  status: AdCampaignStatus;
  paymentStatus?: AdPaymentStatus;
  paymentProvider?: AdPaymentProvider;
  paidAt?: string | null;
  paymentAmountUsd?: number | null;
  adminReason: string | null;
  startsAt: string | null;
  endsAt: string | null;
  pausedAt: string | null;
  heldAt: string | null;
  metrics: {
    impressions: number;
    clicks: number;
    spendUsd: number;
  };
  createdAt: string;
  updatedAt: string;
};

export type AdsPage = {
  items: AdCampaign[];
  nextCursor: string | null;
};

export type FeedAdsResponse = {
  items: AdCampaign[];
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

export type UploadedAdMedia = {
  mediaAssetId: string;
  mediaKey?: string | null;
  mediaUrl?: string | null;
};

export type AdUploadStep = 'preparing' | 'uploading' | 'verifying';

export type AdPackage = {
  id: string;
  name: string;
  days: number;
  priceUsd: number;
  targetUsers: number;
  description?: string;
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

export const getAdPackages = async (): Promise<AdPackage[]> => {
  const response = await apiClient.get<{ data: AdPackage[] }>('/ads/packages');
  return response.data.data;
};

export type AdCategory = {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

export const getAdCategories = async (): Promise<AdCategory[]> => {
  const response = await apiClient.get<{ data: AdCategory[] }>('/ads/categories');
  return response.data.data;
};

export const createAdCampaign = async (data: CreateAdCampaignRequest) => {
  const response = await apiClient.post<{ data: AdCampaign }>('/ads', data);
  return response.data.data;
};

export const uploadAdMedia = async (
  uri: string,
  mediaType: 'image' | 'video',
  onProgress?: (progress: number) => void,
  onStep?: (step: AdUploadStep) => void,
): Promise<UploadedAdMedia> => {
  const file = await createUploadFile(uri, mediaType);
  console.log('[AD_UPLOAD] start', { mediaType, file });
  onStep?.('preparing');
  const prepareResponse = await apiClient.post<{ data: UploadUrlResponse }>('/uploads/prepare', {
    fileName: file.name,
    mediaType,
    mimeType: file.type,
    fileSizeBytes: file.size,
    purpose: 'reel',
  });
  const uploadData = prepareResponse.data.data;
  console.log('[AD_UPLOAD] upload prepared', {
    uploadId: uploadData.uploadId,
    publicId: uploadData.publicId,
    mediaType,
  });
  const params = {
    api_key: uploadData.apiKey,
    timestamp: String(uploadData.timestamp),
    signature: uploadData.signature,
    public_id: uploadData.publicId,
  };

  onStep?.('uploading');
  await uploadToCloudinary(uploadData.uploadUrl, uri, file.type, params, onProgress);
  console.log('[AD_UPLOAD] cloudinary upload complete', { uploadId: uploadData.uploadId });

  onStep?.('verifying');
  onProgress?.(100);
  const completeResponse = await completeAdUploadWithRetry(uploadData.uploadId);
  const completed = completeResponse.data.data;
  console.log('[AD_UPLOAD] upload verified', {
    uploadId: uploadData.uploadId,
    mediaAssetId: completed.mediaAssetId || completed.id,
    mediaKey: completed.mediaKey,
  });
  const mediaAssetId = completed.mediaAssetId || completed.id;

  if (!mediaAssetId) {
    throw new Error('Upload completed but media asset id was missing.');
  }

  return {
    mediaAssetId,
    mediaKey: completed.mediaKey,
    mediaUrl: completed.publicUrl,
  };
};

async function completeAdUploadWithRetry(uploadId: string) {
  const retryDelays = [1000, 2000, 4000, 6000];
  let lastError: unknown;

  for (let attempt = 0; attempt <= retryDelays.length; attempt += 1) {
    try {
      return await apiClient.post<{ data: CompleteUploadResponse }>('/uploads/complete', { uploadId });
    } catch (error: any) {
      lastError = error;
      const status = error?.response?.status;
      const code = error?.response?.data?.error?.code;
      const message = String(error?.response?.data?.error?.message || '').toLowerCase();
      const shouldRetry =
        attempt < retryDelays.length &&
        (status === 502 ||
          code === 'CLOUDINARY_PROVIDER_UNAVAILABLE' ||
          (status === 422 &&
            code === 'UPLOAD_VERIFICATION_FAILED' &&
            (message.includes('duration') || message.includes('not found') || message.includes('could not be verified'))));

      console.log('[AD_UPLOAD] verify failed', {
        uploadId,
        attempt: attempt + 1,
        status,
        code,
        message,
        willRetry: shouldRetry,
      });

      if (!shouldRetry) {
        throw error;
      }

      await sleep(retryDelays[attempt]);
    }
  }

  throw lastError;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const getMyAds = async (params?: { status?: AdCampaignStatus; limit?: number; cursor?: string }) => {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.cursor) query.set('cursor', params.cursor);

  const suffix = query.toString() ? `?${query.toString()}` : '';
  const response = await apiClient.get<{ data: AdsPage }>(`/ads${suffix}`);
  return response.data.data;
};

export const pauseMyAd = async (adId: string) => {
  const response = await apiClient.post<{ data: AdCampaign }>(`/ads/${adId}/pause`);
  return response.data.data;
};

export const resumeMyAd = async (adId: string) => {
  const response = await apiClient.post<{ data: AdCampaign }>(`/ads/${adId}/resume`);
  return response.data.data;
};

export const getFeedAds = async (limit: number = 3) => {
  const response = await apiClient.get<{ data: FeedAdsResponse }>('/ads/feed', {
    params: { limit },
  });
  return response.data.data;
};

export const recordAdImpression = async (adId: string) => {
  const response = await apiClient.post<{ data: { recorded: boolean } }>(`/ads/${adId}/impressions`);
  return response.data.data;
};

export const recordAdClick = async (adId: string) => {
  const response = await apiClient.post<{ data: { recorded: boolean } }>(`/ads/${adId}/clicks`);
  return response.data.data;
};

export const getAdminAds = async (params?: { status?: AdCampaignStatus; limit?: number; cursor?: string }) => {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.cursor) query.set('cursor', params.cursor);

  const suffix = query.toString() ? `?${query.toString()}` : '';
  const response = await apiClient.get<{ data: AdsPage }>(`/admin/ads${suffix}`);
  return response.data.data;
};

export const adminUpdateAdStatus = async (
  adId: string,
  action: 'approve' | 'reject' | 'hold' | 'pause' | 'resume' | 'cancel',
  reason?: string,
) => {
  const response = await apiClient.patch<{ data: AdCampaign }>(
    `/admin/ads/${adId}/${action}`,
    reason ? { reason } : {},
  );
  return response.data.data;
};

export interface AdPaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  publishableKey: string;
  amount: number;
  currency: string;
  adId: string;
}

export interface PayAdWithCoinsResponse {
  ad: AdCampaign;
  coinBalance: number;
  coinsDeducted: number;
}

export const createAdPaymentIntent = async (adId: string): Promise<AdPaymentIntentResponse> => {
  const response = await apiClient.post<{ data: AdPaymentIntentResponse }>(`/ads/${adId}/payment/stripe-intent`);
  return response.data.data;
};

export const verifyAdStripePayment = async (adId: string, paymentIntentId: string): Promise<AdCampaign> => {
  const response = await apiClient.post<{ data: AdCampaign }>(`/ads/${adId}/payment/verify-stripe`, {
    paymentIntentId,
  });
  return response.data.data;
};

export const payAdWithCoins = async (adId: string): Promise<PayAdWithCoinsResponse> => {
  const response = await apiClient.post<{ data: PayAdWithCoinsResponse }>(`/ads/${adId}/payment/pay-coins`);
  return response.data.data;
};


async function createUploadFile(uri: string, mediaType: 'image' | 'video') {
  const info = await FileSystem.getInfoAsync(uri);

  return {
    name: fileNameFromUri(uri, mediaType),
    type: mimeTypeFromUri(uri, mediaType),
    size: info.exists && typeof info.size === 'number' ? info.size : 1,
  };
}

function fileNameFromUri(uri: string, mediaType: 'image' | 'video') {
  const lastPart = uri.split('/').pop()?.split('?')[0];

  if (lastPart && /\.[a-z0-9]+$/i.test(lastPart)) {
    return lastPart;
  }

  return `ad-${Date.now()}.${mediaType === 'image' ? 'jpg' : 'mp4'}`;
}

function mimeTypeFromUri(uri: string, mediaType: 'image' | 'video') {
  const lowerUri = uri.toLowerCase().split('?')[0];
  if (lowerUri.endsWith('.jpg') || lowerUri.endsWith('.jpeg')) return 'image/jpeg';
  if (lowerUri.endsWith('.png')) return 'image/png';
  if (lowerUri.endsWith('.webp')) return 'image/webp';
  if (lowerUri.endsWith('.mov')) return 'video/quicktime';
  if (lowerUri.endsWith('.mp4') || lowerUri.endsWith('.m4v')) return 'video/mp4';
  return mediaType === 'image' ? 'image/jpeg' : 'video/mp4';
}
