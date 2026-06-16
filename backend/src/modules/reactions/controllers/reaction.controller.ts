import { Request, Response, NextFunction } from 'express';
import { ReactionService } from '../services/reaction.service';
import { AppError } from '../../../shared/utils/appError';

export class ReactionController {
  /**
   * Controller action for POST /api/v1/snaps/:id/react.
   */
  public static async reactToSnap(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        throw new AppError('Bạn chưa xác thực. Vui lòng đăng nhập.', 401, 'UNAUTHORIZED');
      }

      const currentUserId = req.user.id;
      const snapId = req.params.id;
      const dto = req.body;

      const responseData = await ReactionService.reactToSnap(currentUserId, snapId, dto);

      res.status(200).json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      next(error);
    }
  }
}
