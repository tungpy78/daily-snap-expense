import { UserRepository } from '../repositories/user.repository';
import { AppError } from '../../../shared/utils/appError';
import type { UserProfileDto } from '../dtos/user.dto';

export class UserService {
  /**
   * Retrieves user profile details and returns a safe UserProfileDto.
   * Throws HTTP 404 if the user does not exist in the database.
   */
  public static async getUserProfile(userId: string): Promise<UserProfileDto> {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new AppError('Người dùng không tồn tại.', 404, 'USER_NOT_FOUND');
    }

    // Safely retrieve the created_at timestamp using Sequelize's getDataValue
    // and convert to Date object if it is returned as a string or number.
    const rawCreatedAt = user.getDataValue('created_at');
    const createdAtDate =
      rawCreatedAt instanceof Date ? rawCreatedAt : new Date(rawCreatedAt as string | number);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatar_url,
      createdAt: createdAtDate.toISOString(),
    };
  }
}
