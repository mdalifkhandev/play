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

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isAuthError(error)) {
      useAppStore.getState().logout();
      router.replace('/(auth)/login');
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
