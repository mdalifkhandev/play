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

const REFRESH_LOGOUT_ERROR_CODES = new Set([
  'REFRESH_TOKEN_INVALID',
  'REFRESH_TOKEN_REQUIRED',
  'SESSION_REVOKED',
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

const shouldLogoutAfterRefreshFailure = (error: any) => {
  const status = error?.response?.status;
  const code = error?.response?.data?.error?.code;
  const message = String(error?.response?.data?.error?.message || error?.message || '').toLowerCase();

  return (
    status === 401 ||
    status === 403 ||
    REFRESH_LOGOUT_ERROR_CODES.has(code) ||
    message.includes('refresh token is invalid') ||
    message.includes('refresh token is required') ||
    message.includes('invalid or expired')
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
let refreshPromise: Promise<string> | null = null;

export const refreshAccessToken = async () => {
  if (!API_BASE_URL) {
    throw new Error('EXPO_PUBLIC_API_URL is not configured.');
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = useAppStore.getState().refreshToken;

  if (!refreshToken) {
    throw new Error('Refresh token is missing.');
  }

  refreshPromise = axios
    .post(`${API_BASE_URL}/auth/refresh`, { refreshToken }, { timeout: 30000 })
    .then(({ data }) => {
      const newAccessToken = data?.data?.tokens?.accessToken;
      const newRefreshToken = data?.data?.tokens?.refreshToken || refreshToken;

      if (!newAccessToken) {
        throw new Error('No access token returned');
      }

      useAppStore.getState().setAuth(newAccessToken, newRefreshToken, useAppStore.getState().user);
      
      if (__DEV__) {
        console.log('✅ TOKEN REFRESH SUCCESSFUL: New access token generated!');
      }
      
      return newAccessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
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

    if (__DEV__) {
      console.log('API error:', {
        method: originalRequest?.method,
        baseURL: originalRequest?.baseURL,
        url: requestUrl,
        status: error?.response?.status,
        code: error?.response?.data?.error?.code,
        message: error?.response?.data?.error?.message || error?.message,
      });
    }

    if (isAuthError(error) && originalRequest && !originalRequest._retry && !requestUrl.includes('/auth/refresh')) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers = originalRequest.headers || {};
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
        if (__DEV__) {
          console.log('❌ TOKEN REFRESH FAILED: No refresh token found. Logging out...');
        }
        logoutAndRedirectToLogin();
        return Promise.reject(error);
      }

      try {
        if (__DEV__) {
          console.log('🔄 ATTEMPTING TOKEN REFRESH...');
        }
        const newAccessToken = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        if (shouldLogoutAfterRefreshFailure(err)) {
          if (__DEV__) {
            console.log('Auth refresh failed; clearing stored session.');
          }
          logoutAndRedirectToLogin();
        }
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

  if (!error?.response && error?.message === 'Network Error') {
    return 'Network Error: app cannot reach the backend API. Check tunnel/backend server and phone internet.';
  }
  
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
