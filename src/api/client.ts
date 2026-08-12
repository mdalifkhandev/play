import axios from 'axios';
import { router } from 'expo-router';
import { useAppStore } from '../store';

// Get the base URL from environment variables
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const API_BASE_URL = BASE_URL ? `${BASE_URL.replace(/\/$/, '')}/api/v1` : undefined;

// eslint-disable-next-line import/no-named-as-default-member
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const AUTH_ERROR_CODES = new Set([
  'ACCESS_TOKEN_INVALID',
  'ACCESS_TOKEN_EXPIRED',
  'ACCESS_TOKEN_REQUIRED',
  'INVALID_ACCESS_TOKEN',
  'SESSION_REVOKED',
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

let hasRedirectedToLogin = false;

const logoutAndRedirectToLogin = () => {
  useAppStore.getState().logout();

  if (!hasRedirectedToLogin) {
    hasRedirectedToLogin = true;
    router.replace('/(auth)/login');
    setTimeout(() => {
      hasRedirectedToLogin = false;
    }, 1000);
  }
};

// Example of how you might add an interceptor for authentication tokens later
apiClient.interceptors.request.use(
  (config) => {
    if (!API_BASE_URL) {
      return Promise.reject(new Error('EXPO_PUBLIC_API_URL is not configured.'));
    }

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

export const refreshAccessToken = async () => {
  if (!API_BASE_URL) {
    throw new Error('EXPO_PUBLIC_API_URL is not configured.');
  }

  const refreshToken = useAppStore.getState().refreshToken;

  if (!refreshToken) {
    throw new Error('Refresh token is missing.');
  }

  const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken }, { timeout: 30000 });
  const newAccessToken = data?.data?.tokens?.accessToken;
  const newRefreshToken = data?.data?.tokens?.refreshToken || refreshToken;

  if (!newAccessToken) {
    throw new Error('No access token returned');
  }

  useAppStore.getState().setAuth(newAccessToken, newRefreshToken, useAppStore.getState().user);
  return newAccessToken;
};

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
    const requestUrl = String(originalRequest?.url || '');

    if (isAuthError(error) && originalRequest && !originalRequest._retry && !requestUrl.includes('/auth/refresh')) {
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
        logoutAndRedirectToLogin();
        return Promise.reject(error);
      }

      try {
        const newAccessToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        logoutAndRedirectToLogin();
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
