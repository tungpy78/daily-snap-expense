import { Request, Response, NextFunction } from 'express';
import { FriendshipService } from '../services/friendship.service';
import { AppError } from '../../../shared/utils/appError';

export class FriendshipController {
  /**
   * Controller action for POST /api/v1/friends/request.
   */
  public static async sendFriendRequest(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        throw new AppError('Bạn chưa xác thực. Vui lòng đăng nhập.', 401, 'UNAUTHORIZED');
      }

      const senderId = req.user.id;
      const responseData = await FriendshipService.sendFriendRequest(senderId, req.body);

      res.status(200).json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      next(error);
    }
  }
}
