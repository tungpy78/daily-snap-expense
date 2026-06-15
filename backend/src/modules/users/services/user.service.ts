import { UserRepository } from '../repositories/user.repository';
import { AppError } from '../../../shared/utils/appError';
import type { UserProfileDto, UpdateProfileDto, UpdateProfileResponseDto } from '../dtos/user.dto';
import { LocalStorageProvider } from '../../../shared/storage/local-storage.provider';
import { User } from '../../../shared/models/user.model';

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

  /**
   * Updates user profile details (username and/or avatar).
   * Ensures username is normalized, verified for duplication (if changed),
   * handles avatar upload using StorageService, handles database updates,
   * performs cleanup of the new avatar if update fails, and deletes the old
   * avatar on successful update.
   */
  public static async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    file?: Express.Multer.File,
  ): Promise<UpdateProfileResponseDto> {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new AppError('Người dùng không tồn tại.', 404, 'USER_NOT_FOUND');
    }

    if (dto.username) {
      const normalizedUsername = dto.username.trim().toLowerCase();
      if (normalizedUsername !== user.username) {
        const existingUser = await UserRepository.findByUsername(normalizedUsername);
        if (existingUser) {
          throw new AppError('Tên đăng nhập đã tồn tại.', 400, 'USERNAME_ALREADY_EXISTS');
        }
      }
    }

    let newAvatarUrl: string | undefined;
    const storageProvider = new LocalStorageProvider();

    if (file) {
      newAvatarUrl = await storageProvider.uploadImage(file, 'avatars');
    }

    const updateData: { username?: string; avatar_url?: string | null } = {};
    if (dto.username) {
      updateData.username = dto.username.trim().toLowerCase();
    }
    if (newAvatarUrl) {
      updateData.avatar_url = newAvatarUrl;
    }

    let updatedUser: User | null = null;
    try {
      updatedUser = await UserRepository.updateProfileById(userId, updateData);
      if (!updatedUser) {
        throw new AppError('Cập nhật thông tin thất bại.', 500, 'DATABASE_ERROR');
      }
    } catch (dbError) {
      if (newAvatarUrl) {
        try {
          await storageProvider.deleteImage(newAvatarUrl);
        } catch (cleanupError) {
          console.error(
            '[Storage] Failed to cleanup new avatar after DB update error:',
            cleanupError,
          );
        }
      }
      throw dbError;
    }

    if (newAvatarUrl && user.avatar_url) {
      try {
        await storageProvider.deleteImage(user.avatar_url);
      } catch (deleteOldError) {
        console.error('[Storage] Failed to delete old avatar:', deleteOldError);
      }
    }

    return {
      id: updatedUser.id,
      username: updatedUser.username,
      avatarUrl: updatedUser.avatar_url,
    };
  }
}
