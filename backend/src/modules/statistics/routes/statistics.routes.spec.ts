import request from 'supertest';
import { randomUUID } from 'crypto';
import app from '../../../app';
import { User } from '../../../shared/models/user.model';
import { Category } from '../../../shared/models/category.model';
import { Expense } from '../../../shared/models/expense.model';
import sequelize from '../../../shared/database/index';
import { tokenService } from '../../auth/services/token.service';

interface TestBreakdownItem {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
  percentage: number;
}

interface TestTrendItem {
  date: string;
  total: number;
}

interface TestStatsResponse {
  success: boolean;
  data: {
    dailyTotal: number;
    monthlyTotal: number;
    categoryBreakdown: TestBreakdownItem[];
    recentTrend: TestTrendItem[];
  };
}

describe('Statistics Routes Integration Tests', () => {
  const suiteId = randomUUID().substring(0, 8);

  const testAccessSecret = 'test_integration_access_secret_statistics_routes';
  const testRefreshSecret = 'test_integration_refresh_secret_statistics_routes';

  let owner: User;
  let otherUser: User;
  let ownerToken: string;

  let catFood: Category;
  let catOther: Category;

  const createdUserIds: string[] = [];
  const createdCategoryIds: string[] = [];
  const createdExpenseIds: string[] = [];

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = testAccessSecret;
    process.env.JWT_REFRESH_SECRET = testRefreshSecret;
    process.env.JWT_ACCESS_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';

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

    ownerToken = tokenService.generateAccessToken({ userId: owner.id });

    // 2. Create custom categories
    catFood = await Category.create({
      user_id: owner.id,
      name: 'Food',
      color: '#FF5733',
    });
    createdCategoryIds.push(catFood.id);

    catOther = await Category.create({
      user_id: otherUser.id,
      name: 'Other',
      color: '#33FF57',
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

  const toDateOnly = (date: Date): string => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getServerToday = (): string => toDateOnly(new Date());

  const addDays = (dateText: string, days: number): string => {
    const parts = dateText.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    date.setDate(date.getDate() + days);
    return toDateOnly(date);
  };

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

  describe('GET /api/v1/statistics', () => {
    it('should return HTTP 401 when Authorization header is missing', async () => {
      const response = await request(app).get('/api/v1/statistics');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('should return HTTP 401 when token is invalid', async () => {
      const response = await request(app)
        .get('/api/v1/statistics')
        .set('Authorization', 'Bearer invalid.token.value');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_TOKEN');
    });

    it('should return HTTP 400 when month query is not an integer', async () => {
      const response = await request(app)
        .get('/api/v1/statistics?month=abc')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return HTTP 400 when month query is outside 1-12 range', async () => {
      const invalidMonths = ['0', '-1', '13'];
      for (const invalidMonth of invalidMonths) {
        const response = await request(app)
          .get(`/api/v1/statistics?month=${invalidMonth}`)
          .set('Authorization', `Bearer ${ownerToken}`);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      }
    });

    it('should return HTTP 400 when year query is not an integer', async () => {
      const response = await request(app)
        .get('/api/v1/statistics?year=abc')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return HTTP 400 when year query is outside 1970-2100 range', async () => {
      const invalidYears = ['1969', '2101'];
      for (const invalidYear of invalidYears) {
        const response = await request(app)
          .get(`/api/v1/statistics?year=${invalidYear}`)
          .set('Authorization', `Bearer ${ownerToken}`);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      }
    });

    it('should return 200 OK and calculate statistics correctly using server defaults and handle user isolation and soft delete', async () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const today = getServerToday();
      const dMinus1 = addDays(today, -1);
      const dMinus6 = addDays(today, -6);

      // 1. Prepare data for owner
      // Active expense on today -> dailyTotal & recentTrend & monthlyTotal (if in current month, which it is)
      await createExpense({ userId: owner.id, categoryId: catFood.id, amount: 30000, date: today });
      // Active expense on today - 1 -> recentTrend & monthlyTotal (if in current month)
      await createExpense({
        userId: owner.id,
        categoryId: catFood.id,
        amount: 20000,
        date: dMinus1,
      });
      // Active expense on today - 6 -> recentTrend & monthlyTotal (if in current month)
      await createExpense({
        userId: owner.id,
        categoryId: catFood.id,
        amount: 50000,
        date: dMinus6,
      });

      // Out of month expense (e.g. if currentMonth is 6, July is 2026-07-01; but dynamically, we can use a month/year that is definitely NOT currentYear-currentMonth)
      let differentYear = currentYear;
      let differentMonth = currentMonth + 1;
      if (differentMonth > 12) {
        differentMonth = 1;
        differentYear += 1;
      }
      const differentMonthStr = differentMonth.toString().padStart(2, '0');
      const differentDate = `${differentYear}-${differentMonthStr}-01`;
      await createExpense({
        userId: owner.id,
        categoryId: catFood.id,
        amount: 80000,
        date: differentDate,
      });

      // Soft-deleted expense on today -> should be ignored completely
      await createExpense({
        userId: owner.id,
        categoryId: catFood.id,
        amount: 90000,
        date: today,
        softDeleted: true,
      });

      // Other user expense on today -> should be ignored due to isolation
      await createExpense({
        userId: otherUser.id,
        categoryId: catOther.id,
        amount: 40000,
        date: today,
      });

      // 2. Call API without query parameters (defaults to current month/year)
      const res = await request(app)
        .get('/api/v1/statistics')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const stats = res.body as TestStatsResponse;

      expect(stats.data.dailyTotal).toBe(30000);

      // Determine expectedMonthlyTotal dynamically
      const isSameMonth = (dateStr: string): boolean => {
        const parts = dateStr.split('-');
        return parseInt(parts[0], 10) === currentYear && parseInt(parts[1], 10) === currentMonth;
      };

      let expectedMonthlyTotal = 30000; // today is always in current month
      if (isSameMonth(dMinus1)) {
        expectedMonthlyTotal += 20000;
      }
      if (isSameMonth(dMinus6)) {
        expectedMonthlyTotal += 50000;
      }

      expect(stats.data.monthlyTotal).toBe(expectedMonthlyTotal);

      expect(stats.data.categoryBreakdown.length).toBe(1);
      expect(stats.data.categoryBreakdown[0].categoryId).toBe(catFood.id);
      expect(stats.data.categoryBreakdown[0].categoryName).toBe('Food');
      expect(stats.data.categoryBreakdown[0].totalAmount).toBe(expectedMonthlyTotal);
      expect(stats.data.categoryBreakdown[0].percentage).toBe(100);

      expect(stats.data.recentTrend.length).toBe(7);
      expect(stats.data.recentTrend[0]).toEqual({ date: dMinus6, total: 50000 });
      expect(stats.data.recentTrend[1]).toEqual({ date: addDays(today, -5), total: 0 });
      expect(stats.data.recentTrend[2]).toEqual({ date: addDays(today, -4), total: 0 });
      expect(stats.data.recentTrend[3]).toEqual({ date: addDays(today, -3), total: 0 });
      expect(stats.data.recentTrend[4]).toEqual({ date: addDays(today, -2), total: 0 });
      expect(stats.data.recentTrend[5]).toEqual({ date: dMinus1, total: 20000 });
      expect(stats.data.recentTrend[6]).toEqual({ date: today, total: 30000 });
    });

    it('should return 200 OK and calculate statistics correctly when targeting specific year and month', async () => {
      const today = getServerToday();
      const dMinus1 = addDays(today, -1);
      const dMinus6 = addDays(today, -6);

      // Create separate user for this test to ensure isolation
      const julyUser = await User.create({
        username: `july_user_${suiteId}`,
        email: `july_user_${suiteId}@example.com`,
        password_hash: 'hashedpassword',
      });
      createdUserIds.push(julyUser.id);

      const julyToken = tokenService.generateAccessToken({ userId: julyUser.id });

      const julyCategory = await Category.create({
        user_id: julyUser.id,
        name: 'July Food',
        color: '#FF5733',
      });
      createdCategoryIds.push(julyCategory.id);

      // Seed daily/trend expenses for julyUser
      await createExpense({
        userId: julyUser.id,
        categoryId: julyCategory.id,
        amount: 30000,
        date: today,
      });
      await createExpense({
        userId: julyUser.id,
        categoryId: julyCategory.id,
        amount: 20000,
        date: dMinus1,
      });
      await createExpense({
        userId: julyUser.id,
        categoryId: julyCategory.id,
        amount: 50000,
        date: dMinus6,
      });

      // Seed July 2026 expense for julyUser
      await createExpense({
        userId: julyUser.id,
        categoryId: julyCategory.id,
        amount: 80000,
        date: '2026-07-01',
      });

      // 2. Call API with month=7 and year=2026
      const res = await request(app)
        .get('/api/v1/statistics?month=7&year=2026')
        .set('Authorization', `Bearer ${julyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const stats = res.body as TestStatsResponse;

      // dailyTotal is always calculated for current day (today)
      expect(stats.data.dailyTotal).toBe(30000);
      // monthlyTotal is for July 2026 (80000)
      expect(stats.data.monthlyTotal).toBe(80000);

      expect(stats.data.categoryBreakdown.length).toBe(1);
      expect(stats.data.categoryBreakdown[0].categoryId).toBe(julyCategory.id);
      expect(stats.data.categoryBreakdown[0].categoryName).toBe('July Food');
      expect(stats.data.categoryBreakdown[0].totalAmount).toBe(80000);
      expect(stats.data.categoryBreakdown[0].percentage).toBe(100);

      // recentTrend is always ending on today
      expect(stats.data.recentTrend.length).toBe(7);
      expect(stats.data.recentTrend[0]).toEqual({ date: dMinus6, total: 50000 });
      expect(stats.data.recentTrend[1]).toEqual({ date: addDays(today, -5), total: 0 });
      expect(stats.data.recentTrend[2]).toEqual({ date: addDays(today, -4), total: 0 });
      expect(stats.data.recentTrend[3]).toEqual({ date: addDays(today, -3), total: 0 });
      expect(stats.data.recentTrend[4]).toEqual({ date: addDays(today, -2), total: 0 });
      expect(stats.data.recentTrend[5]).toEqual({ date: dMinus1, total: 20000 });
      expect(stats.data.recentTrend[6]).toEqual({ date: today, total: 30000 });
    });
  });
});
