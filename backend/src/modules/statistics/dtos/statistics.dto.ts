export interface StatisticsSummaryDto {
  dailyTotal: number;
  monthlyTotal: number;
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    totalAmount: number;
    percentage: number;
  }>;
  recentTrend: Array<{
    date: string;
    total: number;
  }>;
}
