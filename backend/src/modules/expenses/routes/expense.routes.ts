import { Router } from 'express';
import { ExpenseController } from '../controllers/expense.controller';
import { authMiddleware } from '../../../middlewares/auth.middleware';
import { validateRequest } from '../../../middlewares/validation.middleware';
import { createExpenseSchema } from '../validators/expense.validator';

const router = Router();

// POST /api/v1/expenses - Create manual expense
router.post(
  '/',
  authMiddleware,
  validateRequest(createExpenseSchema),
  ExpenseController.createExpense,
);

export default router;
