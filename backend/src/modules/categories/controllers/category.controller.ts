import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';
import { AppError } from '../../../shared/utils/appError';

export class CategoryController {
  /**
   * Controller action for GET /api/v1/categories.
   * Retrieves all default and custom categories available for the logged-in user.
   */
  public static async getCategories(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        throw new AppError('Bạn chưa xác thực. Vui lòng đăng nhập.', 401, 'UNAUTHORIZED');
      }

      const userId = req.user.id;
      const categories = await CategoryService.getAvailableCategories(userId);

      res.status(200).json({
        success: true,
        data: {
          categories,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Controller action for POST /api/v1/categories.
   * Creates a new custom category for the logged-in user.
   */
  public static async createCategory(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        throw new AppError('Bạn chưa xác thực. Vui lòng đăng nhập.', 401, 'UNAUTHORIZED');
      }

      const userId = req.user.id;
      const category = await CategoryService.createCustomCategory(userId, req.body);

      res.status(201).json({
        success: true,
        data: {
          category,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
