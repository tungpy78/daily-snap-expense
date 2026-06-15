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
}
