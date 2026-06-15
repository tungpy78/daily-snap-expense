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

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with registered email and return HTTP 200', async () => {
      const credentials = getUniqueCredentials();
      testUsersToCleanup.push(credentials.username);
      await request(app).post('/api/v1/auth/register').send(credentials);

      const response = await request(app).post('/api/v1/auth/login').send({
        identity: credentials.email,
        password: credentials.password,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(credentials.email);
      expect(response.body.data.user.username).toBe(credentials.username);
      expect(response.body.data.user).toHaveProperty('role', 'user');
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');

      expect(response.body.data.user).not.toHaveProperty('password_hash');
      expect(response.body.data.user).not.toHaveProperty('password');

      const updatedUser = await User.findOne({ where: { email: credentials.email } });
      expect(updatedUser?.last_login_at).not.toBeNull();
    });

    it('should login successfully with registered username and return HTTP 200', async () => {
      const credentials = getUniqueCredentials();
      testUsersToCleanup.push(credentials.username);
      await request(app).post('/api/v1/auth/register').send(credentials);

      const response = await request(app).post('/api/v1/auth/login').send({
        identity: credentials.username,
        password: credentials.password,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.user.email).toBe(credentials.email);
      expect(response.body.data.user.username).toBe(credentials.username);
    });

    it('should return HTTP 401 and INVALID_CREDENTIALS when identity does not exist', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        identity: 'nonexistent_user@example.com',
        password: 'somePassword123',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_CREDENTIALS');
    });

    it('should return HTTP 401 and INVALID_CREDENTIALS when password is incorrect', async () => {
      const credentials = getUniqueCredentials();
      testUsersToCleanup.push(credentials.username);
      await request(app).post('/api/v1/auth/register').send(credentials);

      const response = await request(app).post('/api/v1/auth/login').send({
        identity: credentials.email,
        password: 'wrongPassword123',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_CREDENTIALS');
    });

    it('should return HTTP 401 and USER_INACTIVE when user is inactive', async () => {
      const credentials = getUniqueCredentials();
      testUsersToCleanup.push(credentials.username);

      await request(app).post('/api/v1/auth/register').send(credentials);
      await User.update({ is_active: false }, { where: { email: credentials.email } });

      const response = await request(app).post('/api/v1/auth/login').send({
        identity: credentials.email,
        password: credentials.password,
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'USER_INACTIVE');
    });

    it('should return HTTP 400 and VALIDATION_ERROR when identity is empty', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        identity: '',
        password: 'somePassword123',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return HTTP 400 and VALIDATION_ERROR when password is empty', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        identity: 'test_user',
        password: '',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh tokens successfully with valid refresh token and return HTTP 200', async () => {
      // 1. Register and login to get a refresh token
      const credentials = getUniqueCredentials();
      testUsersToCleanup.push(credentials.username);
      const registerRes = await request(app).post('/api/v1/auth/register').send(credentials);
      const oldRefreshToken = registerRes.body.data.tokens.refreshToken;

      // 2. Call refresh
      const response = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken: oldRefreshToken,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');

      // Security check: no internal metadata leaked
      expect(response.body.data).not.toHaveProperty('jti');
      expect(response.body.data).not.toHaveProperty('refreshTokenId');
      expect(response.body.data).not.toHaveProperty('refreshTokenExpiresAt');
      expect(response.body.data).not.toHaveProperty('password_hash');

      // 3. Trying to reuse the old refresh token (rotated) must fail
      const reuseResponse = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken: oldRefreshToken,
      });
      expect(reuseResponse.status).toBe(401);
      expect(reuseResponse.body).toHaveProperty('success', false);
      expect(reuseResponse.body.error).toHaveProperty('code', 'INVALID_TOKEN');
    });

    it('should return HTTP 401 when refresh token is malformed', async () => {
      const response = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken: 'invalid.refresh.token',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_TOKEN');
    });

    it('should return HTTP 400 when refreshToken is empty', async () => {
      const response = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken: '',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return HTTP 400 when refreshToken is missing', async () => {
      const response = await request(app).post('/api/v1/auth/refresh').send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully and return HTTP 200', async () => {
      // 1. Register a user
      const credentials = getUniqueCredentials();
      testUsersToCleanup.push(credentials.username);
      const registerRes = await request(app).post('/api/v1/auth/register').send(credentials);
      const { accessToken, refreshToken } = registerRes.body.data.tokens;

      // 2. Logout
      const logoutResponse = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body).toHaveProperty('success', true);
      expect(logoutResponse.body.data).toHaveProperty('message', 'Đăng xuất thành công.');

      // 3. Trying to refresh using the revoked token must fail with HTTP 401
      const refreshResponse = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken,
      });
      expect(refreshResponse.status).toBe(401);
      expect(refreshResponse.body).toHaveProperty('success', false);
      expect(refreshResponse.body.error).toHaveProperty('code', 'INVALID_TOKEN');
    });

    it('should return HTTP 400 when logout is missing refreshToken', async () => {
      const response = await request(app).post('/api/v1/auth/logout').send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });
});
