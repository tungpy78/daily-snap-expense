import { Request, Response, NextFunction } from 'express';
import { FriendshipService } from '../services/friendship.service';
import { AppError } from '../../../shared/utils/appError';
import type { FriendFeedQueryDto } from '../dtos/friendship.dto';

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

  /**
   * Controller action for PUT /api/v1/friends/request/:id.
   */
  public static async respondFriendRequest(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        throw new AppError('Bạn chưa xác thực. Vui lòng đăng nhập.', 401, 'UNAUTHORIZED');
      }

      const currentUserId = req.user.id;
      const friendshipId = req.params.id;
      const responseData = await FriendshipService.respondFriendRequest(
        currentUserId,
        friendshipId,
        req.body,
      );

      res.status(200).json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Controller action for GET /api/v1/friends/feed.
   */
  public static async getFriendFeed(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        throw new AppError('Bạn chưa xác thực. Vui lòng đăng nhập.', 401, 'UNAUTHORIZED');
      }

      const userId = req.user.id;
      const query = req.query as unknown as FriendFeedQueryDto;
      const responseData = await FriendshipService.getFriendFeed(userId, query);

      res.status(200).json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      next(error);
    }
  }
}
