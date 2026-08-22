export type PushTokenPlatform = 'ios' | 'android' | 'web';

export interface RegisterPushTokenRequest {
  token: string;
  platform: PushTokenPlatform;
  deviceId?: string;
  appVersion?: string;
}

export interface RegisterPushTokenResponse {
  tokenId: string;
  activeDeviceCount: number;
}

export type NotificationType = 'like' | 'comment' | 'follow' | 'milestone' | 'system';

export interface NotificationActor {
  _id: string;
  email?: string;
  username?: string;
  name?: string;
  profilePicture?: string;
  profile?: {
    displayName?: string;
    username?: string;
    photoUrl?: string;
  };
}

export interface NotificationItem {
  _id: string;
  userId: string;
  actorId?: NotificationActor;
  type: NotificationType;
  title?: string;
  body?: string;
  relatedEntityId?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetNotificationsResponse {
  items: NotificationItem[];
  nextCursor: string | null;
}

export interface MarkNotificationsAsReadRequest {
  notificationIds?: string[];
}
