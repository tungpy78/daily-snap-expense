import sequelize from '../../../shared/database/index';
import { ReactionRepository } from '../repositories/reaction.repository';
import { SnapRepository } from '../../snaps/repositories/snap.repository';
import { FriendshipRepository } from '../../friendships/repositories/friendship.repository';
import type { ReactToSnapDto, ReactToSnapResponseDto } from '../dtos/reaction.dto';
import { AppError } from '../../../shared/utils/appError';

export class ReactionService {
  /**
   * Adds or updates a reaction on a snap.
   */
  public static async reactToSnap(
    currentUserId: string,
    snapId: string,
    dto: ReactToSnapDto,
  ): Promise<ReactToSnapResponseDto> {
    const trimmedEmoji = dto.emoji.trim();

    // 1. Find snap
    const snap = await SnapRepository.findById(snapId);
    if (!snap) {
      throw new AppError('Không tìm thấy khoảnh khắc.', 404, 'SNAP_NOT_FOUND');
    }

    // 2. Validate ownership & private sharing rules
    if (snap.user_id !== currentUserId) {
      if (snap.is_private) {
        throw new AppError('Bạn không có quyền thực hiện hành động này.', 403, 'FORBIDDEN');
      }

      // Check friendship
      const areFriends = await FriendshipRepository.areAcceptedFriends(currentUserId, snap.user_id);
      if (!areFriends) {
        throw new AppError('Bạn không có quyền thực hiện hành động này.', 403, 'FORBIDDEN');
      }
    }

    // 3. Upsert reaction in transaction
    const transaction = await sequelize.transaction();
    try {
      const existingReaction = await ReactionRepository.findBySnapAndUser(
        snapId,
        currentUserId,
        transaction,
      );
      if (existingReaction) {
        await ReactionRepository.updateEmojiById(existingReaction.id, trimmedEmoji, transaction);
      } else {
        await ReactionRepository.createReaction(
          {
            snap_id: snapId,
            user_id: currentUserId,
            emoji: trimmedEmoji,
          },
          transaction,
        );
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    return {
      message: 'Đã thả cảm xúc thành công.',
    };
  }
}
