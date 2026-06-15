import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import { User } from '../shared/models/user.model';
import sequelize from '../shared/database/index';
import { tokenService, TokenService } from '../modules/auth/services/token.service';

describe('Auth Middleware Integration Tests', () => {
  const testUsersToCleanup: string[] = [];

  afterAll(async () => {
    try {
      if (testUsersToCleanup.length > 0) {
        await User.destroy({
          where: {
            username: testUsersToCleanup,
          },
          force: true, // Hard delete test users
        });
      }
    } finally {
      await sequelize.close();
    }
  });

  const getUniqueCredentials = () => {
    const uniqueSuffix = Date.now() + Math.random().toString(36).substring(2, 7);
    const username = `test_middleware_${uniqueSuffix}`;
    const email = `${username}@example.com`;
    const password = 'securePassword123';
    return { username, email, password };
  };

  const createTestUser = async (isActive = true): Promise<User> => {
    const credentials = getUniqueCredentials();
    testUsersToCleanup.push(credentials.username);

    // Register user via API
    const response = await request(app).post('/api/v1/auth/register').send(credentials);

    const userId = response.body.data.user.id;
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('Test user could not be created');
    }

    if (!isActive) {
      user.is_active = false;
      await user.save();
    }

    return user;
  };

  it('should return HTTP 401 and UNAUTHORIZED when Authorization header is missing', async () => {
    const response = await request(app).get('/api/test-auth');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
  });

  it('should return HTTP 401 and UNAUTHORIZED when Authorization header is not Bearer format', async () => {
    const response = await request(app)
      .get('/api/test-auth')
      .set('Authorization', 'Basic some-credentials');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
  });

  it('should return HTTP 401 and INVALID_TOKEN when token is malformed', async () => {
    const response = await request(app)
      .get('/api/test-auth')
      .set('Authorization', 'Bearer invalid.token.value');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toHaveProperty('code', 'INVALID_TOKEN');
  });

  it('should return HTTP 401 and INVALID_TOKEN when token signature is invalid', async () => {
    const user = await createTestUser();
    const badTokenService = new TokenService({
      accessSecret: 'wrong_access_secret_value',
      accessExpiresIn: '15m',
    });
    const badToken = badTokenService.generateAccessToken({ userId: user.id });

    const response = await request(app)
      .get('/api/test-auth')
      .set('Authorization', `Bearer ${badToken}`);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toHaveProperty('code', 'INVALID_TOKEN');
  });

  it('should return HTTP 401 and TOKEN_EXPIRED when token is expired', async () => {
    const user = await createTestUser();
    // Sign token that expired 1 minute ago
    const secret = process.env.JWT_ACCESS_SECRET || 'dev_access_secret_only_local';
    const expiredToken = jwt.sign(
      { userId: user.id, exp: Math.floor(Date.now() / 1000) - 60 },
      secret,
    );

    const response = await request(app)
      .get('/api/test-auth')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toHaveProperty('code', 'TOKEN_EXPIRED');
  });

  it('should return HTTP 401 and USER_NOT_FOUND when user does not exist in database', async () => {
    // Generate token for a non-existent UUID
    const nonExistentUserId = 'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6';
    const token = tokenService.generateAccessToken({ userId: nonExistentUserId });

    const response = await request(app)
      .get('/api/test-auth')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toHaveProperty('code', 'USER_NOT_FOUND');
  });

  it('should return HTTP 401 and USER_INACTIVE when user is inactive', async () => {
    const user = await createTestUser(false);
    const token = tokenService.generateAccessToken({ userId: user.id });

    const response = await request(app)
      .get('/api/test-auth')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toHaveProperty('code', 'USER_INACTIVE');
  });

  it('should return HTTP 200 and request user DTO when token is valid and user is active', async () => {
    const user = await createTestUser(true);
    const token = tokenService.generateAccessToken({ userId: user.id });

    const response = await request(app)
      .get('/api/test-auth')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('user');
    expect(response.body.data.user.id).toBe(user.id);
    expect(response.body.data.user.username).toBe(user.username);
    expect(response.body.data.user.email).toBe(user.email);
    expect(response.body.data.user.role).toBe(user.role);
    expect(response.body.data.user).not.toHaveProperty('password_hash');
  });
});
