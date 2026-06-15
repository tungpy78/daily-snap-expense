import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../../app';
import { User } from '../../../shared/models/user.model';
import { Category } from '../../../shared/models/category.model';
import sequelize from '../../../shared/database/index';
import { tokenService } from '../../auth/services/token.service';

describe('Category Integration Tests', () => {
  const testUsernames = ['test_cat_user_1', 'test_cat_user_2', 'test_cat_user_no_custom'];
  const testCategoryNames = [
    'TestSystemCategoryA',
    'TestSystemCategoryB',
    'TestUser1CustomCategory',
    'TestUser2CustomCategory',
  ];

  const testAccessSecret = 'test_integration_access_secret';
  const testRefreshSecret = 'test_integration_refresh_secret';

  let user1: User;
  let user2: User;
  let userNoCustom: User;

  let token1: string;
  let token2: string;
  let tokenNoCustom: string;

  beforeAll(async () => {
    // Inject mock secrets for integration tests
    process.env.JWT_ACCESS_SECRET = testAccessSecret;
    process.env.JWT_REFRESH_SECRET = testRefreshSecret;
    process.env.JWT_ACCESS_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';

    // Clean up if any dirty state left
    await Category.destroy({
      where: { name: testCategoryNames },
    });
    await User.destroy({
      where: { username: testUsernames },
      force: true,
    });

    // Create test users
    user1 = await User.create({
      username: 'test_cat_user_1',
      email: 'test_cat_user_1@example.com',
      password_hash: 'hashedpassword',
    });

    user2 = await User.create({
      username: 'test_cat_user_2',
      email: 'test_cat_user_2@example.com',
      password_hash: 'hashedpassword',
    });

    userNoCustom = await User.create({
      username: 'test_cat_user_no_custom',
      email: 'test_cat_user_no_custom@example.com',
      password_hash: 'hashedpassword',
    });

    // Generate valid tokens
    const tokenServiceWithSecret = tokenService as unknown as { accessSecret: string };
    const secret = tokenServiceWithSecret.accessSecret;

    token1 = jwt.sign({ userId: user1.id }, secret, { expiresIn: '15m' });
    token2 = jwt.sign({ userId: user2.id }, secret, { expiresIn: '15m' });
    tokenNoCustom = jwt.sign({ userId: userNoCustom.id }, secret, { expiresIn: '15m' });

    // Seed test categories
    // 1. System/default categories (user_id = null)
    await Category.create({
      name: 'TestSystemCategoryA',
      color: '#FF0000',
      icon: 'star',
      user_id: null,
    });

    await Category.create({
      name: 'TestSystemCategoryB',
      color: '#00FF00',
      icon: 'heart',
      user_id: null,
    });

    // 2. Custom category for user 1
    await Category.create({
      name: 'TestUser1CustomCategory',
      color: '#0000FF',
      icon: 'home',
      user_id: user1.id,
    });

    // 3. Custom category for user 2
    await Category.create({
      name: 'TestUser2CustomCategory',
      color: '#FFFF00',
      icon: 'car',
      user_id: user2.id,
    });
  });

  afterAll(async () => {
    try {
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

  interface ExpectedCategory {
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
    isDefault: boolean;
    user_id?: string;
    userId?: string;
    created_at?: string;
    createdAt?: string;
    updated_at?: string;
    updatedAt?: string;
    deleted_at?: string;
    deletedAt?: string;
  }

  describe('GET /api/v1/categories', () => {
    it('should return HTTP 401 when Authorization header is missing', async () => {
      const response = await request(app).get('/api/v1/categories');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('should return HTTP 401 when token is invalid', async () => {
      const response = await request(app)
        .get('/api/v1/categories')
        .set('Authorization', 'Bearer invalid.token.value');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_TOKEN');
    });

    it('should return HTTP 200 and categories available to the user', async () => {
      const response = await request(app)
        .get('/api/v1/categories')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('categories');

      const categories = response.body.data.categories as ExpectedCategory[];
      expect(Array.isArray(categories)).toBe(true);

      // Verify that system categories are present and isDefault is true
      const sysCatA = categories.find((c: ExpectedCategory) => c.name === 'TestSystemCategoryA');
      expect(sysCatA).toBeDefined();
      expect(sysCatA!.isDefault).toBe(true);
      expect(sysCatA!.color).toBe('#FF0000');
      expect(sysCatA!.icon).toBe('star');

      const sysCatB = categories.find((c: ExpectedCategory) => c.name === 'TestSystemCategoryB');
      expect(sysCatB).toBeDefined();
      expect(sysCatB!.isDefault).toBe(true);

      // Verify that user 1's custom category is present and isDefault is false
      const user1Custom = categories.find(
        (c: ExpectedCategory) => c.name === 'TestUser1CustomCategory',
      );
      expect(user1Custom).toBeDefined();
      expect(user1Custom!.isDefault).toBe(false);
      expect(user1Custom!.color).toBe('#0000FF');
      expect(user1Custom!.icon).toBe('home');

      // Verify that user 2's custom category is NOT present
      const user2Custom = categories.find(
        (c: ExpectedCategory) => c.name === 'TestUser2CustomCategory',
      );
      expect(user2Custom).toBeUndefined();

      // Verify no sensitive/internal database columns are leaked
      categories.forEach((cat: ExpectedCategory) => {
        expect(cat).toHaveProperty('id');
        expect(cat).toHaveProperty('name');
        expect(cat).toHaveProperty('color');
        expect(cat).toHaveProperty('icon');
        expect(cat).toHaveProperty('isDefault');

        expect(cat).not.toHaveProperty('user_id');
        expect(cat).not.toHaveProperty('userId');
        expect(cat).not.toHaveProperty('created_at');
        expect(cat).not.toHaveProperty('createdAt');
        expect(cat).not.toHaveProperty('updated_at');
        expect(cat).not.toHaveProperty('updatedAt');
        expect(cat).not.toHaveProperty('deleted_at');
        expect(cat).not.toHaveProperty('deletedAt');
      });
    });

    it('should return system categories and custom categories specific to user 2 when requested by user 2', async () => {
      const response = await request(app)
        .get('/api/v1/categories')
        .set('Authorization', `Bearer ${token2}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('categories');

      const categories = response.body.data.categories as ExpectedCategory[];
      expect(Array.isArray(categories)).toBe(true);

      // Verify that system categories are present and isDefault is true
      const sysCatA = categories.find((c: ExpectedCategory) => c.name === 'TestSystemCategoryA');
      expect(sysCatA).toBeDefined();
      expect(sysCatA!.isDefault).toBe(true);

      // Verify that user 2's custom category is present and isDefault is false
      const user2Custom = categories.find(
        (c: ExpectedCategory) => c.name === 'TestUser2CustomCategory',
      );
      expect(user2Custom).toBeDefined();
      expect(user2Custom!.isDefault).toBe(false);
      expect(user2Custom!.color).toBe('#FFFF00');
      expect(user2Custom!.icon).toBe('car');

      // Verify that user 1's custom category is NOT present
      const user1Custom = categories.find(
        (c: ExpectedCategory) => c.name === 'TestUser1CustomCategory',
      );
      expect(user1Custom).toBeUndefined();
    });

    it('should return only system categories if user has no custom categories', async () => {
      const response = await request(app)
        .get('/api/v1/categories')
        .set('Authorization', `Bearer ${tokenNoCustom}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('categories');

      const categories = response.body.data.categories as ExpectedCategory[];

      // Verify system categories are present
      const sysCatA = categories.find((c: ExpectedCategory) => c.name === 'TestSystemCategoryA');
      expect(sysCatA).toBeDefined();
      expect(sysCatA!.isDefault).toBe(true);

      // Verify no custom categories from other users are returned
      const user1Custom = categories.find(
        (c: ExpectedCategory) => c.name === 'TestUser1CustomCategory',
      );
      expect(user1Custom).toBeUndefined();

      const user2Custom = categories.find(
        (c: ExpectedCategory) => c.name === 'TestUser2CustomCategory',
      );
      expect(user2Custom).toBeUndefined();
    });
  });
});
