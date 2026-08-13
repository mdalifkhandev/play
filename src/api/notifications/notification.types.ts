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
