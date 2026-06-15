import type { Transaction } from 'sequelize';
import { RefreshToken } from '../../../shared/models/refresh-token.model';

export interface CreateRefreshTokenData {
  id: string; // The JTI (UUID)
  userId: string;
  expiresAt: Date;
}

export class RefreshTokenRepository {
  /**
   * Creates a new refresh token record.
   */
  public static async create(
    data: CreateRefreshTokenData,
    transaction?: Transaction,
  ): Promise<RefreshToken> {
    const { id, userId, expiresAt } = data;
    return RefreshToken.create(
      {
        id,
        user_id: userId,
        expires_at: expiresAt,
      },
      { transaction },
    );
  }

  /**
   * Finds a refresh token by its ID (JTI).
   */
  public static async findById(
    id: string,
    transaction?: Transaction,
  ): Promise<RefreshToken | null> {
    return RefreshToken.findOne({
      where: { id },
      transaction,
    });
  }

  /**
   * Deletes a refresh token record by its ID (JTI).
   */
  public static async deleteById(id: string, transaction?: Transaction): Promise<number> {
    return RefreshToken.destroy({
      where: { id },
      transaction,
    });
  }

  /**
   * Deletes a refresh token by ID (JTI) and returns the number of affected rows (0 or 1).
   */
  public static async deleteExistingById(id: string, transaction?: Transaction): Promise<number> {
    return RefreshToken.destroy({
      where: {
        id,
      },
      transaction,
    });
  }

  /**
   * Deletes all refresh tokens for a user.
   */
  public static async deleteByUserId(userId: string, transaction?: Transaction): Promise<number> {
    return RefreshToken.destroy({
      where: { user_id: userId },
      transaction,
    });
  }
}
