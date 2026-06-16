import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    try {
      const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      if (token) {
        console.log('[TokenStorage] getAccessToken: present');
      } else {
        console.log('[TokenStorage] getAccessToken: absent');
      }
      return token;
    } catch (error) {
      console.log('[TokenStorage] Error reading access token');
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      const token = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (token) {
        console.log('[TokenStorage] getRefreshToken: present');
      } else {
        console.log('[TokenStorage] getRefreshToken: absent');
      }
      return token;
    } catch (error) {
      console.log('[TokenStorage] Error reading refresh token');
      return null;
    }
  },

  async setTokens({ accessToken, refreshToken }: TokenPair): Promise<void> {
    try {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      console.log('[TokenStorage] setTokens: success');
    } catch (error) {
      console.log('[TokenStorage] Error saving tokens');
    }
  },

  async clearTokens(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      console.log('[TokenStorage] clearTokens: success');
    } catch (error) {
      console.log('[TokenStorage] Error clearing tokens');
    }
  },
};
