import { create } from 'zustand';
import { apiClient } from '../../../services/api';
import { tokenStorage } from '../../../services/token';
import { UserProfile, AuthResponseData } from '../types/auth.types';
import axios from 'axios';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const getBackendErrorMessage = (data: unknown): string | null => {
  if (!isRecord(data)) {
    return null;
  }

  const errorValue = data.error;

  if (!isRecord(errorValue)) {
    return null;
  }

  const messageValue = errorValue.message;

  if (typeof messageValue !== 'string' || messageValue.trim().length === 0) {
    return null;
  }

  return messageValue;
};

export const extractApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const backendMessage = getBackendErrorMessage(error.response?.data);

    if (backendMessage) {
      return backendMessage;
    }

    if (!error.response) {
      return 'Không thể kết nối máy chủ. Vui lòng kiểm tra backend hoặc mạng Wi-Fi.';
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return 'Đã xảy ra lỗi. Vui lòng thử lại.';
};

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  restoreSession: () => Promise<void>;
  login: (identity: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  restoreSession: async () => {
    set({ isLoading: true, error: null });
    try {
      const accessToken = await tokenStorage.getAccessToken();
      const refreshToken = await tokenStorage.getRefreshToken();

      if (!accessToken && !refreshToken) {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });
        return;
      }

      const response = await apiClient.get<{ success: boolean; data: { user: UserProfile } }>('/users/profile');

      if (response.data && response.data.success) {
        const currentAccessToken = await tokenStorage.getAccessToken();
        set({
          user: response.data.data.user,
          accessToken: currentAccessToken || accessToken,
          isAuthenticated: true,
        });
      } else {
        await tokenStorage.clearTokens();
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });
      }
    } catch (error) {
      console.log('[AuthStore] restoreSession: failed', error);
      await tokenStorage.clearTokens();
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (identity, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<{ success: boolean; data: AuthResponseData }>('/auth/login', {
        identity,
        password,
      });

      if (response.data && response.data.success) {
        const { user, tokens } = response.data.data;
        const accessToken = tokens?.accessToken;
        const refreshToken = tokens?.refreshToken;

        const hasAccessToken = typeof accessToken === 'string' && accessToken.length > 0;
        const hasRefreshToken = typeof refreshToken === 'string' && refreshToken.length > 0;

        console.log(`[AuthStore] login response metadata - hasAccessToken: ${hasAccessToken}, hasRefreshToken: ${hasRefreshToken}`);

        if (!hasAccessToken || !hasRefreshToken) {
          throw new Error('Không nhận được token hợp lệ từ máy chủ.');
        }

        await tokenStorage.setTokens({ accessToken, refreshToken });
        set({
          user,
          accessToken,
          isAuthenticated: true,
        });
      } else {
        throw new Error('Đăng nhập thất bại.');
      }
    } catch (error: unknown) {
      const message = extractApiErrorMessage(error);
      console.log('[AuthStore] login failed metadata', {
        message,
        hasBackendResponse: axios.isAxiosError(error) && Boolean(error.response),
      });
      set({ error: message, isAuthenticated: false });
      throw new Error(message);
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (username, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post<{ success: boolean; data: AuthResponseData }>('/auth/register', {
        username,
        email,
        password,
      });

      if (response.data && response.data.success) {
        const { user, tokens } = response.data.data;
        const accessToken = tokens?.accessToken;
        const refreshToken = tokens?.refreshToken;

        const hasAccessToken = typeof accessToken === 'string' && accessToken.length > 0;
        const hasRefreshToken = typeof refreshToken === 'string' && refreshToken.length > 0;

        console.log(`[AuthStore] register response metadata - hasAccessToken: ${hasAccessToken}, hasRefreshToken: ${hasRefreshToken}`);

        if (!hasAccessToken || !hasRefreshToken) {
          throw new Error('Không nhận được token hợp lệ từ máy chủ.');
        }

        await tokenStorage.setTokens({ accessToken, refreshToken });
        set({
          user,
          accessToken,
          isAuthenticated: true,
        });
      } else {
        throw new Error('Đăng ký thất bại.');
      }
    } catch (error: unknown) {
      const message = extractApiErrorMessage(error);
      console.log('[AuthStore] register failed metadata', {
        message,
        hasBackendResponse: axios.isAxiosError(error) && Boolean(error.response),
      });
      set({ error: message, isAuthenticated: false });
      throw new Error(message);
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.log('[AuthStore] logout api error (swallowed):', error);
    } finally {
      await tokenStorage.clearTokens();
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
