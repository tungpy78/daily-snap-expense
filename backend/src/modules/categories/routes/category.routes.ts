import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authMiddleware } from '../../../middlewares/auth.middleware';
import { validateRequest } from '../../../middlewares/validation.middleware';
import { createCategorySchema } from '../validators/category.validator';

const router = Router();

// GET /api/v1/categories - Get default categories & user custom categories
router.get('/', authMiddleware, CategoryController.getCategories);

// POST /api/v1/categories - Create custom category
router.post(
  '/',
  authMiddleware,
  validateRequest(createCategorySchema),
  CategoryController.createCategory,
);

export default router;
