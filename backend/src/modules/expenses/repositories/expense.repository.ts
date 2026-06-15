import { Expense } from '../../../shared/models/expense.model';
import type { CreateExpenseData } from '../dtos/expense.dto';

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
}
