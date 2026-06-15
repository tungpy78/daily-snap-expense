import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../../../middlewares/auth.middleware';

const router = Router();

// GET /api/v1/users/profile - Returns active user profile
router.get('/profile', authMiddleware, UserController.getProfile);

export default router;
