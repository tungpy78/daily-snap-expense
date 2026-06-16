import { StatisticsRepository } from '../repositories/statistics.repository';
import type { StatisticsSummaryDto } from '../dtos/statistics.dto';

export class StatisticsService {
  /**
   * Generates a financial statistics summary for the specified user and date criteria.
   */
  public static async getStatisticsSummary(
    userId: string,
    queryDate: string,
    targetYear: number,
    targetMonth: number,
  ): Promise<StatisticsSummaryDto> {
    // 1. Get daily total
    const dailyTotal = await StatisticsRepository.getDailyTotal(userId, queryDate);

    // 2. Get monthly total
    const monthlyTotal = await StatisticsRepository.getMonthlyTotal(
      userId,
      targetYear,
      targetMonth,
    );

    // 3. Get category breakdown
    const rawBreakdown = await StatisticsRepository.getCategoryBreakdown(
      userId,
      targetYear,
      targetMonth,
    );

    // Calculate percentage and format category breakdown
    const categoryBreakdown = rawBreakdown.map((item) => {
      const percentage =
        monthlyTotal === 0 ? 0 : Math.round((item.totalAmount / monthlyTotal) * 10000) / 100;
      return {
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        totalAmount: item.totalAmount,
        percentage,
      };
    });

    // Sort category breakdown descending by totalAmount
    categoryBreakdown.sort((a, b) => {
      if (b.totalAmount !== a.totalAmount) {
        return b.totalAmount - a.totalAmount;
      }
      return 0;
    });

    // 4. Get recent trend
    const rawTrend = await StatisticsRepository.getRecentTrend(userId, queryDate);

    // Create a map of existing trend data for easy O(1) lookup
    const trendMap = new Map<string, number>();
    for (const item of rawTrend) {
      trendMap.set(item.date, item.total);
    }

    // Generate exactly 7 dates in chronological order ending on queryDate
    const recentTrend: Array<{ date: string; total: number }> = [];
    const end = new Date(queryDate);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(end);
      d.setUTCDate(end.getUTCDate() - i);
      const y = d.getUTCFullYear();
      const m = (d.getUTCMonth() + 1).toString().padStart(2, '0');
      const day = d.getUTCDate().toString().padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;

      recentTrend.push({
        date: dateStr,
        total: trendMap.get(dateStr) || 0,
      });
    }

    return {
      dailyTotal,
      monthlyTotal,
      categoryBreakdown,
      recentTrend,
    };
  }
}
