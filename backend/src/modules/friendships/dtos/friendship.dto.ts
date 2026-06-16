export interface SendFriendRequestDto {
  receiverIdentity: string;
}

export interface SendFriendRequestResponseDto {
  message: string;
}

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected';

export type FriendRequestAction = 'ACCEPT' | 'DECLINE';

export interface RespondFriendRequestDto {
  action: FriendRequestAction;
}

export interface RespondFriendRequestResponseDto {
  message: string;
}

export interface FriendFeedQueryDto {
  limit: number;
  offset: number;
}

export interface FriendFeedItemDto {
  id: string;
  username: string;
  avatarUrl: string | null;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
  reactions: [];
}

export interface FriendFeedResponseDto {
  feed: FriendFeedItemDto[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}
