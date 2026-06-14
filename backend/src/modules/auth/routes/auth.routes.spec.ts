import request from 'supertest';
import app from '../../../app';
import { User } from '../../../shared/models/user.model';
import sequelize from '../../../shared/database/index';

describe('Auth Registration Integration Tests', () => {
  const testUsersToCleanup: string[] = [];
  const testAccessSecret = 'test_integration_access_secret';
  const testRefreshSecret = 'test_integration_refresh_secret';

  beforeAll(() => {
    // Inject mock secrets for integration tests
    process.env.JWT_ACCESS_SECRET = testAccessSecret;
    process.env.JWT_REFRESH_SECRET = testRefreshSecret;
    process.env.JWT_ACCESS_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  });

  afterAll(async () => {
    try {
      // Cleanup created test users to ensure no duplicate email/username errors in next runs
      if (testUsersToCleanup.length > 0) {
        await User.destroy({
          where: {
            username: testUsersToCleanup,
          },
          force: true, // Hard delete from database (bypassing paranoid soft delete)
        });
      }
    } finally {
      // Close database connection to allow Jest to exit cleanly
      await sequelize.close();
    }
  });

  const getUniqueCredentials = () => {
    const uniqueSuffix = Date.now() + Math.random().toString(36).substring(2, 7);
    const username = `test_register_${uniqueSuffix}`;
    const email = `${username}@example.com`;
    const password = 'securePassword123';
    return { username, email, password };
  };

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully and return HTTP 201', async () => {
      const credentials = getUniqueCredentials();
      testUsersToCleanup.push(credentials.username);

      const response = await request(app).post('/api/v1/auth/register').send(credentials);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.username).toBe(credentials.username);
      expect(response.body.data.user.email).toBe(credentials.email);
      expect(response.body.data.user).toHaveProperty('role', 'user');

      // Verify tokens are present in response
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');

      // Security check: password_hash must NOT be in the response
      expect(response.body.data.user).not.toHaveProperty('password_hash');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should return HTTP 400 when email format is invalid', async () => {
      const credentials = getUniqueCredentials();
      credentials.email = 'invalid-email-format';

      const response = await request(app).post('/api/v1/auth/register').send(credentials);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return HTTP 400 when password is too short', async () => {
      const credentials = getUniqueCredentials();
      credentials.password = '12345'; // Less than 6 characters

      const response = await request(app).post('/api/v1/auth/register').send(credentials);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return HTTP 400 when username is in invalid format', async () => {
      const credentials = getUniqueCredentials();
      credentials.username = 'test user invalid-'; // Spaces and dashes not allowed

      const response = await request(app).post('/api/v1/auth/register').send(credentials);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return HTTP 400 and EMAIL_ALREADY_EXISTS when email is already registered', async () => {
      const baseCredentials = getUniqueCredentials();
      testUsersToCleanup.push(baseCredentials.username);

      // Register first user
      await request(app).post('/api/v1/auth/register').send(baseCredentials);

      // Register second user with same email but different username
      const secondCredentials = getUniqueCredentials();
      secondCredentials.email = baseCredentials.email;
      testUsersToCleanup.push(secondCredentials.username);

      const response = await request(app).post('/api/v1/auth/register').send(secondCredentials);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'EMAIL_ALREADY_EXISTS');
    });

    it('should return HTTP 400 and USERNAME_ALREADY_EXISTS when username is already registered', async () => {
      const baseCredentials = getUniqueCredentials();
      testUsersToCleanup.push(baseCredentials.username);

      // Register first user
      await request(app).post('/api/v1/auth/register').send(baseCredentials);

      // Register second user with same username but different email
      const secondCredentials = getUniqueCredentials();
      secondCredentials.username = baseCredentials.username;
      testUsersToCleanup.push(secondCredentials.username);

      const response = await request(app).post('/api/v1/auth/register').send(secondCredentials);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'USERNAME_ALREADY_EXISTS');
    });
  });
});
