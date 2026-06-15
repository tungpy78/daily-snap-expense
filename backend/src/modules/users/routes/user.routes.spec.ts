import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../../app';
import { User } from '../../../shared/models/user.model';
import sequelize from '../../../shared/database/index';
import { tokenService } from '../../auth/services/token.service';

describe('User Profile Integration Tests', () => {
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
      if (testUsersToCleanup.length > 0) {
        await User.destroy({
          where: {
            username: testUsersToCleanup,
          },
          force: true, // Hard delete from database
        });
      }
    } finally {
      await sequelize.close();
    }
  });

  const getUniqueCredentials = () => {
    const uniqueSuffix = Date.now() + Math.random().toString(36).substring(2, 7);
    const username = `test_profile_${uniqueSuffix}`;
    const email = `${username}@example.com`;
    const password = 'securePassword123';
    return { username, email, password };
  };

  describe('GET /api/v1/users/profile', () => {
    it('should return HTTP 401 when Authorization header is missing', async () => {
      const response = await request(app).get('/api/v1/users/profile');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('should return HTTP 401 when token is malformed', async () => {
      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', 'Bearer invalid.token.value');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_TOKEN');
    });

    it('should return HTTP 401 when token is expired', async () => {
      // Create a user first
      const credentials = getUniqueCredentials();
      testUsersToCleanup.push(credentials.username);
      const registerRes = await request(app).post('/api/v1/auth/register').send(credentials);
      const userId = registerRes.body.data.user.id;

      // Extract the actual access secret used by tokenService to avoid env discrepancies
      const tokenServiceWithSecret = tokenService as unknown as { accessSecret: string };
      const secret = tokenServiceWithSecret.accessSecret;

      // Generate a deterministic expired token
      const expiredToken = jwt.sign({ userId }, secret, {
        expiresIn: '-1s',
      });

      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'TOKEN_EXPIRED');
    });

    it('should return HTTP 200 and safe profile DTO when token is valid', async () => {
      const credentials = getUniqueCredentials();
      testUsersToCleanup.push(credentials.username);

      const registerRes = await request(app).post('/api/v1/auth/register').send(credentials);
      const accessToken = registerRes.body.data.tokens.accessToken;

      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');

      const user = response.body.data.user;
      expect(user).toHaveProperty('id');
      expect(user.username).toBe(credentials.username);
      expect(user.email).toBe(credentials.email);
      expect(user).toHaveProperty('avatarUrl', null);
      expect(user).toHaveProperty('createdAt');

      // Verification of formatting (createdAt should be ISO string)
      expect(new Date(user.createdAt).toISOString()).toBe(user.createdAt);

      // Security check: must NOT leak password hashes, delete stamps or tokens
      expect(user).not.toHaveProperty('password_hash');
      expect(user).not.toHaveProperty('passwordHash');
      expect(user).not.toHaveProperty('deleted_at');
      expect(user).not.toHaveProperty('deletedAt');
      expect(user).not.toHaveProperty('role');
    });

    it('should return HTTP 401 and USER_INACTIVE if user is inactive', async () => {
      const credentials = getUniqueCredentials();
      testUsersToCleanup.push(credentials.username);

      const registerRes = await request(app).post('/api/v1/auth/register').send(credentials);
      const accessToken = registerRes.body.data.tokens.accessToken;

      // Make the user inactive directly in the DB
      await User.update({ is_active: false }, { where: { username: credentials.username } });

      const response = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'USER_INACTIVE');
    });
  });
});
