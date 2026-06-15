import { ExpenseRepository } from '../repositories/expense.repository';
import { CategoryRepository } from '../../categories/repositories/category.repository';
import { AppError } from '../../../shared/utils/appError';
import type {
  CreateExpenseDto,
  ExpenseDto,
  ExpenseListQueryDto,
  ExpenseListResponseDto,
} from '../dtos/expense.dto';

export class ExpenseService {
  /**
   * Creates a manual expense after checking category availability and authorization.
   */
  public static async createManualExpense(
    userId: string,
    dto: CreateExpenseDto,
  ): Promise<ExpenseDto> {
    // 1. Check if category exists
    const category = await CategoryRepository.findById(dto.categoryId);
    if (!category) {
      throw new AppError('Danh mục không tồn tại.', 400, 'CATEGORY_NOT_FOUND');
    }

    // 2. Check ownership
    if (category.user_id !== null && category.user_id !== userId) {
      throw new AppError('Bạn không có quyền sử dụng danh mục này.', 403, 'FORBIDDEN');
    }

    // 3. Normalize values
    const note = dto.note && dto.note.trim() !== '' ? dto.note.trim() : null;
    const snapId = dto.snapId || null;

    let expenseDate = dto.date;
    if (!expenseDate) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      expenseDate = `${year}-${month}-${day}`;
    }

    // 4. Create in DB
    const expense = await ExpenseRepository.create({
      user_id: userId,
      category_id: dto.categoryId,
      amount: dto.amount,
      note,
      date: expenseDate,
      snap_id: snapId,
    });

    // 5. Return mapped safe DTO
    return {
      id: expense.id,
      amount: Number(expense.amount),
      categoryId: expense.category_id,
      note: expense.note,
      date: expense.date,
      snapId: expense.snap_id,
      createdAt: expense.created_at ? expense.created_at.toISOString() : new Date().toISOString(),
    };
  }

  /**
   * Retrieves a paginated list of expenses for a user, applying filters.
   */
  public static async getExpensesList(
    userId: string,
    query: ExpenseListQueryDto,
  ): Promise<ExpenseListResponseDto> {
    // 1. Query repository
    const { rows, count } = await ExpenseRepository.findAndCountByUser(userId, query);

    // 2. Map rows to safe DTO objects
    const expenses = rows.map((expense) => {
      let snapDetails = null;
      if (expense.snap_id !== null) {
        snapDetails = {
          snapDeleted: true,
          imageUrl: null,
        };
      }

      return {
        id: expense.id,
        amount: Number(expense.amount),
        categoryId: expense.category_id,
        note: expense.note,
        date: expense.date,
        snapId: expense.snap_id,
        snapDetails,
        createdAt: expense.created_at ? expense.created_at.toISOString() : new Date().toISOString(),
      };
    });

    // 3. Return response with pagination info
    return {
      expenses,
      pagination: {
        total: count,
        limit: query.limit,
        offset: query.offset,
      },
    };
  }
}
