import { Router } from 'express';
import { FriendshipController } from '../controllers/friendship.controller';
import { authMiddleware } from '../../../middlewares/auth.middleware';
import { validateRequest } from '../../../middlewares/validation.middleware';
import {
  sendFriendRequestSchema,
  respondFriendRequestSchema,
  friendFeedQuerySchema,
} from '../validators/friendship.validator';

const router = Router();

router.post(
  '/request',
  authMiddleware,
  validateRequest(sendFriendRequestSchema),
  FriendshipController.sendFriendRequest,
);

router.put(
  '/request/:id',
  authMiddleware,
  validateRequest(respondFriendRequestSchema),
  FriendshipController.respondFriendRequest,
);

router.get(
  '/feed',
  authMiddleware,
  validateRequest(friendFeedQuerySchema),
  FriendshipController.getFriendFeed,
);

export default router;
