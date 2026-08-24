import { apiClient } from '../client';

export type ModerationTargetType = 'reel' | 'comment' | 'user' | 'profile';

export type ModerationReportReason =
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'violence'
  | 'nudity'
  | 'false_information'
  | 'copyright'
  | 'impersonation'
  | 'scam'
  | 'other';

export const moderationReportReasons: { label: string; value: ModerationReportReason }[] = [
  { label: 'Spam', value: 'spam' },
  { label: 'Harassment', value: 'harassment' },
  { label: 'Hate speech', value: 'hate_speech' },
  { label: 'Violence', value: 'violence' },
  { label: 'Nudity', value: 'nudity' },
  { label: 'False information', value: 'false_information' },
  { label: 'Copyright', value: 'copyright' },
  { label: 'Impersonation', value: 'impersonation' },
  { label: 'Scam', value: 'scam' },
  { label: 'Other', value: 'other' },
];

const targetPath: Record<ModerationTargetType, string> = {
  reel: 'reels',
  comment: 'comments',
  user: 'users',
  profile: 'profiles',
};

export async function reportContent(
  targetType: ModerationTargetType,
  targetId: string,
  reason: ModerationReportReason,
  details?: string,
) {
  const response = await apiClient.post<{ data: { reported: boolean } }>(
    `/reports/${targetPath[targetType]}/${targetId}`,
    {
      reason,
      ...(details?.trim() ? { details: details.trim() } : {}),
    },
  );

  return response.data.data;
}
