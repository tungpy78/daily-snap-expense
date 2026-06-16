import { type Transaction } from 'sequelize';
import { Reaction } from '../../../shared/models/reaction.model';

export class ReactionRepository {
  /**
   * Finds a reaction by snap ID and user ID.
   */
  public static async findBySnapAndUser(
    snapId: string,
    userId: string,
    transaction?: Transaction,
  ): Promise<Reaction | null> {
    return Reaction.findOne({
      where: {
        snap_id: snapId,
        user_id: userId,
      },
      transaction,
    });
  }

  /**
   * Creates a new reaction.
   */
  public static async createReaction(
    data: { snap_id: string; user_id: string; emoji: string },
    transaction?: Transaction,
  ): Promise<Reaction> {
    return Reaction.create(
      {
        snap_id: data.snap_id,
        user_id: data.user_id,
        emoji: data.emoji,
      },
      { transaction },
    );
  }

  /**
   * Updates emoji of a reaction by its ID.
   */
  public static async updateEmojiById(
    id: string,
    emoji: string,
    transaction?: Transaction,
  ): Promise<[number]> {
    return Reaction.update(
      { emoji },
      {
        where: { id },
        transaction,
      },
    );
  }
}
