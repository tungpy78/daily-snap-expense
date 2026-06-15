import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../../app';
import { User } from '../../../shared/models/user.model';
import sequelize from '../../../shared/database/index';
import { tokenService } from '../../auth/services/token.service';
import { LocalStorageProvider } from '../../../shared/storage/local-storage.provider';
import { UserRepository } from '../repositories/user.repository';

describe('User Profile Integration Tests', () => {
  const testUsersToCleanup: string[] = [];
  const uploadedFilesToCleanup: string[] = [];
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

      const storageProvider = new LocalStorageProvider();
      for (const fileUrl of uploadedFilesToCleanup) {
        try {
          await storageProvider.deleteImage(fileUrl);
        } catch {
          // ignore
        }
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

  describe('PUT /api/v1/users/profile', () => {
    it('should update only username successfully', async () => {
      const credentials = getUniqueCredentials();
      testUsersToCleanup.push(credentials.username);

      const registerRes = await request(app).post('/api/v1/auth/register').send(credentials);
      const accessToken = registerRes.body.data.tokens.accessToken;

      const newUsername = `${credentials.username}_new`;
      testUsersToCleanup.push(newUsername);

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('username', newUsername);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.user.username).toBe(newUsername);
      expect(response.body.data.user.avatarUrl).toBeNull();

      // Ensure no passwords, roles, emails etc. are returned (only id, username, avatarUrl)
      const user = response.body.data.user;
      expect(user).not.toHaveProperty('email');
      expect(user).not.toHaveProperty('password_hash');
      expect(user).not.toHaveProperty('passwordHash');
      expect(user).not.toHaveProperty('role');
      expect(user).not.toHaveProperty('is_active');
      expect(user).not.toHaveProperty('deleted_at');
      expect(user).not.toHaveProperty('deletedAt');
      expect(user).not.toHaveProperty('createdAt');
      expect(user).not.toHaveProperty('updatedAt');
    });

    it('should update only avatar successfully', async () => {
      const credentials = getUniqueCredentials();
      testUsersToCleanup.push(credentials.username);

      const registerRes = await request(app).post('/api/v1/auth/register').send(credentials);
      const accessToken = registerRes.body.data.tokens.accessToken;

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('avatar', Buffer.from('fake-png-data'), 'avatar.png');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.user.username).toBe(credentials.username);
      expect(response.body.data.user.avatarUrl).toContain('/public/uploads/avatars/');

      uploadedFilesToCleanup.push(response.body.data.user.avatarUrl);
    });

    it('should update both username and avatar successfully', async () => {
      const credentials = getUniqueCredentials();
      testUsersToCleanup.push(credentials.username);

      const registerRes = await request(app).post('/api/v1/auth/register').send(credentials);
      const accessToken = registerRes.body.data.tokens.accessToken;

      const newUsername = `${credentials.username}_both`;
      testUsersToCleanup.push(newUsername);

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('username', newUsername)
        .attach('avatar', Buffer.from('fake-png-data'), 'avatar.png');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.user.username).toBe(newUsername);
      expect(response.body.data.user.avatarUrl).toContain('/public/uploads/avatars/');

      uploadedFilesToCleanup.push(response.body.data.user.avatarUrl);
    });

    it('should return HTTP 400 when sending neither username nor avatar', async () => {
      const credentials = getUniqueCredentials();
      testUsersToCleanup.push(credentials.username);

      const registerRes = await request(app).post('/api/v1/auth/register').send(credentials);
      const accessToken = registerRes.body.data.tokens.accessToken;

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return HTTP 400 when username is too short', async () => {
      const credentials = getUniqueCredentials();
      testUsersToCleanup.push(credentials.username);

      const registerRes = await request(app).post('/api/v1/auth/register').send(credentials);
      const accessToken = registerRes.body.data.tokens.accessToken;

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('username', 'ab');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return HTTP 400 when username is too long', async () => {
      const credentials = getUniqueCredentials();
      testUsersToCleanup.push(credentials.username);

      const registerRes = await request(app).post('/api/v1/auth/register').send(credentials);
      const accessToken = registerRes.body.data.tokens.accessToken;

      const longUsername = 'a'.repeat(51);

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('username', longUsername);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return HTTP 400 when username contains special characters', async () => {
      const credentials = getUniqueCredentials();
      testUsersToCleanup.push(credentials.username);

      const registerRes = await request(app).post('/api/v1/auth/register').send(credentials);
      const accessToken = registerRes.body.data.tokens.accessToken;

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('username', 'user-name!');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return HTTP 400 when username is already taken by another user', async () => {
      const userA = getUniqueCredentials();
      const userB = getUniqueCredentials();
      testUsersToCleanup.push(userA.username, userB.username);

      await request(app).post('/api/v1/auth/register').send(userA);
      const registerResB = await request(app).post('/api/v1/auth/register').send(userB);
      const accessTokenB = registerResB.body.data.tokens.accessToken;

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessTokenB}`)
        .field('username', userA.username);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'USERNAME_ALREADY_EXISTS');
    });

    it('should succeed when sending the current username', async () => {
      const credentials = getUniqueCredentials();
      testUsersToCleanup.push(credentials.username);

      const registerRes = await request(app).post('/api/v1/auth/register').send(credentials);
      const accessToken = registerRes.body.data.tokens.accessToken;

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .field('username', credentials.username);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.user.username).toBe(credentials.username);
    });

    it('should return HTTP 400 when avatar has invalid format', async () => {
      const credentials = getUniqueCredentials();
      testUsersToCleanup.push(credentials.username);

      const registerRes = await request(app).post('/api/v1/auth/register').send(credentials);
      const accessToken = registerRes.body.data.tokens.accessToken;

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('avatar', Buffer.from('plain-text-data'), 'document.txt');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_FILE_TYPE');
    });

    it('should return HTTP 400 when avatar is too large (> 5MB)', async () => {
      const credentials = getUniqueCredentials();
      testUsersToCleanup.push(credentials.username);

      const registerRes = await request(app).post('/api/v1/auth/register').send(credentials);
      const accessToken = registerRes.body.data.tokens.accessToken;

      const hugeBuffer = Buffer.alloc(5 * 1024 * 1024 + 100);

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('avatar', hugeBuffer, 'huge.png');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'FILE_TOO_LARGE');
    });

    it('should return HTTP 401 when Authorization header is missing', async () => {
      const response = await request(app)
        .put('/api/v1/users/profile')
        .field('username', 'new_name');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('should return HTTP 401 when token is invalid', async () => {
      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', 'Bearer invalid_token_here')
        .field('username', 'new_name');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_TOKEN');
    });

    it('should delete old avatar file after successfully updating to a new one', async () => {
      const credentials = getUniqueCredentials();
      testUsersToCleanup.push(credentials.username);

      const registerRes = await request(app).post('/api/v1/auth/register').send(credentials);
      const accessToken = registerRes.body.data.tokens.accessToken;

      // First upload of avatar
      const firstRes = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('avatar', Buffer.from('avatar-1'), 'avatar1.png');

      expect(firstRes.status).toBe(200);
      const firstAvatarUrl = firstRes.body.data.user.avatarUrl;
      expect(firstAvatarUrl).toContain('/public/uploads/avatars/');
      uploadedFilesToCleanup.push(firstAvatarUrl);

      // Spy on LocalStorageProvider deleteImage
      const deleteSpy = jest.spyOn(LocalStorageProvider.prototype, 'deleteImage');

      // Second upload of avatar
      const secondRes = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('avatar', Buffer.from('avatar-2'), 'avatar2.png');

      expect(secondRes.status).toBe(200);
      const secondAvatarUrl = secondRes.body.data.user.avatarUrl;
      expect(secondAvatarUrl).toContain('/public/uploads/avatars/');
      uploadedFilesToCleanup.push(secondAvatarUrl);

      // Verify deleteImage was called with the first avatar url
      expect(deleteSpy).toHaveBeenCalledWith(firstAvatarUrl);
      deleteSpy.mockRestore();
    });

    it('should cleanup new avatar if DB update fails', async () => {
      const credentials = getUniqueCredentials();
      testUsersToCleanup.push(credentials.username);

      const registerRes = await request(app).post('/api/v1/auth/register').send(credentials);
      const accessToken = registerRes.body.data.tokens.accessToken;

      const uploadSpy = jest.spyOn(LocalStorageProvider.prototype, 'uploadImage');
      const deleteSpy = jest.spyOn(LocalStorageProvider.prototype, 'deleteImage');
      const dbUpdateSpy = jest
        .spyOn(UserRepository, 'updateProfileById')
        .mockRejectedValueOnce(new Error('Mock DB update error'));

      const response = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('avatar', Buffer.from('fake-png-data'), 'avatar.png');

      expect(response.status).toBe(500);
      expect(uploadSpy).toHaveBeenCalled();

      const uploadedUrl = await uploadSpy.mock.results[0].value;
      expect(deleteSpy).toHaveBeenCalledWith(uploadedUrl);

      uploadSpy.mockRestore();
      deleteSpy.mockRestore();
      dbUpdateSpy.mockRestore();
    });
  });
});
