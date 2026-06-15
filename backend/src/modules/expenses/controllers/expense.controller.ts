import type { Request, Response, NextFunction } from 'express';
import { ExpenseService } from '../services/expense.service';
import { AppError } from '../../../shared/utils/appError';

export class ExpenseController {
  /**
   * Controller action for POST /api/v1/expenses.
   * Creates a manual expense for the authenticated user.
   */
  public static async createExpense(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        throw new AppError('Bạn chưa xác thực. Vui lòng đăng nhập.', 401, 'UNAUTHORIZED');
      }

      const userId = req.user.id;
      const expense = await ExpenseService.createManualExpense(userId, req.body);

      res.status(201).json({
        success: true,
        data: {
          expense,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
