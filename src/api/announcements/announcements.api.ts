import { apiClient } from '../client';

export type AnnouncementPlacement =
  | 'home_banner'
  | 'notification_tab'
  | 'inbox_notice'
  | 'profile_notice'
  | 'live_notice'
  | 'login_notice'
  | 'maintenance';

export type AnnouncementItem = {
  id: string;
  title: string;
  message: string;
  audience: 'all' | 'creators' | 'premium';
  placement: AnnouncementPlacement;
  status: 'draft' | 'scheduled' | 'active' | 'expired' | 'paused';
  priority: number;
  startsAt?: string;
  endsAt?: string;
  scheduledFor?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
};

export async function getActiveAnnouncements() {
  const response = await apiClient.get<{ data: AnnouncementItem[] }>('/announcements/active');
  return response.data.data;
}
