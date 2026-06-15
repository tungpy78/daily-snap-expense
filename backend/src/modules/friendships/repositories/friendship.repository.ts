import { Op, type Transaction } from 'sequelize';
import { Friendship } from '../../../shared/models/friendship.model';
import { User } from '../../../shared/models/user.model';
import type { FriendshipStatus } from '../dtos/friendship.dto';

export class FriendshipRepository {
  /**
   * Finds an active user by their email or username.
   */
  public static async findUserByIdentity(identity: string): Promise<User | null> {
    const normalized = identity.trim().toLowerCase();
    return User.findOne({
      where: {
        [Op.or]: [{ email: normalized }, { username: normalized }],
        is_active: true,
      },
    });
  }

  /**
   * Finds all friendship records between two users in both directions.
   */
  public static async findFriendshipBetweenUsers(
    userAId: string,
    userBId: string,
    transaction?: Transaction,
  ): Promise<Friendship[]> {
    return Friendship.findAll({
      where: {
        [Op.or]: [
          { sender_id: userAId, receiver_id: userBId },
          { sender_id: userBId, receiver_id: userAId },
        ],
      },
      transaction,
    });
  }

  /**
   * Creates a new pending friend request.
   */
  public static async createFriendRequest(
    senderId: string,
    receiverId: string,
    transaction?: Transaction,
  ): Promise<Friendship> {
    return Friendship.create(
      {
        sender_id: senderId,
        receiver_id: receiverId,
        status: 'pending',
      },
      { transaction },
    );
  }

  /**
   * Updates the status of an existing friendship.
   */
  public static async updateFriendshipStatus(
    id: string,
    status: FriendshipStatus,
    transaction?: Transaction,
  ): Promise<[number]> {
    return Friendship.update(
      { status },
      {
        where: { id },
        transaction,
      },
    );
  }

  /**
   * Updates both direction (sender/receiver) and status of an existing friendship.
   */
  public static async updateFriendshipDirectionAndStatus(
    id: string,
    senderId: string,
    receiverId: string,
    status: FriendshipStatus,
    transaction?: Transaction,
  ): Promise<[number]> {
    return Friendship.update(
      {
        sender_id: senderId,
        receiver_id: receiverId,
        status,
      },
      {
        where: { id },
        transaction,
      },
    );
  }
}
