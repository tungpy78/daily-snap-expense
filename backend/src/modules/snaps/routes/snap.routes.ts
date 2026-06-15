import { Router } from 'express';
import { SnapController } from '../controllers/snap.controller';
import { authMiddleware } from '../../../middlewares/auth.middleware';
import { uploadImageMiddleware } from '../../../middlewares/upload.middleware';
import { validateRequest } from '../../../middlewares/validation.middleware';
import { createSnapSchema, timelineQuerySchema } from '../validators/snap.validator';

const router = Router();

router.post(
  '/',
  authMiddleware,
  uploadImageMiddleware('image'),
  validateRequest(createSnapSchema),
  SnapController.createSnap,
);

router.get(
  '/timeline',
  authMiddleware,
  validateRequest(timelineQuerySchema),
  SnapController.getTimeline,
);

export default router;
