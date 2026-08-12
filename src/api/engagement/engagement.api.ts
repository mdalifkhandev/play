import { apiClient } from '../client';
import type { EngagementCountResponse, ReelComment, ReelCommentsResponse } from './engagement.types';

const dataOf = <T>(response: { data?: { data?: T } }) => response.data?.data as T;

export async function likeReel(reelId: string) {
  const response = await apiClient.put<{ data: EngagementCountResponse }>(`/engagements/reels/${reelId}/like`);
  return dataOf<EngagementCountResponse>(response);
}

export async function unlikeReel(reelId: string) {
  const response = await apiClient.delete<{ data: EngagementCountResponse }>(`/engagements/reels/${reelId}/like`);
  return dataOf<EngagementCountResponse>(response);
}

export async function saveReel(reelId: string) {
  const response = await apiClient.put<{ data: EngagementCountResponse }>(`/engagements/reels/${reelId}/save`);
  return dataOf<EngagementCountResponse>(response);
}

export async function unsaveReel(reelId: string) {
  const response = await apiClient.delete<{ data: EngagementCountResponse }>(`/engagements/reels/${reelId}/save`);
  return dataOf<EngagementCountResponse>(response);
}

export async function shareReel(reelId: string, channel: 'profile' | 'copy_link' | 'whatsapp' | 'facebook' | 'messenger' | 'other' = 'copy_link') {
  const response = await apiClient.post<{ data: EngagementCountResponse }>(`/engagements/reels/${reelId}/share`, { channel });
  return dataOf<EngagementCountResponse>(response);
}

export async function listReelComments(reelId: string, cursor?: string) {
  const response = await apiClient.get<{ data: ReelCommentsResponse }>(`/engagements/reels/${reelId}/comments`, {
    params: { limit: 20, ...(cursor ? { cursor } : {}) },
  });
  return dataOf<ReelCommentsResponse>(response);
}

export async function createReelComment(reelId: string, text: string) {
  const response = await apiClient.post<{ data: ReelComment }>(`/engagements/reels/${reelId}/comments`, { text });
  return dataOf<ReelComment>(response);
}

export async function editComment(commentId: string, text: string) {
  const response = await apiClient.patch<{ data: ReelComment }>(`/comments/${commentId}`, { text });
  return dataOf<ReelComment>(response);
}

export async function deleteComment(commentId: string) {
  await apiClient.delete(`/comments/${commentId}`);
}
