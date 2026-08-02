import axios from 'axios';

// Get the base URL from environment variables
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Example of how you might add an interceptor for authentication tokens later
apiClient.interceptors.request.use(
  (config) => {
    // const token = useAuthStore.getState().token;
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle global errors here (e.g., 401 unauthorized -> redirect to login)
    return Promise.reject(error);
  }
);
