import type { Request, Response, NextFunction } from 'express';
import { ExpenseService } from '../services/expense.service';
import { AppError } from '../../../shared/utils/appError';
import type { ExpenseListQueryDto } from '../dtos/expense.dto';

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

  /**
   * Controller action for GET /api/v1/expenses.
   * Retrieves a paginated and filtered list of expenses for the authenticated user.
   */
  public static async getExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        throw new AppError('Bạn chưa xác thực. Vui lòng đăng nhập.', 401, 'UNAUTHORIZED');
      }

      const userId = req.user.id;
      const query = req.query as unknown as ExpenseListQueryDto;
      const listData = await ExpenseService.getExpensesList(userId, query);

      res.status(200).json({
        success: true,
        data: listData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Controller action for PUT /api/v1/expenses/:id.
   * Updates an existing manual expense for the authenticated user.
   */
  public static async updateExpense(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        throw new AppError('Bạn chưa xác thực. Vui lòng đăng nhập.', 401, 'UNAUTHORIZED');
      }

      const userId = req.user.id;
      const expenseId = req.params.id;
      const expense = await ExpenseService.updateExpense(userId, expenseId, req.body);

      res.status(200).json({
        success: true,
        data: {
          expense,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Controller action for DELETE /api/v1/expenses/:id.
   * Soft deletes an existing manual expense for the authenticated user.
   */
  public static async deleteExpense(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        throw new AppError('Bạn chưa xác thực. Vui lòng đăng nhập.', 401, 'UNAUTHORIZED');
      }

      const userId = req.user.id;
      const expenseId = req.params.id;
      const result = await ExpenseService.deleteExpense(userId, expenseId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
