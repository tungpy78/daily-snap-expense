import { Router } from 'express';
import { StatisticsController } from '../controllers/statistics.controller';
import { authMiddleware } from '../../../middlewares/auth.middleware';
import { validateRequest } from '../../../middlewares/validation.middleware';
import { statisticsQuerySchema } from '../validators/statistics.validator';

const router = Router();

router.get(
  '/',
  authMiddleware,
  validateRequest(statisticsQuerySchema),
  StatisticsController.getSummary,
);

export default router;
