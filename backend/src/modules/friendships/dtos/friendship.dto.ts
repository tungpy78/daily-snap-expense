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
