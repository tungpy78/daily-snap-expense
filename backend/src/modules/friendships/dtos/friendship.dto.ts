export interface SendFriendRequestDto {
  receiverIdentity: string;
}

export interface SendFriendRequestResponseDto {
  message: string;
}

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected';
