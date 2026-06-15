export interface RegisterDto {
  username: string;
  email: string;
  password: string;
}

export interface LoginDto {
  identity: string;
  password: string;
}

export interface AuthResponseDto {
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface RefreshDto {
  refreshToken: string;
}

export interface LogoutDto {
  refreshToken: string;
}
