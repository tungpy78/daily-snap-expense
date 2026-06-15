import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../../app';
import { User } from '../../../shared/models/user.model';
import { Category } from '../../../shared/models/category.model';
import { Expense } from '../../../shared/models/expense.model';
import sequelize from '../../../shared/database/index';
import { tokenService } from '../../auth/services/token.service';
import type { ExpenseListItemDto } from '../dtos/expense.dto';

describe('Expense Integration Tests', () => {
  const testUsernames = ['test_exp_user_1', 'test_exp_user_2'];
  const testCategoryNames = [
    'TestExpSysCategory',
    'TestExpUser1CustomCategory',
    'TestExpUser2CustomCategory',
  ];

  const testAccessSecret = 'test_integration_access_secret';
  const testRefreshSecret = 'test_integration_refresh_secret';

  let user1: User;
  let user2: User;

  let token1: string;
  let token2: string;

  let sysCategory: Category;
  let user1Category: Category;
  let user2Category: Category;
  let softDeletedExpenseId: string;

  beforeAll(async () => {
    // Inject mock secrets for integration tests
    process.env.JWT_ACCESS_SECRET = testAccessSecret;
    process.env.JWT_REFRESH_SECRET = testRefreshSecret;
    process.env.JWT_ACCESS_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';

    // Clean up if any dirty state left
    await Expense.destroy({
      where: {},
      force: true,
    });
    await Category.destroy({
      where: { name: testCategoryNames },
    });
    await User.destroy({
      where: { username: testUsernames },
      force: true,
    });

    // Create test users
    user1 = await User.create({
      username: 'test_exp_user_1',
      email: 'test_exp_user_1@example.com',
      password_hash: 'hashedpassword',
    });

    user2 = await User.create({
      username: 'test_exp_user_2',
      email: 'test_exp_user_2@example.com',
      password_hash: 'hashedpassword',
    });

    // Generate valid tokens
    const tokenServiceWithSecret = tokenService as unknown as { accessSecret: string };
    const secret = tokenServiceWithSecret.accessSecret;

    token1 = jwt.sign({ userId: user1.id }, secret, { expiresIn: '15m' });
    token2 = jwt.sign({ userId: user2.id }, secret, { expiresIn: '15m' });

    // Seed test categories
    // 1. System category
    sysCategory = await Category.create({
      name: 'TestExpSysCategory',
      color: '#FF0000',
      icon: 'star',
      user_id: null,
    });

    // 2. Custom category for user 1
    user1Category = await Category.create({
      name: 'TestExpUser1CustomCategory',
      color: '#0000FF',
      icon: 'home',
      user_id: user1.id,
    });

    // 3. Custom category for user 2
    user2Category = await Category.create({
      name: 'TestExpUser2CustomCategory',
      color: '#FFFF00',
      icon: 'car',
      user_id: user2.id,
    });
  });

  afterAll(async () => {
    try {
      // Clean up all created expenses
      await Expense.destroy({
        where: {},
        force: true,
      });

      // Clean up all created categories
      await Category.destroy({
        where: { name: testCategoryNames },
      });

      // Clean up all created users
      await User.destroy({
        where: { username: testUsernames },
        force: true,
      });
    } finally {
      await sequelize.close();
    }
  });

  describe('POST /api/v1/expenses', () => {
    it('should return HTTP 401 when Authorization header is missing', async () => {
      const response = await request(app).post('/api/v1/expenses').send({
        amount: 10000,
        categoryId: sysCategory.id,
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('should return HTTP 401 when token is invalid', async () => {
      const response = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', 'Bearer invalid.token.value')
        .send({
          amount: 10000,
          categoryId: sysCategory.id,
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_TOKEN');
    });

    it('should return HTTP 400 when amount is missing, null, or <= 0', async () => {
      const responses = await Promise.all([
        request(app)
          .post('/api/v1/expenses')
          .set('Authorization', `Bearer ${token1}`)
          .send({ categoryId: sysCategory.id }),
        request(app)
          .post('/api/v1/expenses')
          .set('Authorization', `Bearer ${token1}`)
          .send({ amount: -50, categoryId: sysCategory.id }),
        request(app)
          .post('/api/v1/expenses')
          .set('Authorization', `Bearer ${token1}`)
          .send({ amount: 0, categoryId: sysCategory.id }),
      ]);

      responses.forEach((res) => {
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });
    });

    it('should return HTTP 400 when categoryId is missing or invalid UUID', async () => {
      const responses = await Promise.all([
        request(app)
          .post('/api/v1/expenses')
          .set('Authorization', `Bearer ${token1}`)
          .send({ amount: 10000 }),
        request(app)
          .post('/api/v1/expenses')
          .set('Authorization', `Bearer ${token1}`)
          .send({ amount: 10000, categoryId: 'not-a-uuid' }),
      ]);

      responses.forEach((res) => {
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      });
    });

    it('should return HTTP 400 when note is longer than 1000 characters', async () => {
      const longNote = 'a'.repeat(1001);
      const response = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          amount: 10000,
          categoryId: sysCategory.id,
          note: longNote,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return HTTP 400 when date is not in YYYY-MM-DD format', async () => {
      const response = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          amount: 10000,
          categoryId: sysCategory.id,
          date: '13-06-2026',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return HTTP 400 when snapId is not a valid UUID', async () => {
      const response = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          amount: 10000,
          categoryId: sysCategory.id,
          snapId: 'invalid-snap-uuid',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return HTTP 400 when categoryId does not exist', async () => {
      const nonExistentUuid = '00000000-0000-0000-0000-000000000000';
      const response = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          amount: 10000,
          categoryId: nonExistentUuid,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'CATEGORY_NOT_FOUND');
    });

    it("should return HTTP 403 when categoryId belongs to another user's custom category", async () => {
      const response = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          amount: 10000,
          categoryId: user2Category.id,
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
    });

    it('should create expense successfully with system category', async () => {
      const response = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          amount: 120000,
          categoryId: sysCategory.id,
          note: '  Đổ xăng xe máy  ',
          date: '2026-06-13',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('expense');

      const expense = response.body.data.expense;
      expect(expense).toHaveProperty('id');
      expect(expense.amount).toBe(120000);
      expect(expense.categoryId).toBe(sysCategory.id);
      expect(expense.note).toBe('Đổ xăng xe máy'); // Trimmed note
      expect(expense.date).toBe('2026-06-13');
      expect(expense.snapId).toBeNull();
      expect(expense).toHaveProperty('createdAt');

      // Verify no sensitive database columns are leaked
      expect(expense).not.toHaveProperty('user_id');
      expect(expense).not.toHaveProperty('category_id');
      expect(expense).not.toHaveProperty('snap_id');
      expect(expense).not.toHaveProperty('deleted_at');
      expect(expense).not.toHaveProperty('updated_at');

      // Verify DB record
      const dbExpense = await Expense.findByPk(expense.id);
      expect(dbExpense).toBeDefined();
      expect(dbExpense!.user_id).toBe(user1.id);
      expect(dbExpense!.category_id).toBe(sysCategory.id);
      expect(Number(dbExpense!.amount)).toBe(120000);
      expect(dbExpense!.note).toBe('Đổ xăng xe máy');
      expect(dbExpense!.date).toBe('2026-06-13');
      expect(dbExpense!.snap_id).toBeNull();
    });

    it('should create expense successfully with custom category of the same user', async () => {
      const response = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          amount: 50000,
          categoryId: user1Category.id,
          note: 'Ăn bánh ngọt',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.expense.categoryId).toBe(user1Category.id);

      const dbExpense = await Expense.findByPk(response.body.data.expense.id);
      expect(dbExpense).toBeDefined();
      expect(dbExpense!.user_id).toBe(user1.id);
    });

    it('should set default date format YYYY-MM-DD of current day when date is not sent', async () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const expectedDate = `${year}-${month}-${day}`;

      const response = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          amount: 85000,
          categoryId: sysCategory.id,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.expense.date).toBe(expectedDate);
    });

    it('should allow user2 to create expense with system category', async () => {
      const response = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          amount: 15000,
          categoryId: sysCategory.id,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.expense.categoryId).toBe(sysCategory.id);
    });

    it('should allow user2 to create expense with own custom category', async () => {
      const response = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          amount: 25000,
          categoryId: user2Category.id,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.expense.categoryId).toBe(user2Category.id);
    });

    it("should return HTTP 403 when user2 attempts to create expense with user1's custom category", async () => {
      const response = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          amount: 35000,
          categoryId: user1Category.id,
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
    });
  });

  describe('GET /api/v1/expenses', () => {
    beforeAll(async () => {
      // Clear all expenses so we have a completely clean state for query tests
      await Expense.destroy({ where: {}, force: true });

      // Seed test expenses for user 1 with deterministic created_at
      await Expense.create({
        user_id: user1.id,
        category_id: sysCategory.id,
        amount: 10000,
        note: 'Exp A',
        date: '2026-06-10',
        snap_id: null,
        created_at: new Date('2026-06-15T10:00:00.000Z'),
      });

      await Expense.create({
        user_id: user1.id,
        category_id: user1Category.id,
        amount: 20000,
        note: 'Exp B',
        date: '2026-06-11',
        snap_id: null,
        created_at: new Date('2026-06-15T11:00:00.000Z'),
      });

      await Expense.create({
        user_id: user1.id,
        category_id: sysCategory.id,
        amount: 30000,
        note: 'Exp C',
        date: '2026-06-12',
        snap_id: null,
        created_at: new Date('2026-06-15T12:00:00.000Z'),
      });

      await Expense.create({
        user_id: user1.id,
        category_id: sysCategory.id,
        amount: 40000,
        note: 'Exp D',
        date: '2026-06-12',
        snap_id: null,
        created_at: new Date('2026-06-15T13:00:00.000Z'),
      });

      await Expense.create({
        user_id: user1.id,
        category_id: sysCategory.id,
        amount: 50000,
        note: 'Exp E',
        date: '2026-06-13',
        snap_id: '11111111-1111-1111-1111-111111111111',
        created_at: new Date('2026-06-15T14:00:00.000Z'),
      });

      // Soft deleted expense for user 1
      const softDeletedExpense = await Expense.create({
        user_id: user1.id,
        category_id: sysCategory.id,
        amount: 60000,
        note: 'Exp F',
        date: '2026-06-14',
        snap_id: null,
        created_at: new Date('2026-06-15T15:00:00.000Z'),
      });
      await softDeletedExpense.destroy();
      softDeletedExpenseId = softDeletedExpense.id;

      // Seed test expense for user 2
      await Expense.create({
        user_id: user2.id,
        category_id: user2Category.id,
        amount: 70000,
        note: 'Exp G',
        date: '2026-06-12',
        snap_id: null,
        created_at: new Date('2026-06-15T16:00:00.000Z'),
      });
    });

    it('should return HTTP 401 when Authorization header is missing', async () => {
      const response = await request(app).get('/api/v1/expenses');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('should return HTTP 401 when token is invalid', async () => {
      const response = await request(app)
        .get('/api/v1/expenses')
        .set('Authorization', 'Bearer invalid.token.value');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_TOKEN');
    });

    it('should return HTTP 400 when startDate has invalid format', async () => {
      const response = await request(app)
        .get('/api/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .query({ startDate: '10-06-2026' });

      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return HTTP 400 when endDate has invalid format', async () => {
      const response = await request(app)
        .get('/api/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .query({ endDate: '12-06-2026' });

      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return HTTP 400 when startDate > endDate', async () => {
      const response = await request(app)
        .get('/api/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .query({ startDate: '2026-06-12', endDate: '2026-06-11' });

      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return HTTP 400 when categoryId has invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .query({ categoryId: 'not-a-uuid' });

      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return HTTP 400 when limit is not an integer', async () => {
      const response = await request(app)
        .get('/api/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .query({ limit: 'abc' });

      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return HTTP 400 when limit <= 0', async () => {
      const response = await request(app)
        .get('/api/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .query({ limit: 0 });

      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return HTTP 400 when limit > 100', async () => {
      const response = await request(app)
        .get('/api/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .query({ limit: 101 });

      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return HTTP 400 when offset is not an integer', async () => {
      const response = await request(app)
        .get('/api/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .query({ offset: 'abc' });

      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return HTTP 400 when offset < 0', async () => {
      const response = await request(app)
        .get('/api/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .query({ offset: -1 });

      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return HTTP 200 and list of user1 expenses with default pagination', async () => {
      const response = await request(app)
        .get('/api/v1/expenses')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('expenses');
      expect(response.body.data).toHaveProperty('pagination');

      const expenses = response.body.data.expenses as ExpenseListItemDto[];
      expect(Array.isArray(expenses)).toBe(true);
      expect(expenses.length).toBe(5); // 5 active items seeded (POST items were cleared in beforeAll)

      const pagination = response.body.data.pagination;
      expect(pagination.total).toBe(5);
      expect(pagination.limit).toBe(20);
      expect(pagination.offset).toBe(0);

      expenses.forEach((item: ExpenseListItemDto) => {
        const itemRecord = item as unknown as Record<string, unknown>;
        expect(itemRecord).toHaveProperty('id');
        expect(itemRecord).toHaveProperty('amount');
        expect(itemRecord).toHaveProperty('categoryId');
        expect(itemRecord).toHaveProperty('note');
        expect(itemRecord).toHaveProperty('date');
        expect(itemRecord).toHaveProperty('snapId');
        expect(itemRecord).toHaveProperty('snapDetails');
        expect(itemRecord).toHaveProperty('createdAt');

        expect(itemRecord).not.toHaveProperty('user_id');
        expect(itemRecord).not.toHaveProperty('category_id');
        expect(itemRecord).not.toHaveProperty('snap_id');
        expect(itemRecord).not.toHaveProperty('deleted_at');
        expect(itemRecord).not.toHaveProperty('updated_at');
      });
    });

    it('should only return expenses belonging to the current user', async () => {
      const response = await request(app)
        .get('/api/v1/expenses')
        .set('Authorization', `Bearer ${token2}`);

      expect(response.status).toBe(200);
      const expenses = response.body.data.expenses as ExpenseListItemDto[];

      expect(expenses.length).toBe(1); // user2 has exactly 1 active item (POST items cleared)
      expect(response.body.data.pagination.total).toBe(1);

      const user1Items = expenses.filter(
        (item: ExpenseListItemDto) => item.amount === 20000 || item.note === 'Exp A',
      );
      expect(user1Items.length).toBe(0);
    });

    it('should support pagination correctly', async () => {
      const response = await request(app)
        .get('/api/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .query({ limit: 3, offset: 2 });

      expect(response.status).toBe(200);
      expect(response.body.data.expenses.length).toBe(3);
      expect(response.body.data.pagination.total).toBe(5);
      expect(response.body.data.pagination.limit).toBe(3);
      expect(response.body.data.pagination.offset).toBe(2);
    });

    it('should filter by categoryId correctly', async () => {
      const response = await request(app)
        .get('/api/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .query({ categoryId: user1Category.id });

      expect(response.status).toBe(200);
      const expenses = response.body.data.expenses as ExpenseListItemDto[];
      expect(expenses.length).toBe(1); // Exp B is the only matching one (POST items cleared)
      expenses.forEach((item: ExpenseListItemDto) => {
        expect(item.categoryId).toBe(user1Category.id);
      });
    });

    it('should filter by startDate and endDate correctly', async () => {
      const response = await request(app)
        .get('/api/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .query({ startDate: '2026-06-11', endDate: '2026-06-12' });

      expect(response.status).toBe(200);
      const expenses = response.body.data.expenses as ExpenseListItemDto[];
      expect(expenses.length).toBe(3);

      const notes = expenses.map((item: ExpenseListItemDto) => item.note);
      expect(notes).toContain('Exp B');
      expect(notes).toContain('Exp C');
      expect(notes).toContain('Exp D');
    });

    it('should support combining multiple filters correctly', async () => {
      const response = await request(app)
        .get('/api/v1/expenses')
        .set('Authorization', `Bearer ${token1}`)
        .query({
          startDate: '2026-06-11',
          endDate: '2026-06-12',
          categoryId: user1Category.id,
        });

      expect(response.status).toBe(200);
      const expenses = response.body.data.expenses as ExpenseListItemDto[];
      expect(expenses.length).toBe(1);
      expect(expenses[0].note).toBe('Exp B');
    });

    it('should not return soft deleted expenses in the list or total', async () => {
      const response = await request(app)
        .get('/api/v1/expenses')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      const expenses = response.body.data.expenses as ExpenseListItemDto[];
      expect(expenses.length).toBe(5);
      expect(response.body.data.pagination.total).toBe(5);
      expect(expenses.some((expense) => expense.id === softDeletedExpenseId)).toBe(false);
    });

    it('should return null snapDetails when snapId is null', async () => {
      const response = await request(app)
        .get('/api/v1/expenses')
        .set('Authorization', `Bearer ${token1}`);

      const expenses = response.body.data.expenses as ExpenseListItemDto[];
      const itemWithNoSnap = expenses.find((item: ExpenseListItemDto) => item.note === 'Exp A');
      expect(itemWithNoSnap).toBeDefined();
      expect(itemWithNoSnap!.snapId).toBeNull();
      expect(itemWithNoSnap!.snapDetails).toBeNull();
    });

    it('should return deleted snapDetails when snapId is not null', async () => {
      const response = await request(app)
        .get('/api/v1/expenses')
        .set('Authorization', `Bearer ${token1}`);

      const expenses = response.body.data.expenses as ExpenseListItemDto[];
      const itemWithSnap = expenses.find((item: ExpenseListItemDto) => item.note === 'Exp E');
      expect(itemWithSnap).toBeDefined();
      expect(itemWithSnap!.snapId).toBe('11111111-1111-1111-1111-111111111111');
      expect(itemWithSnap!.snapDetails).toEqual({
        snapDeleted: true,
        imageUrl: null,
      });
    });

    it('should order expenses by date DESC, created_at DESC, id DESC', async () => {
      const response = await request(app)
        .get('/api/v1/expenses')
        .set('Authorization', `Bearer ${token1}`);

      const expenses = response.body.data.expenses as ExpenseListItemDto[];
      const seeded = expenses.filter((item: ExpenseListItemDto) =>
        ['Exp A', 'Exp B', 'Exp C', 'Exp D', 'Exp E'].includes(item.note || ''),
      );

      const notes = seeded.map((item: ExpenseListItemDto) => item.note);
      expect(notes).toEqual(['Exp E', 'Exp D', 'Exp C', 'Exp B', 'Exp A']);
    });
  });
});
