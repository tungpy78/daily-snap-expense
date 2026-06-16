import { Router } from 'express';
import { SnapController } from '../controllers/snap.controller';
import { ReactionController } from '../../reactions/controllers/reaction.controller';
import { authMiddleware } from '../../../middlewares/auth.middleware';
import { uploadImageMiddleware } from '../../../middlewares/upload.middleware';
import { validateRequest } from '../../../middlewares/validation.middleware';
import {
  createSnapSchema,
  timelineQuerySchema,
  deleteSnapSchema,
} from '../validators/snap.validator';
import { reactToSnapSchema } from '../../reactions/validators/reaction.validator';

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

router.delete('/:id', authMiddleware, validateRequest(deleteSnapSchema), SnapController.deleteSnap);

router.post(
  '/:id/react',
  authMiddleware,
  validateRequest(reactToSnapSchema),
  ReactionController.reactToSnap,
);

export default router;
