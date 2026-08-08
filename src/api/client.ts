import axios from 'axios';
import { router } from 'expo-router';

// Get the base URL from environment variables
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
    'origin': 'http://localhost:3000',
  },
});

import { useAppStore } from '../store';

const AUTH_ERROR_CODES = new Set([
  'ACCESS_TOKEN_INVALID',
  'ACCESS_TOKEN_EXPIRED',
  'ACCESS_TOKEN_REQUIRED',
  'INVALID_ACCESS_TOKEN',
  'TOKEN_EXPIRED',
]);

const isAuthError = (error: any) => {
  const status = error?.response?.status;
  const errorData = error?.response?.data?.error;
  const code = errorData?.code;
  const message = String(errorData?.message || error?.response?.data?.message || '').toLowerCase();

  return (
    status === 401 ||
    AUTH_ERROR_CODES.has(code) ||
    message.includes('access token is invalid') ||
    message.includes('access token') && message.includes('expired')
  );
};

// Example of how you might add an interceptor for authentication tokens later
apiClient.interceptors.request.use(
  (config) => {
    const token = useAppStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Token refresh logic
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (isAuthError(error) && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      const refreshToken = useAppStore.getState().refreshToken;

      if (!refreshToken) {
        useAppStore.getState().logout();
        router.replace('/(auth)/login');
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/api/v1/auth/refresh-token`, { refreshToken });
        const newAccessToken = data?.data?.tokens?.accessToken;
        const newRefreshToken = data?.data?.tokens?.refreshToken || refreshToken;

        if (newAccessToken) {
          useAppStore.getState().setAuth(newAccessToken, newRefreshToken, useAppStore.getState().user);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          return apiClient(originalRequest);
        } else {
          throw new Error('No access token returned');
        }
      } catch (err) {
        processQueue(err, null);
        useAppStore.getState().logout();
        router.replace('/(auth)/login');
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const handleApiError = (error: any, defaultMessage: string = 'Something went wrong') => {
  const errorData = error?.response?.data?.error;
  const status = error?.response?.status;
  
  if (errorData?.fieldErrors && errorData.fieldErrors.length > 0) {
    return errorData.fieldErrors[0].message;
  }

  if (errorData?.message) {
    return errorData.message;
  }

  if (status === 502) {
    return 'Server could not reach Cloudinary or the music provider. Please try again.';
  }

  if (status === 503) {
    return 'Server service is not configured or temporarily unavailable.';
  }
  
  return error?.response?.data?.message || error?.message || defaultMessage;
};
