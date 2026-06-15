import { Router } from 'express';
import { FriendshipController } from '../controllers/friendship.controller';
import { authMiddleware } from '../../../middlewares/auth.middleware';
import { validateRequest } from '../../../middlewares/validation.middleware';
import { sendFriendRequestSchema } from '../validators/friendship.validator';

const router = Router();

router.post(
  '/request',
  authMiddleware,
  validateRequest(sendFriendRequestSchema),
  FriendshipController.sendFriendRequest,
);

export default router;
