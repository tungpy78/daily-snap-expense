import request from 'supertest';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { Op } from 'sequelize';
import app from '../../../app';
import { User } from '../../../shared/models/user.model';
import { Category } from '../../../shared/models/category.model';
import { Snap } from '../../../shared/models/snap.model';
import { Expense } from '../../../shared/models/expense.model';
import sequelize from '../../../shared/database/index';
import { tokenService } from '../../auth/services/token.service';
import { LocalStorageProvider } from '../../../shared/storage/local-storage.provider';
import { ExpenseService } from '../../expenses/services/expense.service';

describe('Snap Integration Tests', () => {
  // ── Suite-unique identifiers ──────────────────────────────────────────────
  const shortId = randomUUID().replace(/-/g, '').slice(0, 12);
  const user1Username = `snap_u1_${shortId}`;
  const user2Username = `snap_u2_${shortId}`;
  const user1Email = `snap-u1-${shortId}@test.local`;
  const user2Email = `snap-u2-${shortId}@test.local`;

  const testAccessSecret = 'test_snap_access_secret';
  const testRefreshSecret = 'test_snap_refresh_secret';

  let user1: User;
  let user2: User;
  let token1: string;

  let sysCategory: Category;
  let user1Category: Category;
  let user2Category: Category;

  // ── Per-suite tracking for scoped cleanup ─────────────────────────────────
  const createdUserIds: string[] = [];
  const createdCategoryIds: string[] = [];
  const createdSnapIds: string[] = [];
  const uploadedImageUrls: string[] = [];

  const snapsUploadDir = path.resolve(process.cwd(), 'public/uploads/snaps');

  // Restore all mocks after every test so spies never leak between tests
  afterEach(() => {
    jest.restoreAllMocks();
  });

  beforeAll(async () => {
    // Inject mock JWT secrets
    process.env.JWT_ACCESS_SECRET = testAccessSecret;
    process.env.JWT_REFRESH_SECRET = testRefreshSecret;
    process.env.JWT_ACCESS_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';

    // Create test users with suite-unique credentials
    user1 = await User.create({
      username: user1Username,
      email: user1Email,
      password_hash: 'hashedpassword',
    });
    createdUserIds.push(user1.id);

    user2 = await User.create({
      username: user2Username,
      email: user2Email,
      password_hash: 'hashedpassword',
    });
    createdUserIds.push(user2.id);

    // Generate JWT for user1 only (user2 is only used for owning user2Category)
    const tokenServiceWithSecret = tokenService as unknown as { accessSecret: string };
    const secret = tokenServiceWithSecret.accessSecret;
    token1 = jwt.sign({ userId: user1.id }, secret, { expiresIn: '15m' });

    // Seed categories with suite-unique names
    sysCategory = await Category.create({
      name: `TestSnapSysCat_${shortId}`,
      color: '#FF0000',
      icon: 'star',
      user_id: null,
    });
    createdCategoryIds.push(sysCategory.id);

    user1Category = await Category.create({
      name: `TestSnapUser1Cat_${shortId}`,
      color: '#0000FF',
      icon: 'home',
      user_id: user1.id,
    });
    createdCategoryIds.push(user1Category.id);

    user2Category = await Category.create({
      name: `TestSnapUser2Cat_${shortId}`,
      color: '#FFFF00',
      icon: 'car',
      user_id: user2.id,
    });
    createdCategoryIds.push(user2Category.id);
  });

  afterAll(async () => {
    try {
      // Cleanup only data created by this suite, in FK-safe order
      await Expense.destroy({
        where: {
          [Op.or]: [{ user_id: createdUserIds }, { snap_id: createdSnapIds }],
        },
        force: true,
      });

      await Snap.destroy({
        where: {
          [Op.or]: [{ id: createdSnapIds }, { user_id: createdUserIds }],
        },
        force: true,
      });

      await Category.destroy({
        where: { id: createdCategoryIds },
        force: true,
      });

      await User.destroy({
        where: { id: createdUserIds },
        force: true,
      });

      // Cleanup only image files uploaded by this suite
      const storageProvider = new LocalStorageProvider();
      for (const url of uploadedImageUrls) {
        await storageProvider.deleteImage(url).catch(() => undefined);
      }
    } finally {
      await sequelize.close();
    }
  });

  describe('POST /api/v1/snaps', () => {
    // 1. No Authorization header -> 401 UNAUTHORIZED
    it('should return HTTP 401 when Authorization header is missing', async () => {
      const response = await request(app)
        .post('/api/v1/snaps')
        .attach('image', Buffer.from('fake-jpeg-data'), 'snap.jpg');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    // 2. Invalid token -> 401 INVALID_TOKEN
    it('should return HTTP 401 when token is invalid', async () => {
      const response = await request(app)
        .post('/api/v1/snaps')
        .set('Authorization', 'Bearer invalid.token.value')
        .attach('image', Buffer.from('fake-jpeg-data'), 'snap.jpg');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_TOKEN');
    });

    // 3. No image -> 400 VALIDATION_ERROR
    it('should return HTTP 400 when image file is missing', async () => {
      const response = await request(app)
        .post('/api/v1/snaps')
        .set('Authorization', `Bearer ${token1}`)
        .field('caption', 'Missing image file');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    // 4. Wrong file extension -> 400 INVALID_FILE_TYPE
    it('should return HTTP 400 when file extension is not allowed (.txt)', async () => {
      const response = await request(app)
        .post('/api/v1/snaps')
        .set('Authorization', `Bearer ${token1}`)
        .attach('image', Buffer.from('plain-text'), 'document.txt');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_FILE_TYPE');
    });

    // 5. File too large -> 400 FILE_TOO_LARGE
    it('should return HTTP 400 when file exceeds 5MB size limit', async () => {
      const hugeBuffer = Buffer.alloc(5 * 1024 * 1024 + 100);
      const response = await request(app)
        .post('/api/v1/snaps')
        .set('Authorization', `Bearer ${token1}`)
        .attach('image', hugeBuffer, 'huge.png');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'FILE_TOO_LARGE');
    });

    // 6. expenses malformed JSON -> 400 VALIDATION_ERROR
    it('should return HTTP 400 when expenses field is malformed JSON string', async () => {
      const response = await request(app)
        .post('/api/v1/snaps')
        .set('Authorization', `Bearer ${token1}`)
        .field('expenses', 'not-a-json-string{')
        .attach('image', Buffer.from('fake-png-data'), 'snap.png');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    // 7. expenses parses to object (not array) -> 400 VALIDATION_ERROR
    it('should return HTTP 400 when expenses field parses to object instead of array', async () => {
      const response = await request(app)
        .post('/api/v1/snaps')
        .set('Authorization', `Bearer ${token1}`)
        .field('expenses', JSON.stringify({ amount: 50000, categoryId: sysCategory.id }))
        .attach('image', Buffer.from('fake-png-data'), 'snap.png');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    // 8. expenses[].amount <= 0 -> 400 VALIDATION_ERROR
    it('should return HTTP 400 when amount in expenses is 0 or negative', async () => {
      const response = await request(app)
        .post('/api/v1/snaps')
        .set('Authorization', `Bearer ${token1}`)
        .field('expenses', JSON.stringify([{ amount: -100, categoryId: sysCategory.id }]))
        .attach('image', Buffer.from('fake-png-data'), 'snap.png');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    // 9. expenses[].categoryId invalid UUID -> 400 VALIDATION_ERROR
    it('should return HTTP 400 when categoryId in expenses is invalid UUID', async () => {
      const response = await request(app)
        .post('/api/v1/snaps')
        .set('Authorization', `Bearer ${token1}`)
        .field('expenses', JSON.stringify([{ amount: 50000, categoryId: 'not-a-uuid' }]))
        .attach('image', Buffer.from('fake-png-data'), 'snap.png');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    // 10. expenses[].date wrong format -> 400 VALIDATION_ERROR
    it('should return HTTP 400 when date in expenses has invalid format', async () => {
      const response = await request(app)
        .post('/api/v1/snaps')
        .set('Authorization', `Bearer ${token1}`)
        .field(
          'expenses',
          JSON.stringify([{ amount: 50000, categoryId: sysCategory.id, date: '15-06-2026' }]),
        )
        .attach('image', Buffer.from('fake-png-data'), 'snap.png');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    // 11. isPrivate invalid string -> 400 VALIDATION_ERROR
    it('should return HTTP 400 when isPrivate field is not a boolean or boolean string', async () => {
      const response = await request(app)
        .post('/api/v1/snaps')
        .set('Authorization', `Bearer ${token1}`)
        .field('isPrivate', 'not-a-boolean')
        .attach('image', Buffer.from('fake-png-data'), 'snap.png');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    // 12. Category does not exist -> 400 CATEGORY_NOT_FOUND
    it('should return HTTP 400 when categoryId does not exist', async () => {
      const nonExistentCatId = '99999999-9999-9999-9999-999999999999';
      const response = await request(app)
        .post('/api/v1/snaps')
        .set('Authorization', `Bearer ${token1}`)
        .field('expenses', JSON.stringify([{ amount: 50000, categoryId: nonExistentCatId }]))
        .attach('image', Buffer.from('fake-png-data'), 'snap.png');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'CATEGORY_NOT_FOUND');
    });

    // 13. Category belongs to another user -> 403 FORBIDDEN
    it("should return HTTP 403 when categoryId belongs to another user's custom category", async () => {
      const response = await request(app)
        .post('/api/v1/snaps')
        .set('Authorization', `Bearer ${token1}`)
        .field('expenses', JSON.stringify([{ amount: 50000, categoryId: user2Category.id }]))
        .attach('image', Buffer.from('fake-png-data'), 'snap.png');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
    });

    // 14. Create snap without expenses -> 201
    it('should create snap successfully without any expenses', async () => {
      const response = await request(app)
        .post('/api/v1/snaps')
        .set('Authorization', `Bearer ${token1}`)
        .field('caption', 'No expenses snap')
        .field('isPrivate', 'true')
        .attach('image', Buffer.from('fake-jpg-data-1'), 'snap1.jpg');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('snap');
      expect(response.body.data.expenses).toEqual([]);

      const snap = response.body.data.snap;
      createdSnapIds.push(snap.id);
      uploadedImageUrls.push(snap.imageUrl);

      expect(snap).toHaveProperty('id');
      expect(snap.imageUrl).toContain('/public/uploads/snaps/');
      expect(snap.caption).toBe('No expenses snap');
      expect(snap.isPrivate).toBe(true);
      expect(snap).toHaveProperty('createdAt');

      // Verify no internal DB keys are leaked
      expect(snap).not.toHaveProperty('user_id');
      expect(snap).not.toHaveProperty('image_url');
      expect(snap).not.toHaveProperty('is_private');
      expect(snap).not.toHaveProperty('deleted_at');
      expect(snap).not.toHaveProperty('updated_at');

      // Verify file exists on disk
      const fileName = path.basename(snap.imageUrl);
      const filePath = path.join(snapsUploadDir, fileName);
      expect(fs.existsSync(filePath)).toBe(true);

      // Verify DB record
      const dbSnap = await Snap.findByPk(snap.id);
      expect(dbSnap).toBeDefined();
      expect(dbSnap!.user_id).toBe(user1.id);
      expect(dbSnap!.caption).toBe('No expenses snap');
      expect(dbSnap!.is_private).toBe(true);
    });

    // 15. Create snap with one system category expense -> 201
    it('should create snap successfully with one system category expense', async () => {
      const response = await request(app)
        .post('/api/v1/snaps')
        .set('Authorization', `Bearer ${token1}`)
        .field('caption', 'System category snap')
        .field('isPrivate', 'false')
        .field('expenses', JSON.stringify([{ amount: 15000, categoryId: sysCategory.id }]))
        .attach('image', Buffer.from('fake-jpg-data-2'), 'snap2.jpg');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);

      const snap = response.body.data.snap;
      const expenses = response.body.data.expenses;
      createdSnapIds.push(snap.id);
      uploadedImageUrls.push(snap.imageUrl);

      expect(snap.isPrivate).toBe(false);
      expect(expenses.length).toBe(1);

      const expense = expenses[0];
      expect(expense).toHaveProperty('id');
      expect(expense.amount).toBe(15000);
      expect(expense.categoryId).toBe(sysCategory.id);
      expect(expense).not.toHaveProperty('snapId');
      expect(expense).not.toHaveProperty('user_id');
      expect(expense).not.toHaveProperty('deleted_at');

      // Verify DB records
      const dbSnap = await Snap.findByPk(snap.id);
      expect(dbSnap).toBeDefined();

      const dbExpense = await Expense.findByPk(expense.id);
      expect(dbExpense).toBeDefined();
      expect(dbExpense!.snap_id).toBe(snap.id);
      expect(dbExpense!.user_id).toBe(user1.id);
    });

    // 16. Create snap with multiple expenses -> 201
    it('should create snap successfully with multiple system and custom category expenses', async () => {
      const response = await request(app)
        .post('/api/v1/snaps')
        .set('Authorization', `Bearer ${token1}`)
        .field('caption', 'Multiple expenses snap')
        .field(
          'expenses',
          JSON.stringify([
            { amount: 20000, categoryId: sysCategory.id, note: 'Exp 1' },
            { amount: 30000, categoryId: user1Category.id, note: 'Exp 2' },
          ]),
        )
        .attach('image', Buffer.from('fake-png-data-3'), 'snap3.png');

      expect(response.status).toBe(201);

      const snap = response.body.data.snap;
      createdSnapIds.push(snap.id);
      uploadedImageUrls.push(snap.imageUrl);

      const expenses = response.body.data.expenses;
      expect(expenses.length).toBe(2);

      const expenseIds = expenses.map((e: { id: string }) => e.id);
      const dbExpenses = await Expense.findAll({ where: { id: expenseIds } });
      expect(dbExpenses.length).toBe(2);
      dbExpenses.forEach((exp) => {
        expect(exp.snap_id).toBe(snap.id);
      });
    });

    // 17. Create snap with own custom category expense -> 201
    it('should create snap successfully with own custom category expense', async () => {
      const response = await request(app)
        .post('/api/v1/snaps')
        .set('Authorization', `Bearer ${token1}`)
        .field('expenses', JSON.stringify([{ amount: 10000, categoryId: user1Category.id }]))
        .attach('image', Buffer.from('fake-png-data-4'), 'snap4.png');

      expect(response.status).toBe(201);

      const snap = response.body.data.snap;
      createdSnapIds.push(snap.id);
      uploadedImageUrls.push(snap.imageUrl);

      const dbExpense = await Expense.findByPk(response.body.data.expenses[0].id);
      expect(dbExpense).toBeDefined();
      expect(dbExpense!.category_id).toBe(user1Category.id);
    });

    // 18. Empty caption -> null in response
    it('should return null caption when caption is empty string or only whitespace', async () => {
      const response = await request(app)
        .post('/api/v1/snaps')
        .set('Authorization', `Bearer ${token1}`)
        .field('caption', '    ')
        .attach('image', Buffer.from('fake-png-data-5'), 'snap5.png');

      expect(response.status).toBe(201);

      const snap = response.body.data.snap;
      createdSnapIds.push(snap.id);
      uploadedImageUrls.push(snap.imageUrl);

      expect(snap.caption).toBeNull();
    });

    // 19. isPrivate omitted -> defaults to true
    it('should set isPrivate to true by default when isPrivate is omitted', async () => {
      const response = await request(app)
        .post('/api/v1/snaps')
        .set('Authorization', `Bearer ${token1}`)
        .attach('image', Buffer.from('fake-png-data-6'), 'snap6.png');

      expect(response.status).toBe(201);

      const snap = response.body.data.snap;
      createdSnapIds.push(snap.id);
      uploadedImageUrls.push(snap.imageUrl);

      expect(snap.isPrivate).toBe(true);
    });

    // 20. isPrivate string "false" -> false
    it('should parse isPrivate string "false" to false', async () => {
      const response = await request(app)
        .post('/api/v1/snaps')
        .set('Authorization', `Bearer ${token1}`)
        .field('isPrivate', 'false')
        .attach('image', Buffer.from('fake-png-data-7'), 'snap7.png');

      expect(response.status).toBe(201);

      const snap = response.body.data.snap;
      createdSnapIds.push(snap.id);
      uploadedImageUrls.push(snap.imageUrl);

      expect(snap.isPrivate).toBe(false);
    });

    // 25. Rollback: error after upload -> transaction rolled back + image deleted from disk
    it('should rollback transaction, save no records, and delete uploaded image from disk when an expense fails creation', async () => {
      const expenseSpy = jest
        .spyOn(ExpenseService, 'createManualExpense')
        .mockRejectedValueOnce(new Error('Mock DB write error'));

      const deleteSpy = jest.spyOn(LocalStorageProvider.prototype, 'deleteImage');

      try {
        const response = await request(app)
          .post('/api/v1/snaps')
          .set('Authorization', `Bearer ${token1}`)
          .field('caption', `Rollback snap test ${shortId}`)
          .field(
            'expenses',
            JSON.stringify([{ amount: 50000, categoryId: sysCategory.id, note: 'Valid' }]),
          )
          .attach('image', Buffer.from('fake-jpg-rollback'), 'snap-rollback.jpg');

        expect(response.status).toBe(500);

        // Cleanup image must have been called
        expect(deleteSpy).toHaveBeenCalled();

        // File must not exist on disk after cleanup
        const deletedPath = deleteSpy.mock.calls[0][0];
        const fileName = path.basename(deletedPath);
        const filePath = path.join(snapsUploadDir, fileName);
        expect(fs.existsSync(filePath)).toBe(false);

        // No snap record persisted
        const dbSnaps = await Snap.findAll({
          where: { caption: `Rollback snap test ${shortId}` },
        });
        expect(dbSnaps.length).toBe(0);

        // No expense record persisted
        const dbExpenses = await Expense.findAll({ where: { note: 'Valid' } });
        expect(dbExpenses.length).toBe(0);
      } finally {
        deleteSpy.mockRestore();
        expenseSpy.mockRestore();
      }
    });
  });

  describe('GET /api/v1/snaps/timeline', () => {
    interface TestTimelineExpenseResponse {
      id: string;
      amount: number;
      categoryId: string;
      categoryName: string | null;
      note: string | null;
      date: string;
      user_id?: unknown;
      category_id?: unknown;
      snap_id?: unknown;
      deleted_at?: unknown;
      updated_at?: unknown;
    }

    interface TestTimelineSnapResponse {
      id: string;
      imageUrl: string;
      caption: string | null;
      isPrivate: boolean;
      createdAt: string;
      expenses: TestTimelineExpenseResponse[];
      reactions: unknown[];
      user_id?: unknown;
      image_url?: unknown;
      is_private?: unknown;
      deleted_at?: unknown;
      updated_at?: unknown;
    }

    interface TestTimelineResponseBody {
      success: boolean;
      data: {
        snaps: TestTimelineSnapResponse[];
        pagination: {
          total: number;
          limit: number;
          offset: number;
        };
      };
    }

    beforeAll(async () => {
      // Clear any previous snaps/expenses created by POST tests for user1/user2 to have a clean timeline state
      await Expense.destroy({ where: { user_id: createdUserIds }, force: true });
      await Snap.destroy({ where: { id: createdSnapIds }, force: true });
      createdSnapIds.length = 0;

      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      // Seed 3 snaps for user1:
      // Snap A: today, caption "Morning coffee", isPrivate: false, has 1 expense
      const snapA = await Snap.create({
        user_id: user1.id,
        image_url: 'http://localhost:5001/public/uploads/snaps/snapA.jpg',
        caption: 'Morning coffee',
        is_private: false,
        created_at: now,
      });
      createdSnapIds.push(snapA.id);

      await Expense.create({
        user_id: user1.id,
        category_id: sysCategory.id,
        amount: 15000,
        note: 'Coffee',
        date: todayStr,
        snap_id: snapA.id,
        created_at: now,
      });

      // Snap B: yesterday, caption "Office lunch", isPrivate: true, has 1 expense
      const snapB = await Snap.create({
        user_id: user1.id,
        image_url: 'http://localhost:5001/public/uploads/snaps/snapB.jpg',
        caption: 'Office lunch',
        is_private: true,
        created_at: yesterday,
      });
      createdSnapIds.push(snapB.id);

      await Expense.create({
        user_id: user1.id,
        category_id: user1Category.id,
        amount: 45000.5,
        note: 'Lunch',
        date: yesterdayStr,
        snap_id: snapB.id,
        created_at: yesterday,
      });

      // Snap C: 2 days ago, caption "Gym workout", isPrivate: false, no expenses
      const snapC = await Snap.create({
        user_id: user1.id,
        image_url: 'http://localhost:5001/public/uploads/snaps/snapC.jpg',
        caption: 'Gym workout',
        is_private: false,
        created_at: twoDaysAgo,
      });
      createdSnapIds.push(snapC.id);

      // Snap D: created for user2 (to verify isolation)
      const snapD = await Snap.create({
        user_id: user2.id,
        image_url: 'http://localhost:5001/public/uploads/snaps/snapD.jpg',
        caption: 'User 2 snap',
        is_private: false,
        created_at: now,
      });
      createdSnapIds.push(snapD.id);
    });

    it('should return HTTP 401 when Authorization header is missing', async () => {
      const response = await request(app).get('/api/v1/snaps/timeline');
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return HTTP 401 when token is invalid', async () => {
      const response = await request(app)
        .get('/api/v1/snaps/timeline')
        .set('Authorization', 'Bearer invalid.token.value');
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it("should return user's snaps only (excluding other users' snaps) and default pagination", async () => {
      const response = await request(app)
        .get('/api/v1/snaps/timeline')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      const body = response.body as TestTimelineResponseBody;
      expect(body.success).toBe(true);

      const snaps = body.data.snaps;
      expect(snaps.length).toBe(3);

      // Verify no snap belongs to user2
      const user2Snap = snaps.find((s) => s.caption === 'User 2 snap');
      expect(user2Snap).toBeUndefined();

      expect(body.data.pagination).toEqual({
        total: 3,
        limit: 20,
        offset: 0,
      });
    });

    it('should return expenses with categoryName, numeric amount, and empty reactions', async () => {
      const response = await request(app)
        .get('/api/v1/snaps/timeline')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      const body = response.body as TestTimelineResponseBody;
      const snaps = body.data.snaps;
      const snapWithExpense = snaps.find((s) => s.expenses.length > 0);
      expect(snapWithExpense).toBeDefined();
      if (snapWithExpense) {
        expect(snapWithExpense.reactions).toEqual([]);

        const expense = snapWithExpense.expenses[0];
        expect(typeof expense.amount).toBe('number');
        expect(expense.categoryName).toBeDefined();
        expect(expense.categoryName).not.toBeNull();
      }
    });

    it('should sort snaps by createdAt DESC', async () => {
      const response = await request(app)
        .get('/api/v1/snaps/timeline')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      const body = response.body as TestTimelineResponseBody;
      const snaps = body.data.snaps;
      const seeded = snaps.filter((s) =>
        ['Morning coffee', 'Office lunch', 'Gym workout'].includes(s.caption || ''),
      );
      expect(seeded.length).toBe(3);
      expect(seeded[0].caption).toBe('Morning coffee');
      expect(seeded[1].caption).toBe('Office lunch');
      expect(seeded[2].caption).toBe('Gym workout');
    });

    it('should apply limit and offset correctly', async () => {
      const response = await request(app)
        .get('/api/v1/snaps/timeline')
        .set('Authorization', `Bearer ${token1}`)
        .query({ limit: 1, offset: 1 });

      expect(response.status).toBe(200);
      const body = response.body as TestTimelineResponseBody;
      const snaps = body.data.snaps;
      expect(snaps.length).toBe(1);
      expect(body.data.pagination.limit).toBe(1);
      expect(body.data.pagination.offset).toBe(1);
    });

    it('should filter by startDate and endDate correctly', async () => {
      const todayStr = new Date().toISOString().slice(0, 10);
      const response = await request(app)
        .get('/api/v1/snaps/timeline')
        .set('Authorization', `Bearer ${token1}`)
        .query({ startDate: todayStr, endDate: todayStr });

      expect(response.status).toBe(200);
      const body = response.body as TestTimelineResponseBody;
      const snaps = body.data.snaps;
      const seeded = snaps.filter((s) =>
        ['Morning coffee', 'Office lunch', 'Gym workout'].includes(s.caption || ''),
      );
      expect(seeded.length).toBe(1);
      expect(seeded[0].caption).toBe('Morning coffee');
    });

    it('should return HTTP 400 when startDate > endDate', async () => {
      const response = await request(app)
        .get('/api/v1/snaps/timeline')
        .set('Authorization', `Bearer ${token1}`)
        .query({ startDate: '2026-06-15', endDate: '2026-06-14' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return HTTP 400 when dates have invalid format', async () => {
      const response = await request(app)
        .get('/api/v1/snaps/timeline')
        .set('Authorization', `Bearer ${token1}`)
        .query({ startDate: '15-06-2026' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should filter by search keyword correctly', async () => {
      const response = await request(app)
        .get('/api/v1/snaps/timeline')
        .set('Authorization', `Bearer ${token1}`)
        .query({ search: 'coffee' });

      expect(response.status).toBe(200);
      const body = response.body as TestTimelineResponseBody;
      const snaps = body.data.snaps;
      expect(snaps.length).toBe(1);
      expect(snaps[0].caption).toBe('Morning coffee');
    });

    it('should exclude soft-deleted snaps', async () => {
      const tempSnap = await Snap.create({
        user_id: user1.id,
        image_url: 'http://localhost:5001/public/uploads/snaps/tempSnap.jpg',
        caption: 'To be soft deleted',
        is_private: false,
      });
      createdSnapIds.push(tempSnap.id);

      const responseBefore = await request(app)
        .get('/api/v1/snaps/timeline')
        .set('Authorization', `Bearer ${token1}`);

      const bodyBefore = responseBefore.body as TestTimelineResponseBody;
      const foundBefore = bodyBefore.data.snaps.find((s) => s.id === tempSnap.id);
      expect(foundBefore).toBeDefined();

      await Snap.destroy({ where: { id: tempSnap.id } });

      const responseAfter = await request(app)
        .get('/api/v1/snaps/timeline')
        .set('Authorization', `Bearer ${token1}`);

      const bodyAfter = responseAfter.body as TestTimelineResponseBody;
      const foundAfter = bodyAfter.data.snaps.find((s) => s.id === tempSnap.id);
      expect(foundAfter).toBeUndefined();
    });

    it('should not leak internal fields', async () => {
      const response = await request(app)
        .get('/api/v1/snaps/timeline')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      const body = response.body as TestTimelineResponseBody;
      const snaps = body.data.snaps;
      expect(snaps.length).toBeGreaterThan(0);

      snaps.forEach((snap) => {
        const snapRecord = snap as unknown as Record<string, unknown>;
        expect(snapRecord.user_id).toBeUndefined();
        expect(snapRecord.image_url).toBeUndefined();
        expect(snapRecord.is_private).toBeUndefined();
        expect(snapRecord.deleted_at).toBeUndefined();
        expect(snapRecord.updated_at).toBeUndefined();

        snap.expenses.forEach((expense) => {
          const expenseRecord = expense as unknown as Record<string, unknown>;
          expect(expenseRecord.category_id).toBeUndefined();
          expect(expenseRecord.snap_id).toBeUndefined();
          expect(expenseRecord.deleted_at).toBeUndefined();
          expect(expenseRecord.updated_at).toBeUndefined();
        });
      });
    });

    it('should return empty timeline when user has no snaps', async () => {
      const tempUsername = `snap_temp_${randomUUID().replace(/-/g, '').slice(0, 8)}`;
      const tempEmail = `snap-temp-${randomUUID().replace(/-/g, '').slice(0, 8)}@test.local`;
      const tempUser = await User.create({
        username: tempUsername,
        email: tempEmail,
        password_hash: 'hashedpassword',
      });
      createdUserIds.push(tempUser.id);

      const tokenServiceWithSecret = tokenService as unknown as { accessSecret: string };
      const secret = tokenServiceWithSecret.accessSecret;
      const tempToken = jwt.sign({ userId: tempUser.id }, secret, { expiresIn: '15m' });

      const response = await request(app)
        .get('/api/v1/snaps/timeline')
        .set('Authorization', `Bearer ${tempToken}`);

      expect(response.status).toBe(200);
      const body = response.body as TestTimelineResponseBody;
      expect(body.success).toBe(true);
      expect(body.data.snaps).toEqual([]);
      expect(body.data.pagination.total).toBe(0);
    });
  });
});
