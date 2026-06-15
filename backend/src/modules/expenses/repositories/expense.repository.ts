import { Op, type WhereOptions } from 'sequelize';
import { Expense, type ExpenseAttributes } from '../../../shared/models/expense.model';
import type {
  CreateExpenseData,
  ExpenseListQueryDto,
  UpdateExpenseData,
} from '../dtos/expense.dto';

export class ExpenseRepository {
  /**
   * Creates a new manual expense record in the database.
   */
  public static async create(data: CreateExpenseData): Promise<Expense> {
    return Expense.create({
      user_id: data.user_id,
      category_id: data.category_id,
      amount: data.amount,
      note: data.note,
      date: data.date,
      snap_id: data.snap_id,
    });
  }

  /**
   * Finds and counts expenses for a specific user with filters, sorting, and pagination.
   */
  public static async findAndCountByUser(
    userId: string,
    query: ExpenseListQueryDto,
  ): Promise<{ rows: Expense[]; count: number }> {
    const whereClause: WhereOptions<ExpenseAttributes> = {
      user_id: userId,
    };

    if (query.categoryId) {
      whereClause.category_id = query.categoryId;
    }

    if (query.startDate || query.endDate) {
      const dateFilter: Record<symbol, string> = {};
      if (query.startDate) {
        dateFilter[Op.gte] = query.startDate;
      }
      if (query.endDate) {
        dateFilter[Op.lte] = query.endDate;
      }
      whereClause.date = dateFilter;
    }

    return Expense.findAndCountAll({
      where: whereClause,
      limit: query.limit,
      offset: query.offset,
      order: [
        ['date', 'DESC'],
        ['created_at', 'DESC'],
        ['id', 'DESC'],
      ],
    });
  }

  /**
   * Finds a single expense by ID.
   */
  public static async findById(id: string): Promise<Expense | null> {
    return Expense.findByPk(id);
  }

  /**
   * Updates an expense by ID.
   */
  public static async updateById(id: string, data: UpdateExpenseData): Promise<Expense | null> {
    const expense = await Expense.findByPk(id);
    if (!expense) {
      return null;
    }
    await expense.update(data);
    return expense;
  }

  /**
   * Soft deletes an expense by ID.
   */
  public static async deleteById(id: string): Promise<number> {
    return Expense.destroy({
      where: { id },
    });
  }
}
