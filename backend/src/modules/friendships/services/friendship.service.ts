import sequelize from '../../../shared/database/index';
import { FriendshipRepository } from '../repositories/friendship.repository';
import type { SendFriendRequestDto, SendFriendRequestResponseDto } from '../dtos/friendship.dto';
import { AppError } from '../../../shared/utils/appError';

export class FriendshipService {
  /**
   * Processes a friend request from senderId to receiverIdentity.
   */
  public static async sendFriendRequest(
    senderId: string,
    dto: SendFriendRequestDto,
  ): Promise<SendFriendRequestResponseDto> {
    const receiverIdentity = dto.receiverIdentity.trim();

    // 1. Find the receiver user by username or email
    const receiver = await FriendshipRepository.findUserByIdentity(receiverIdentity);
    if (!receiver) {
      throw new AppError('Không tìm thấy người dùng.', 404, 'USER_NOT_FOUND');
    }

    // 2. Check if sender and receiver are the same user
    if (receiver.id === senderId) {
      throw new AppError(
        'Không thể gửi lời mời kết bạn cho chính mình.',
        400,
        'SENDER_AND_RECEIVER_ARE_SAME',
      );
    }

    const transaction = await sequelize.transaction();
    try {
      // 3. Find any existing friendship record between these two users (any direction)
      const friendships = await FriendshipRepository.findFriendshipBetweenUsers(
        senderId,
        receiver.id,
        transaction,
      );

      if (friendships.length > 0) {
        const friendship = friendships[0];

        // Case: Already friends
        if (friendship.status === 'accepted') {
          throw new AppError('Hai người đã là bạn bè.', 400, 'ALREADY_FRIENDS');
        }

        // Case: Pending request exists
        if (friendship.status === 'pending') {
          if (friendship.sender_id === senderId) {
            // Already sent from A -> B
            throw new AppError(
              'Đã gửi lời mời kết bạn trước đó.',
              400,
              'FRIEND_REQUEST_ALREADY_SENT',
            );
          } else {
            // Reverse pending exists (B -> A). Auto-accept request.
            await FriendshipRepository.updateFriendshipStatus(
              friendship.id,
              'accepted',
              transaction,
            );
            await transaction.commit();
            return {
              message: 'Hai bạn đã trở thành bạn bè.',
            };
          }
        }

        // Case: Previously rejected
        if (friendship.status === 'rejected') {
          if (friendship.sender_id === senderId) {
            // A sent before and B rejected it. Re-activate the request to pending.
            await FriendshipRepository.updateFriendshipStatus(
              friendship.id,
              'pending',
              transaction,
            );
            await transaction.commit();
            return {
              message: 'Đã gửi lời mời kết bạn thành công.',
            };
          } else {
            // B sent before and A rejected it. Re-activate and swap the direction (A -> B pending).
            await FriendshipRepository.updateFriendshipDirectionAndStatus(
              friendship.id,
              senderId,
              receiver.id,
              'pending',
              transaction,
            );
            await transaction.commit();
            return {
              message: 'Đã gửi lời mời kết bạn thành công.',
            };
          }
        }
      }

      // Case: No previous relationship record. Create a new one.
      await FriendshipRepository.createFriendRequest(senderId, receiver.id, transaction);
      await transaction.commit();
      return {
        message: 'Đã gửi lời mời kết bạn thành công.',
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
