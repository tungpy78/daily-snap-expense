export interface UserProfileDto {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface UpdateProfileDto {
  username?: string;
}

export interface UpdateProfileResponseDto {
  id: string;
  username: string;
  avatarUrl: string | null;
}
