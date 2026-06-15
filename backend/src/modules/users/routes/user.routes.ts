import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../../../middlewares/auth.middleware';
import { uploadImageMiddleware } from '../../../middlewares/upload.middleware';
import { validateRequest } from '../../../middlewares/validation.middleware';
import { updateProfileSchema } from '../validators/user.validator';

const router = Router();

// GET /api/v1/users/profile - Returns active user profile
router.get('/profile', authMiddleware, UserController.getProfile);

// PUT /api/v1/users/profile - Updates user profile details (username/avatar)
router.put(
  '/profile',
  authMiddleware,
  uploadImageMiddleware('avatar'),
  validateRequest(updateProfileSchema),
  UserController.updateProfile,
);

export default router;
