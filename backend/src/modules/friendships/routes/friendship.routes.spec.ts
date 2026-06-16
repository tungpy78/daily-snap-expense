import request from 'supertest';
import { randomUUID } from 'crypto';
import { Op } from 'sequelize';
import app from '../../../app';
import { User } from '../../../shared/models/user.model';
import { Friendship } from '../../../shared/models/friendship.model';
import sequelize from '../../../shared/database/index';
import { tokenService } from '../../auth/services/token.service';

describe('Friendship Routes Integration Tests', () => {
  const suiteId = randomUUID().substring(0, 8);
  const testUsernames = [
    `user_a_${suiteId}`,
    `user_b_${suiteId}`,
    `user_c_${suiteId}`,
    `user_d_${suiteId}`,
    `user_e_${suiteId}`,
  ];

  const testAccessSecret = 'test_integration_access_secret_friendship';
  const testRefreshSecret = 'test_integration_refresh_secret_friendship';

  let userA: User;
  let userB: User;
  let userC: User;
  let userD: User;
  let userE: User;

  let tokenA: string;
  let tokenB: string;
  let tokenD: string;

  const createdFriendshipIds: string[] = [];
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    // Inject mock secrets for integration tests
    process.env.JWT_ACCESS_SECRET = testAccessSecret;
    process.env.JWT_REFRESH_SECRET = testRefreshSecret;
    process.env.JWT_ACCESS_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';

    // Create test users with random data to isolate
    userA = await User.create({
      username: testUsernames[0],
      email: `${testUsernames[0]}@example.com`,
      password_hash: 'hashedpassword',
    });
    createdUserIds.push(userA.id);

    userB = await User.create({
      username: testUsernames[1],
      email: `${testUsernames[1]}@example.com`,
      password_hash: 'hashedpassword',
    });
    createdUserIds.push(userB.id);

    userC = await User.create({
      username: testUsernames[2],
      email: `${testUsernames[2]}@example.com`,
      password_hash: 'hashedpassword',
    });
    createdUserIds.push(userC.id);

    userD = await User.create({
      username: testUsernames[3],
      email: `${testUsernames[3]}@example.com`,
      password_hash: 'hashedpassword',
    });
    createdUserIds.push(userD.id);

    // Inactive user
    userE = await User.create({
      username: testUsernames[4],
      email: `${testUsernames[4]}@example.com`,
      password_hash: 'hashedpassword',
      is_active: false,
    });
    createdUserIds.push(userE.id);

    // Generate valid tokens
    tokenA = tokenService.generateAccessToken({ userId: userA.id });
    tokenB = tokenService.generateAccessToken({ userId: userB.id });
    tokenD = tokenService.generateAccessToken({ userId: userD.id });
  });

  afterAll(async () => {
    try {
      // 1. Cleanup friendships created
      if (createdFriendshipIds.length > 0) {
        await Friendship.destroy({
          where: { id: createdFriendshipIds },
        });
      }
      // Also cleanup any friendship created between our test users that might not be in the list
      await Friendship.destroy({
        where: {
          sender_id: createdUserIds,
        },
      });
      await Friendship.destroy({
        where: {
          receiver_id: createdUserIds,
        },
      });

      // 2. Cleanup users created
      await User.destroy({
        where: { id: createdUserIds },
        force: true,
      });
    } finally {
      await sequelize.close();
    }
  });

  describe('POST /api/v1/friends/request', () => {
    it('should return HTTP 401 when Authorization header is missing', async () => {
      const response = await request(app)
        .post('/api/v1/friends/request')
        .send({ receiverIdentity: userB.email });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('should return HTTP 401 when token is invalid', async () => {
      const response = await request(app)
        .post('/api/v1/friends/request')
        .set('Authorization', 'Bearer invalid.token.value')
        .send({ receiverIdentity: userB.email });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_TOKEN');
    });

    it('should return HTTP 400 when receiverIdentity is missing', async () => {
      const response = await request(app)
        .post('/api/v1/friends/request')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return HTTP 400 when receiverIdentity is empty or only whitespace', async () => {
      const response = await request(app)
        .post('/api/v1/friends/request')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ receiverIdentity: '   ' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return HTTP 400 when receiverIdentity is longer than 100 characters', async () => {
      const response = await request(app)
        .post('/api/v1/friends/request')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ receiverIdentity: 'a'.repeat(101) });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return HTTP 404 when receiverIdentity does not exist', async () => {
      const response = await request(app)
        .post('/api/v1/friends/request')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ receiverIdentity: 'nonexistent_user_for_test@example.com' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'USER_NOT_FOUND');
    });

    it('should return HTTP 404 when receiver exists but is inactive', async () => {
      const response = await request(app)
        .post('/api/v1/friends/request')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ receiverIdentity: userE.username });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'USER_NOT_FOUND');
    });

    it('should return HTTP 400 when user tries to send request to themselves by email', async () => {
      const response = await request(app)
        .post('/api/v1/friends/request')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ receiverIdentity: userA.email });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'SENDER_AND_RECEIVER_ARE_SAME');
    });

    it('should return HTTP 400 when user tries to send request to themselves by username', async () => {
      const response = await request(app)
        .post('/api/v1/friends/request')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ receiverIdentity: userA.username });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'SENDER_AND_RECEIVER_ARE_SAME');
    });

    it('should send friend request successfully using email', async () => {
      const response = await request(app)
        .post('/api/v1/friends/request')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ receiverIdentity: userB.email });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('message', 'Đã gửi lời mời kết bạn thành công.');

      // Check DB
      const friendship = await Friendship.findOne({
        where: { sender_id: userA.id, receiver_id: userB.id },
      });
      expect(friendship).not.toBeNull();
      expect(friendship!.status).toBe('pending');
      createdFriendshipIds.push(friendship!.id);
    });

    it('should return HTTP 400 when sending duplicate pending request in the same direction', async () => {
      // Send a request to user C first
      await request(app)
        .post('/api/v1/friends/request')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ receiverIdentity: userC.username });

      // Send the same request again
      const response = await request(app)
        .post('/api/v1/friends/request')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ receiverIdentity: userC.username });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'FRIEND_REQUEST_ALREADY_SENT');
    });

    it('should auto accept request when there is an existing reverse pending request', async () => {
      // User B sends request to User D
      await request(app)
        .post('/api/v1/friends/request')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ receiverIdentity: userD.username });

      // User D sends request to User B
      const response = await request(app)
        .post('/api/v1/friends/request')
        .set('Authorization', `Bearer ${tokenD}`)
        .send({ receiverIdentity: userB.username });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('message', 'Hai bạn đã trở thành bạn bè.');

      // Check DB
      const friendship = await Friendship.findOne({
        where: {
          [Op.or]: [
            { sender_id: userB.id, receiver_id: userD.id },
            { sender_id: userD.id, receiver_id: userB.id },
          ],
        },
      });
      expect(friendship).not.toBeNull();
      expect(friendship!.status).toBe('accepted');
    });

    it('should return HTTP 400 when sending request to an already accepted friend', async () => {
      // User B and User D are already friends (from previous test)
      const response = await request(app)
        .post('/api/v1/friends/request')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ receiverIdentity: userD.username });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'ALREADY_FRIENDS');
    });

    it('should update status to pending when sending request to a previously rejected user (same direction)', async () => {
      // A and B: B rejects request from A.
      // For testing, let's create a rejected friendship record sender=A, receiver=B, status=rejected directly in DB
      const existing = await Friendship.findOne({
        where: { sender_id: userA.id, receiver_id: userB.id },
      });
      let id = '';
      if (existing) {
        existing.status = 'rejected';
        await existing.save();
        id = existing.id;
      } else {
        const created = await Friendship.create({
          sender_id: userA.id,
          receiver_id: userB.id,
          status: 'rejected',
        });
        id = created.id;
        createdFriendshipIds.push(id);
      }

      // User A sends request to B again
      const response = await request(app)
        .post('/api/v1/friends/request')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ receiverIdentity: userB.username });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('message', 'Đã gửi lời mời kết bạn thành công.');

      // Check DB
      const friendship = await Friendship.findByPk(id);
      expect(friendship!.status).toBe('pending');
      expect(friendship!.sender_id).toBe(userA.id);
      expect(friendship!.receiver_id).toBe(userB.id);
    });

    it('should update status to pending and swap direction when sending request to a previously rejected user (reverse direction)', async () => {
      // B and C: C sent to B, B rejected. (sender=C, receiver=B, status=rejected)
      // Now B sends to C. Result should be: sender=B, receiver=C, status=pending.
      const existing = await Friendship.findOne({
        where: { sender_id: userC.id, receiver_id: userB.id },
      });
      let id = '';
      if (existing) {
        existing.status = 'rejected';
        await existing.save();
        id = existing.id;
      } else {
        const created = await Friendship.create({
          sender_id: userC.id,
          receiver_id: userB.id,
          status: 'rejected',
        });
        id = created.id;
        createdFriendshipIds.push(id);
      }

      // User B sends request to C
      const response = await request(app)
        .post('/api/v1/friends/request')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ receiverIdentity: userC.username });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('message', 'Đã gửi lời mời kết bạn thành công.');

      // Check DB
      const friendship = await Friendship.findByPk(id);
      expect(friendship!.status).toBe('pending');
      expect(friendship!.sender_id).toBe(userB.id);
      expect(friendship!.receiver_id).toBe(userC.id);
    });
  });

  describe('PUT /api/v1/friends/request/:id', () => {
    // Helper to create a new user for PUT tests to ensure test isolation and avoid duplicate friendships
    const createPutTestUser = async (prefix: string) => {
      const username = `put_test_${prefix}_${randomUUID().substring(0, 8)}`;
      const user = await User.create({
        username,
        email: `${username}@example.com`,
        password_hash: 'hashedpassword',
      });
      createdUserIds.push(user.id);
      return user;
    };

    it('should return HTTP 401 when Authorization header is missing', async () => {
      const someId = randomUUID();
      const response = await request(app)
        .put(`/api/v1/friends/request/${someId}`)
        .send({ action: 'ACCEPT' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED');
    });

    it('should return HTTP 401 when token is invalid', async () => {
      const someId = randomUUID();
      const response = await request(app)
        .put(`/api/v1/friends/request/${someId}`)
        .set('Authorization', 'Bearer invalid.token.value')
        .send({ action: 'ACCEPT' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'INVALID_TOKEN');
    });

    it('should return HTTP 400 when params.id is not a valid UUID', async () => {
      const response = await request(app)
        .put('/api/v1/friends/request/not-a-uuid')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ action: 'ACCEPT' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return HTTP 400 when body.action is missing', async () => {
      const someId = randomUUID();
      const response = await request(app)
        .put(`/api/v1/friends/request/${someId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return HTTP 400 when body.action is invalid value', async () => {
      const someId = randomUUID();
      const response = await request(app)
        .put(`/api/v1/friends/request/${someId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ action: 'INVALID_ACTION' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return HTTP 404 when friendship request does not exist', async () => {
      const someId = randomUUID();
      const response = await request(app)
        .put(`/api/v1/friends/request/${someId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ action: 'ACCEPT' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'FRIEND_REQUEST_NOT_FOUND');
    });

    it('should return HTTP 403 when sender tries to respond to their own request', async () => {
      const sender = await createPutTestUser('sender1');
      const receiver = await createPutTestUser('receiver1');
      const senderToken = tokenService.generateAccessToken({ userId: sender.id });

      const requestRecord = await Friendship.create({
        sender_id: sender.id,
        receiver_id: receiver.id,
        status: 'pending',
      });
      createdFriendshipIds.push(requestRecord.id);

      const response = await request(app)
        .put(`/api/v1/friends/request/${requestRecord.id}`)
        .set('Authorization', `Bearer ${senderToken}`)
        .send({ action: 'ACCEPT' });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
    });

    it('should return HTTP 403 when user not involved tries to respond', async () => {
      const sender = await createPutTestUser('sender2');
      const receiver = await createPutTestUser('receiver2');
      const outsider = await createPutTestUser('outsider2');
      const outsiderToken = tokenService.generateAccessToken({ userId: outsider.id });

      const requestRecord = await Friendship.create({
        sender_id: sender.id,
        receiver_id: receiver.id,
        status: 'pending',
      });
      createdFriendshipIds.push(requestRecord.id);

      const response = await request(app)
        .put(`/api/v1/friends/request/${requestRecord.id}`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({ action: 'ACCEPT' });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'FORBIDDEN');
    });

    it('should successfully ACCEPT a pending request', async () => {
      const sender = await createPutTestUser('sender3');
      const receiver = await createPutTestUser('receiver3');
      const receiverToken = tokenService.generateAccessToken({ userId: receiver.id });

      const requestRecord = await Friendship.create({
        sender_id: sender.id,
        receiver_id: receiver.id,
        status: 'pending',
      });
      createdFriendshipIds.push(requestRecord.id);

      const response = await request(app)
        .put(`/api/v1/friends/request/${requestRecord.id}`)
        .set('Authorization', `Bearer ${receiverToken}`)
        .send({ action: 'ACCEPT' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('message', 'Đã chấp nhận kết bạn.');

      // Check DB
      const updated = await Friendship.findByPk(requestRecord.id);
      expect(updated!.status).toBe('accepted');
    });

    it('should successfully DECLINE a pending request', async () => {
      const sender = await createPutTestUser('sender4');
      const receiver = await createPutTestUser('receiver4');
      const receiverToken = tokenService.generateAccessToken({ userId: receiver.id });

      const requestRecord = await Friendship.create({
        sender_id: sender.id,
        receiver_id: receiver.id,
        status: 'pending',
      });
      createdFriendshipIds.push(requestRecord.id);

      const response = await request(app)
        .put(`/api/v1/friends/request/${requestRecord.id}`)
        .set('Authorization', `Bearer ${receiverToken}`)
        .send({ action: 'DECLINE' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('message', 'Đã từ chối kết bạn.');

      // Check DB
      const updated = await Friendship.findByPk(requestRecord.id);
      expect(updated!.status).toBe('rejected');
    });

    it('should return HTTP 400 when trying to respond to an already accepted request', async () => {
      const sender = await createPutTestUser('sender5');
      const receiver = await createPutTestUser('receiver5');
      const receiverToken = tokenService.generateAccessToken({ userId: receiver.id });

      const requestRecord = await Friendship.create({
        sender_id: sender.id,
        receiver_id: receiver.id,
        status: 'accepted',
      });
      createdFriendshipIds.push(requestRecord.id);

      const response = await request(app)
        .put(`/api/v1/friends/request/${requestRecord.id}`)
        .set('Authorization', `Bearer ${receiverToken}`)
        .send({ action: 'ACCEPT' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'FRIEND_REQUEST_NOT_PENDING');
    });

    it('should return HTTP 400 when trying to respond to an already rejected request', async () => {
      const sender = await createPutTestUser('sender6');
      const receiver = await createPutTestUser('receiver6');
      const receiverToken = tokenService.generateAccessToken({ userId: receiver.id });

      const requestRecord = await Friendship.create({
        sender_id: sender.id,
        receiver_id: receiver.id,
        status: 'rejected',
      });
      createdFriendshipIds.push(requestRecord.id);

      const response = await request(app)
        .put(`/api/v1/friends/request/${requestRecord.id}`)
        .set('Authorization', `Bearer ${receiverToken}`)
        .send({ action: 'DECLINE' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'FRIEND_REQUEST_NOT_PENDING');
    });
  });
});
