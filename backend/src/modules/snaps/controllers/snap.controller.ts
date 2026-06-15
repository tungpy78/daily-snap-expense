import { Request, Response, NextFunction } from 'express';
import { SnapService } from '../services/snap.service';
import { AppError } from '../../../shared/utils/appError';

export class SnapController {
  /**
   * Controller action for POST /api/v1/snaps.
   * Ensures auth validation, checks file presence, delegates creation to SnapService,
   * and returns 201 Created standard successful response.
   */
  public static async createSnap(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        throw new AppError('Bạn chưa xác thực. Vui lòng đăng nhập.', 401, 'UNAUTHORIZED');
      }

      if (!req.file) {
        throw new AppError('File ảnh là bắt buộc.', 400, 'VALIDATION_ERROR');
      }

      const userId = req.user.id;
      const responseData = await SnapService.createSnap(userId, req.file, req.body);

      res.status(201).json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      next(error);
    }
  }
}
