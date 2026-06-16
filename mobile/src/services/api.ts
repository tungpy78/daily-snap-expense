import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from './token';
import { API_BASE_URL } from '../config/env';

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

interface RefreshResponse {
  success: boolean;
  data: {
    accessToken: string;
  };
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Separate instance for refreshing to avoid interceptor loop
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await tokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[ApiClient] Request: attached Authorization header');
    } else {
      console.log('[ApiClient] Request: no token found');
    }
    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: unknown) => {
    // If it's not an Axios error or doesn't have config, reject
    if (!axios.isAxiosError(error) || !error.config) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetriableRequestConfig;

    // We only intercept 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('[ApiClient] Response 401 encountered, starting token refresh flow...');
      
      if (isRefreshing) {
        console.log('[ApiClient] Token refresh is already in progress, queuing request...');
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err: unknown) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await tokenStorage.getRefreshToken();
        if (!refreshToken) {
          console.log('[ApiClient] No refresh token found, aborting refresh');
          throw new Error('Refresh token not found');
        }

        console.log('[ApiClient] Sending refresh token request...');
        const refreshResponse = await refreshClient.post<RefreshResponse>('/auth/refresh', {
          refreshToken,
        });

        const newAccessToken = refreshResponse.data.data.accessToken;
        console.log('[ApiClient] Token refresh successful, updating tokens');

        // Store the new access token along with the existing refresh token
        await tokenStorage.setTokens({
          accessToken: newAccessToken,
          refreshToken,
        });

        isRefreshing = false;
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.log('[ApiClient] Token refresh failed, clearing session');
        isRefreshing = false;
        processQueue(refreshError, null);
        await tokenStorage.clearTokens();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
