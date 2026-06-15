import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { AppError } from '../../../shared/utils/appError';

export class UserController {
  /**
   * Controller action for GET /api/v1/users/profile.
   * Extracts authenticated user ID, delegates retrieval to UserService,
   * and returns the standard successful response.
   */
  public static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        throw new AppError('Bạn chưa xác thực. Vui lòng đăng nhập.', 401, 'UNAUTHORIZED');
      }

      const userId = req.user.id;
      const userProfile = await UserService.getUserProfile(userId);

      res.status(200).json({
        success: true,
        data: {
          user: userProfile,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Controller action for PUT /api/v1/users/profile.
   * Validates presence of at least one update field, calls UserService.updateProfile,
   * and returns the safe response DTO.
   */
  public static async updateProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        throw new AppError('Bạn chưa xác thực. Vui lòng đăng nhập.', 401, 'UNAUTHORIZED');
      }

      const userId = req.user.id;

      // Validate that at least one of username or avatar is present
      if (!req.body.username && !req.file) {
        throw new AppError(
          'Vui lòng cung cấp ít nhất username hoặc ảnh đại diện để cập nhật.',
          400,
          'VALIDATION_ERROR',
        );
      }

      const updatedProfile = await UserService.updateProfile(userId, req.body, req.file);

      res.status(200).json({
        success: true,
        data: {
          user: updatedProfile,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
