export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponseData {
  user: UserProfile;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface ProfileResponseData {
  user: UserProfile;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
