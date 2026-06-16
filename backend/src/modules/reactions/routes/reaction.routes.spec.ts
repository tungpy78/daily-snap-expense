import request from 'supertest';
import { randomUUID } from 'crypto';
import app from '../../../app';
import { User } from '../../../shared/models/user.model';
import { Snap } from '../../../shared/models/snap.model';
import { Friendship } from '../../../shared/models/friendship.model';
import { Reaction } from '../../../shared/models/reaction.model';
import sequelize from '../../../shared/database/index';
import { tokenService } from '../../auth/services/token.service';

describe('Reaction Routes Integration Tests', () => {
  const suiteId = randomUUID().substring(0, 8);

  const testAccessSecret = 'test_integration_access_secret_reaction';
  const testRefreshSecret = 'test_integration_refresh_secret_reaction';

  let owner: User;
  let friend: User;
  let stranger: User;
  let pendingFriend: User;
  let rejectedFriend: User;

  let ownerToken: string;
  let friendToken: string;
  let strangerToken: string;
  let pendingFriendToken: string;
  let rejectedFriendToken: string;

  const createdUserIds: string[] = [];
  const createdSnapIds: string[] = [];
  const createdFriendshipIds: string[] = [];
  const createdReactionIds: string[] = [];

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = testAccessSecret;
    process.env.JWT_REFRESH_SECRET = testRefreshSecret;
    process.env.JWT_ACCESS_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';

    // Create users
    const createUser = async (role: string) => {
      const username = `u_${role}_${suiteId}`;
      const user = await User.create({
        username,
        email: `${username}@example.com`,
        password_hash: 'hashedpassword',
      });
      createdUserIds.push(user.id);
      return user;
    };

    owner = await createUser('owner');
    friend = await createUser('friend');
    stranger = await createUser('stranger');
    pendingFriend = await createUser('pending');
    rejectedFriend = await createUser('rejected');

    // Tokens
    ownerToken = tokenService.generateAccessToken({ userId: owner.id });
    friendToken = tokenService.generateAccessToken({ userId: friend.id });
    strangerToken = tokenService.generateAccessToken({ userId: stranger.id });
    pendingFriendToken = tokenService.generateAccessToken({ userId: pendingFriend.id });
    rejectedFriendToken = tokenService.generateAccessToken({ userId: rejectedFriend.id });

    // Setup friendships
    // owner <-> friend : accepted
    const f1 = await Friendship.create({
      sender_id: owner.id,
      receiver_id: friend.id,
      status: 'accepted',
    });
    createdFriendshipIds.push(f1.id);

    // owner <-> pendingFriend : pending
    const f2 = await Friendship.create({
      sender_id: owner.id,
      receiver_id: pendingFriend.id,
      status: 'pending',
    });
    createdFriendshipIds.push(f2.id);

    // owner <-> rejectedFriend : rejected
    const f3 = await Friendship.create({
      sender_id: owner.id,
      receiver_id: rejectedFriend.id,
      status: 'rejected',
    });
    createdFriendshipIds.push(f3.id);
  });

  afterAll(async () => {
    try {
      // Clean reactions
      if (createdReactionIds.length > 0) {
        await Reaction.destroy({
          where: { id: createdReactionIds },
        });
      }
      // Clean snaps
      if (createdSnapIds.length > 0) {
        await Snap.destroy({
          where: { id: createdSnapIds },
          force: true,
        });
      }
      // Clean friendships
      if (createdFriendshipIds.length > 0) {
        await Friendship.destroy({
          where: { id: createdFriendshipIds },
        });
      }
      // Clean users
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

  // Helper to create snap
  const createTestSnap = async (userId: string, isPrivate: boolean): Promise<Snap> => {
    const snap = await Snap.create({
      user_id: userId,
      image_url: 'http://example.com/image.jpg',
      caption: 'Test snap caption',
      is_private: isPrivate,
    });
    createdSnapIds.push(snap.id);
    return snap;
  };

  describe('POST /api/v1/snaps/:id/react', () => {
    it('should return HTTP 401 when token is missing', async () => {
      const snap = await createTestSnap(owner.id, false);
      const res = await request(app).post(`/api/v1/snaps/${snap.id}/react`).send({ emoji: '👍' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return HTTP 401 when token is invalid', async () => {
      const snap = await createTestSnap(owner.id, false);
      const res = await request(app)
        .post(`/api/v1/snaps/${snap.id}/react`)
        .set('Authorization', 'Bearer invalidtoken')
        .send({ emoji: '👍' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should return HTTP 400 when params.id is not a UUID', async () => {
      const res = await request(app)
        .post('/api/v1/snaps/not-a-uuid/react')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ emoji: '👍' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return HTTP 400 when body.emoji is missing', async () => {
      const snap = await createTestSnap(owner.id, false);
      const res = await request(app)
        .post(`/api/v1/snaps/${snap.id}/react`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return HTTP 400 when body.emoji is empty or only spaces', async () => {
      const snap = await createTestSnap(owner.id, false);
      const res = await request(app)
        .post(`/api/v1/snaps/${snap.id}/react`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ emoji: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return HTTP 400 when body.emoji is longer than 32 characters', async () => {
      const snap = await createTestSnap(owner.id, false);
      const res = await request(app)
        .post(`/api/v1/snaps/${snap.id}/react`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ emoji: '👍'.repeat(33) });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return HTTP 404 when snap id does not exist', async () => {
      const nonexistentId = randomUUID();
      const res = await request(app)
        .post(`/api/v1/snaps/${nonexistentId}/react`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ emoji: '👍' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('SNAP_NOT_FOUND');
    });

    it('should return HTTP 404 when snap is soft-deleted', async () => {
      const snap = await createTestSnap(owner.id, false);
      // Soft-delete snap
      await snap.destroy();

      const res = await request(app)
        .post(`/api/v1/snaps/${snap.id}/react`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ emoji: '👍' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('SNAP_NOT_FOUND');
    });

    it('should return HTTP 403 when a stranger reacts to a public snap of another user', async () => {
      const snap = await createTestSnap(owner.id, false);
      const res = await request(app)
        .post(`/api/v1/snaps/${snap.id}/react`)
        .set('Authorization', `Bearer ${strangerToken}`)
        .send({ emoji: '👍' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should return HTTP 403 when a pending friend reacts to a public snap of another user', async () => {
      const snap = await createTestSnap(owner.id, false);
      const res = await request(app)
        .post(`/api/v1/snaps/${snap.id}/react`)
        .set('Authorization', `Bearer ${pendingFriendToken}`)
        .send({ emoji: '👍' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should return HTTP 403 when a rejected friend reacts to a public snap of another user', async () => {
      const snap = await createTestSnap(owner.id, false);
      const res = await request(app)
        .post(`/api/v1/snaps/${snap.id}/react`)
        .set('Authorization', `Bearer ${rejectedFriendToken}`)
        .send({ emoji: '👍' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should return HTTP 403 when an accepted friend reacts to a private snap of another user', async () => {
      const snap = await createTestSnap(owner.id, true);
      const res = await request(app)
        .post(`/api/v1/snaps/${snap.id}/react`)
        .set('Authorization', `Bearer ${friendToken}`)
        .send({ emoji: '👍' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should return HTTP 200 and create a reaction when owner reacts to their own public snap', async () => {
      const snap = await createTestSnap(owner.id, false);
      const res = await request(app)
        .post(`/api/v1/snaps/${snap.id}/react`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ emoji: '👍' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('Đã thả cảm xúc thành công.');

      // Check DB
      const reaction = await Reaction.findOne({
        where: { snap_id: snap.id, user_id: owner.id },
      });
      expect(reaction).not.toBeNull();
      expect(reaction!.emoji).toBe('👍');
      if (reaction) {
        createdReactionIds.push(reaction.id);
      }
    });

    it('should return HTTP 200 and create a reaction when owner reacts to their own private snap', async () => {
      const snap = await createTestSnap(owner.id, true);
      const res = await request(app)
        .post(`/api/v1/snaps/${snap.id}/react`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ emoji: '❤️' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('Đã thả cảm xúc thành công.');

      // Check DB
      const reaction = await Reaction.findOne({
        where: { snap_id: snap.id, user_id: owner.id },
      });
      expect(reaction).not.toBeNull();
      expect(reaction!.emoji).toBe('❤️');
      if (reaction) {
        createdReactionIds.push(reaction.id);
      }
    });

    it('should return HTTP 200 and create a reaction when accepted friend reacts to public snap', async () => {
      const snap = await createTestSnap(owner.id, false);
      const res = await request(app)
        .post(`/api/v1/snaps/${snap.id}/react`)
        .set('Authorization', `Bearer ${friendToken}`)
        .send({ emoji: '😂' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('Đã thả cảm xúc thành công.');

      // Check DB
      const reaction = await Reaction.findOne({
        where: { snap_id: snap.id, user_id: friend.id },
      });
      expect(reaction).not.toBeNull();
      expect(reaction!.emoji).toBe('😂');
      if (reaction) {
        createdReactionIds.push(reaction.id);
      }
    });

    it('should return HTTP 200 and update emoji without creating a duplicate record when reacting again', async () => {
      const snap = await createTestSnap(owner.id, false);

      // 1. Create first reaction
      const res1 = await request(app)
        .post(`/api/v1/snaps/${snap.id}/react`)
        .set('Authorization', `Bearer ${friendToken}`)
        .send({ emoji: '👍' });

      expect(res1.status).toBe(200);

      const reaction1 = await Reaction.findOne({
        where: { snap_id: snap.id, user_id: friend.id },
      });
      expect(reaction1).not.toBeNull();
      if (reaction1) {
        createdReactionIds.push(reaction1.id);
      }

      // 2. React again with a different emoji
      const res2 = await request(app)
        .post(`/api/v1/snaps/${snap.id}/react`)
        .set('Authorization', `Bearer ${friendToken}`)
        .send({ emoji: '😮' });

      expect(res2.status).toBe(200);
      expect(res2.body.success).toBe(true);

      // 3. Verify in DB
      const reactions = await Reaction.findAll({
        where: { snap_id: snap.id, user_id: friend.id },
      });
      expect(reactions.length).toBe(1);
      expect(reactions[0].emoji).toBe('😮');
    });
  });
});
