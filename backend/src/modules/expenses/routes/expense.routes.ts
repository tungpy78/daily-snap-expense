import { Router } from 'express';
import { ExpenseController } from '../controllers/expense.controller';
import { authMiddleware } from '../../../middlewares/auth.middleware';
import { validateRequest } from '../../../middlewares/validation.middleware';
import {
  createExpenseSchema,
  listExpensesSchema,
  updateExpenseSchema,
} from '../validators/expense.validator';

const router = Router();

// GET /api/v1/expenses - Get paginated & filtered expenses list
router.get('/', authMiddleware, validateRequest(listExpensesSchema), ExpenseController.getExpenses);

// POST /api/v1/expenses - Create manual expense
router.post(
  '/',
  authMiddleware,
  validateRequest(createExpenseSchema),
  ExpenseController.createExpense,
);

// PUT /api/v1/expenses/:id - Update an existing expense
router.put(
  '/:id',
  authMiddleware,
  validateRequest(updateExpenseSchema),
  ExpenseController.updateExpense,
);

export default router;
