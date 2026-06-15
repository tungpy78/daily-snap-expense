import { Request, Response, NextFunction } from 'express';
import { SnapService } from '../services/snap.service';
import { AppError } from '../../../shared/utils/appError';
import type { TimelineQueryDto } from '../dtos/snap.dto';

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

  /**
   * Controller action for GET /api/v1/snaps/timeline.
   * Delegates query parsing and retrieval to SnapService and returns 200 OK.
   */
  public static async getTimeline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        throw new AppError('Bạn chưa xác thực. Vui lòng đăng nhập.', 401, 'UNAUTHORIZED');
      }

      const userId = req.user.id;
      const query = req.query as unknown as TimelineQueryDto;
      const responseData = await SnapService.getTimeline(userId, query);

      res.status(200).json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Controller action for DELETE /api/v1/snaps/:id.
   * Soft deletes the target snap after verifying authentication and ownership.
   */
  public static async deleteSnap(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        throw new AppError('Bạn chưa xác thực. Vui lòng đăng nhập.', 401, 'UNAUTHORIZED');
      }

      const userId = req.user.id;
      const snapId = req.params.id;
      const responseData = await SnapService.deleteSnap(userId, snapId);

      res.status(200).json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      next(error);
    }
  }
}
