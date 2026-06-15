import { ExpenseRepository } from '../repositories/expense.repository';
import { CategoryRepository } from '../../categories/repositories/category.repository';
import { AppError } from '../../../shared/utils/appError';
import type {
  CreateExpenseDto,
  ExpenseDto,
  ExpenseListQueryDto,
  ExpenseListResponseDto,
  UpdateExpenseDto,
  UpdateExpenseData,
  DeleteExpenseResponseDto,
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

  /**
   * Updates an existing manual expense after validation.
   */
  public static async updateExpense(
    userId: string,
    expenseId: string,
    dto: UpdateExpenseDto,
  ): Promise<ExpenseDto> {
    // 1. Find existing expense
    const expense = await ExpenseRepository.findById(expenseId);
    if (!expense) {
      throw new AppError('Khoản chi tiêu không tồn tại.', 404, 'EXPENSE_NOT_FOUND');
    }

    // 2. Check ownership
    if (expense.user_id !== userId) {
      throw new AppError('Bạn không có quyền chỉnh sửa khoản chi tiêu này.', 403, 'FORBIDDEN');
    }

    const updateData: UpdateExpenseData = {};

    // 3. Check and validate categoryId if provided
    if (dto.categoryId !== undefined) {
      const category = await CategoryRepository.findById(dto.categoryId);
      if (!category) {
        throw new AppError('Danh mục không tồn tại.', 400, 'CATEGORY_NOT_FOUND');
      }
      if (category.user_id !== null && category.user_id !== userId) {
        throw new AppError('Bạn không có quyền sử dụng danh mục này.', 403, 'FORBIDDEN');
      }
      updateData.category_id = dto.categoryId;
    }

    // 4. Normalize and map other fields
    if (dto.amount !== undefined) {
      updateData.amount = dto.amount;
    }

    if (dto.note !== undefined) {
      updateData.note = dto.note && dto.note.trim() !== '' ? dto.note.trim() : null;
    }

    if (dto.date !== undefined) {
      updateData.date = dto.date;
    }

    if (dto.snapId !== undefined) {
      updateData.snap_id = dto.snapId || null;
    }

    // 5. Perform repository update
    const updatedExpense = await ExpenseRepository.updateById(expenseId, updateData);
    if (!updatedExpense) {
      throw new AppError('Khoản chi tiêu không tồn tại.', 404, 'EXPENSE_NOT_FOUND');
    }

    // 6. Return mapped safe DTO
    return {
      id: updatedExpense.id,
      amount: Number(updatedExpense.amount),
      categoryId: updatedExpense.category_id,
      note: updatedExpense.note,
      date: updatedExpense.date,
      snapId: updatedExpense.snap_id,
      createdAt: updatedExpense.created_at
        ? updatedExpense.created_at.toISOString()
        : new Date().toISOString(),
    };
  }

  /**
   * Soft deletes an existing manual expense after validation.
   */
  public static async deleteExpense(
    userId: string,
    expenseId: string,
  ): Promise<DeleteExpenseResponseDto> {
    // 1. Find existing expense
    const expense = await ExpenseRepository.findById(expenseId);
    if (!expense) {
      throw new AppError('Khoản chi tiêu không tồn tại.', 404, 'EXPENSE_NOT_FOUND');
    }

    // 2. Check ownership
    if (expense.user_id !== userId) {
      throw new AppError('Bạn không có quyền xóa khoản chi tiêu này.', 403, 'FORBIDDEN');
    }

    // 3. Perform soft delete
    const result = await ExpenseRepository.deleteById(expenseId);
    if (result === 0) {
      throw new AppError('Khoản chi tiêu không tồn tại.', 404, 'EXPENSE_NOT_FOUND');
    }

    return {
      message: 'Đã xóa khoản chi tiêu thành công.',
    };
  }
}
