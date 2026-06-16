import { Request, Response, NextFunction } from 'express';
import { StatisticsService } from '../services/statistics.service';
import { AppError } from '../../../shared/utils/appError';

export class StatisticsController {
  /**
   * Controller action for GET /api/v1/statistics.
   */
  public static async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        throw new AppError('Bạn chưa xác thực. Vui lòng đăng nhập.', 401, 'UNAUTHORIZED');
      }

      const currentUserId = req.user.id;

      // Extract validated values
      const validatedQuery = req.query as { month?: number; year?: number };

      const now = new Date();
      const targetMonth = validatedQuery.month ?? now.getMonth() + 1;
      const targetYear = validatedQuery.year ?? now.getFullYear();

      // current date format YYYY-MM-DD
      const y = now.getFullYear();
      const m = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const queryDate = `${y}-${m}-${day}`;

      const responseData = await StatisticsService.getStatisticsSummary(
        currentUserId,
        queryDate,
        targetYear,
        targetMonth,
      );

      res.status(200).json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      next(error);
    }
  }
}
