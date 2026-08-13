import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { registerPushToken } from '../../api/notifications';

const REGISTERED_PUSH_TOKEN_KEY = 'notifications:last-fcm-token';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useRegisterPushNotifications(isEnabled: boolean) {
  useEffect(() => {
    let isCancelled = false;

    const registerDevice = async () => {
      if (!isEnabled || !Device.isDevice) {
        return;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#98FF2F',
        });
      }

      const currentPermission = await Notifications.getPermissionsAsync();
      const finalPermission = currentPermission.granted
        ? currentPermission
        : await Notifications.requestPermissionsAsync();

      if (!finalPermission.granted || isCancelled) {
        return;
      }

      const devicePushToken = await Notifications.getDevicePushTokenAsync();
      const token = String(devicePushToken.data || '').trim();

      if (!token || isCancelled) {
        return;
      }

      const lastRegisteredToken = await AsyncStorage.getItem(REGISTERED_PUSH_TOKEN_KEY);

      if (lastRegisteredToken === token) {
        return;
      }

      await registerPushToken({
        token,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
        appVersion: Constants.expoConfig?.version,
      });

      await AsyncStorage.setItem(REGISTERED_PUSH_TOKEN_KEY, token);
    };

    registerDevice().catch((error) => {
      if (error?.response?.status === 404) {
        console.log('Push notification token API is not available on the running backend.');
        return;
      }

      console.log('Push notification registration failed:', error?.message ?? error);
    });

    return () => {
      isCancelled = true;
    };
  }, [isEnabled]);
}
