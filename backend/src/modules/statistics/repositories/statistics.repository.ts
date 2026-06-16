import { Op, type Transaction } from 'sequelize';
import { Expense } from '../../../shared/models/expense.model';
import { Category } from '../../../shared/models/category.model';
import sequelize from '../../../shared/database/index';

export class StatisticsRepository {
  /**
   * Calculates the total expenses for a user on a specific date.
   */
  public static async getDailyTotal(
    userId: string,
    date: string,
    transaction?: Transaction,
  ): Promise<number> {
    const result = await Expense.sum('amount', {
      where: {
        user_id: userId,
        date,
      },
      transaction,
    });
    return result ? Number(result) : 0;
  }

  /**
   * Calculates the total expenses for a user within a specific month and year.
   */
  public static async getMonthlyTotal(
    userId: string,
    year: number,
    month: number,
    transaction?: Transaction,
  ): Promise<number> {
    const startDateStr = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDateStr = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

    const result = await Expense.sum('amount', {
      where: {
        user_id: userId,
        date: {
          [Op.between]: [startDateStr, endDateStr],
        },
      },
      transaction,
    });
    return result ? Number(result) : 0;
  }

  /**
   * Retrieves total expenses grouped by category for a user within a specific month and year.
   */
  public static async getCategoryBreakdown(
    userId: string,
    year: number,
    month: number,
    transaction?: Transaction,
  ): Promise<
    Array<{
      categoryId: string;
      categoryName: string;
      totalAmount: number;
    }>
  > {
    const startDateStr = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDateStr = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

    const results = await Expense.findAll({
      attributes: ['category_id', [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount']],
      where: {
        user_id: userId,
        date: {
          [Op.between]: [startDateStr, endDateStr],
        },
      },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['name'],
        },
      ],
      group: ['category_id', 'category.id'],
      transaction,
    });

    return results.map((r) => {
      const sum = r.get('total_amount');
      return {
        categoryId: r.category_id,
        categoryName: r.category?.name || '',
        totalAmount: sum ? Number(sum) : 0,
      };
    });
  }

  /**
   * Retrieves daily expense totals for the 7-day period ending on the specified date.
   */
  public static async getRecentTrend(
    userId: string,
    endDate: string,
    transaction?: Transaction,
  ): Promise<Array<{ date: string; total: number }>> {
    const end = new Date(endDate);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);

    const formatDate = (d: Date): string => {
      const y = d.getFullYear();
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const startDate = formatDate(start);

    const results = await Expense.findAll({
      attributes: ['date', [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount']],
      where: {
        user_id: userId,
        date: {
          [Op.between]: [startDate, endDate],
        },
      },
      group: ['date'],
      transaction,
    });

    return results.map((r) => {
      const sum = r.get('total_amount');
      return {
        date: r.date,
        total: sum ? Number(sum) : 0,
      };
    });
  }
}
