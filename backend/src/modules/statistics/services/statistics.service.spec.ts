import { randomUUID } from 'crypto';
import { User } from '../../../shared/models/user.model';
import { Expense } from '../../../shared/models/expense.model';
import { Category } from '../../../shared/models/category.model';
import { StatisticsService } from './statistics.service';
import sequelize from '../../../shared/database/index';

describe('StatisticsService Unit/Service Tests', () => {
  const suiteId = randomUUID().substring(0, 8);

  let owner: User;
  let otherUser: User;

  let catFood: Category;
  let catTransport: Category;
  let catOther: Category;

  const createdUserIds: string[] = [];
  const createdCategoryIds: string[] = [];
  const createdExpenseIds: string[] = [];

  beforeAll(async () => {
    // 1. Create users
    owner = await User.create({
      username: `owner_${suiteId}`,
      email: `owner_${suiteId}@example.com`,
      password_hash: 'hashedpassword',
    });
    createdUserIds.push(owner.id);

    otherUser = await User.create({
      username: `other_${suiteId}`,
      email: `other_${suiteId}@example.com`,
      password_hash: 'hashedpassword',
    });
    createdUserIds.push(otherUser.id);

    // 2. Create custom categories
    catFood = await Category.create({
      user_id: owner.id,
      name: 'Food',
      color: '#FF5733',
      icon: 'fast-food-outline',
    });
    createdCategoryIds.push(catFood.id);

    catTransport = await Category.create({
      user_id: owner.id,
      name: 'Transport',
      color: '#3357FF',
      icon: 'car-outline',
    });
    createdCategoryIds.push(catTransport.id);

    catOther = await Category.create({
      user_id: otherUser.id,
      name: 'Other',
      color: '#33FF57',
      icon: 'sparkles',
    });
    createdCategoryIds.push(catOther.id);
  });

  afterAll(async () => {
    try {
      if (createdExpenseIds.length > 0) {
        await Expense.destroy({
          where: { id: createdExpenseIds },
          force: true,
        });
      }
      if (createdCategoryIds.length > 0) {
        await Category.destroy({
          where: { id: createdCategoryIds },
        });
      }
      if (createdUserIds.length > 0) {
        await User.destroy({
          where: { id: createdUserIds },
          force: true,
        });
      }
    } finally {
      await sequelize.close();
    }
  });

  const createExpense = async (data: {
    userId: string;
    categoryId: string;
    amount: number;
    date: string;
    softDeleted?: boolean;
  }): Promise<Expense> => {
    const expense = await Expense.create({
      user_id: data.userId,
      category_id: data.categoryId,
      amount: data.amount,
      date: data.date,
      note: 'Test expense',
    });
    createdExpenseIds.push(expense.id);

    if (data.softDeleted) {
      await expense.destroy();
    }

    return expense;
  };

  it('should calculate dailyTotal correctly for queryDate and ignore other dates/users', async () => {
    const queryDate = '2026-06-16';

    // Owner active expense on queryDate
    await createExpense({
      userId: owner.id,
      categoryId: catFood.id,
      amount: 50000,
      date: queryDate,
    });
    await createExpense({
      userId: owner.id,
      categoryId: catTransport.id,
      amount: 30000,
      date: queryDate,
    });

    // Owner active expense on other date
    await createExpense({
      userId: owner.id,
      categoryId: catFood.id,
      amount: 40000,
      date: '2026-06-15',
    });

    // Owner soft-deleted expense on queryDate (should be ignored)
    await createExpense({
      userId: owner.id,
      categoryId: catFood.id,
      amount: 100000,
      date: queryDate,
      softDeleted: true,
    });

    // Other user active expense on queryDate (should be ignored)
    await createExpense({
      userId: otherUser.id,
      categoryId: catOther.id,
      amount: 90000,
      date: queryDate,
    });

    const stats = await StatisticsService.getStatisticsSummary(owner.id, queryDate, 2026, 6);

    expect(stats.dailyTotal).toBe(80000); // 50000 + 30000
  });

  it('should calculate monthlyTotal and categoryBreakdown correctly with percentage rounding and sorting', async () => {
    const queryDate = '2026-06-16';

    const testOwner = await User.create({
      username: `owner2_${suiteId}`,
      email: `owner2_${suiteId}@example.com`,
      password_hash: 'hashedpassword',
    });
    createdUserIds.push(testOwner.id);

    const testCatFood = await Category.create({
      user_id: testOwner.id,
      name: 'Food',
      color: '#FF5733',
    });
    createdCategoryIds.push(testCatFood.id);

    const testCatTransport = await Category.create({
      user_id: testOwner.id,
      name: 'Transport',
      color: '#3357FF',
    });
    createdCategoryIds.push(testCatTransport.id);

    // Create expenses
    await createExpense({
      userId: testOwner.id,
      categoryId: testCatFood.id,
      amount: 25000,
      date: '2026-06-01',
    });
    await createExpense({
      userId: testOwner.id,
      categoryId: testCatFood.id,
      amount: 25000,
      date: '2026-06-15',
    });
    await createExpense({
      userId: testOwner.id,
      categoryId: testCatFood.id,
      amount: 25000,
      date: '2026-06-30',
    });
    await createExpense({
      userId: testOwner.id,
      categoryId: testCatTransport.id,
      amount: 25000,
      date: '2026-06-10',
    });

    // Out of month expense (different month)
    await createExpense({
      userId: testOwner.id,
      categoryId: testCatFood.id,
      amount: 60000,
      date: '2026-07-01',
    });
    // Out of year expense (different year)
    await createExpense({
      userId: testOwner.id,
      categoryId: testCatFood.id,
      amount: 80000,
      date: '2027-06-15',
    });

    // Soft-deleted expense in same month (should be ignored)
    await createExpense({
      userId: testOwner.id,
      categoryId: testCatFood.id,
      amount: 30000,
      date: '2026-06-20',
      softDeleted: true,
    });

    // Other user expense in same month (should be ignored)
    await createExpense({
      userId: otherUser.id,
      categoryId: catOther.id,
      amount: 50000,
      date: '2026-06-15',
    });

    const stats = await StatisticsService.getStatisticsSummary(testOwner.id, queryDate, 2026, 6);

    expect(stats.monthlyTotal).toBe(100000);

    expect(stats.categoryBreakdown.length).toBe(2);
    // Sort desc: Food first (75000), Transport second (25000)
    expect(stats.categoryBreakdown[0].categoryId).toBe(testCatFood.id);
    expect(stats.categoryBreakdown[0].categoryName).toBe('Food');
    expect(stats.categoryBreakdown[0].totalAmount).toBe(75000);
    expect(stats.categoryBreakdown[0].percentage).toBe(75);

    expect(stats.categoryBreakdown[1].categoryId).toBe(testCatTransport.id);
    expect(stats.categoryBreakdown[1].categoryName).toBe('Transport');
    expect(stats.categoryBreakdown[1].totalAmount).toBe(25000);
    expect(stats.categoryBreakdown[1].percentage).toBe(25);
  });

  it('should handle monthlyTotal = 0 safely and return empty breakdown', async () => {
    const queryDate = '2026-06-16';
    const cleanOwner = await User.create({
      username: `owner3_${suiteId}`,
      email: `owner3_${suiteId}@example.com`,
      password_hash: 'hashedpassword',
    });
    createdUserIds.push(cleanOwner.id);

    const stats = await StatisticsService.getStatisticsSummary(cleanOwner.id, queryDate, 2026, 6);

    expect(stats.monthlyTotal).toBe(0);
    expect(stats.categoryBreakdown).toEqual([]);
  });

  it('should build recentTrend for exactly 7 days in chronological order with correct totals and zeros', async () => {
    const queryDate = '2026-06-16';

    const trendOwner = await User.create({
      username: `owner4_${suiteId}`,
      email: `owner4_${suiteId}@example.com`,
      password_hash: 'hashedpassword',
    });
    createdUserIds.push(trendOwner.id);

    // Days should be: 10, 11, 12, 13, 14, 15, 16 of June 2026
    // We create expenses on:
    // June 10: 15000
    // June 12: 25000
    // June 16: 35000
    // June 15: soft-deleted (should be ignored, count as 0)
    // Other user expense on June 13 (should be ignored)
    await createExpense({
      userId: trendOwner.id,
      categoryId: catFood.id,
      amount: 15000,
      date: '2026-06-10',
    });
    await createExpense({
      userId: trendOwner.id,
      categoryId: catFood.id,
      amount: 25000,
      date: '2026-06-12',
    });
    await createExpense({
      userId: trendOwner.id,
      categoryId: catFood.id,
      amount: 35000,
      date: '2026-06-16',
    });
    await createExpense({
      userId: trendOwner.id,
      categoryId: catFood.id,
      amount: 90000,
      date: '2026-06-15',
      softDeleted: true,
    });
    await createExpense({
      userId: otherUser.id,
      categoryId: catOther.id,
      amount: 50000,
      date: '2026-06-13',
    });

    const stats = await StatisticsService.getStatisticsSummary(trendOwner.id, queryDate, 2026, 6);

    expect(stats.recentTrend.length).toBe(7);

    // Ascending sort order:
    expect(stats.recentTrend[0]).toEqual({ date: '2026-06-10', total: 15000 });
    expect(stats.recentTrend[1]).toEqual({ date: '2026-06-11', total: 0 });
    expect(stats.recentTrend[2]).toEqual({ date: '2026-06-12', total: 25000 });
    expect(stats.recentTrend[3]).toEqual({ date: '2026-06-13', total: 0 });
    expect(stats.recentTrend[4]).toEqual({ date: '2026-06-14', total: 0 });
    expect(stats.recentTrend[5]).toEqual({ date: '2026-06-15', total: 0 });
    expect(stats.recentTrend[6]).toEqual({ date: '2026-06-16', total: 35000 });
  });
});
