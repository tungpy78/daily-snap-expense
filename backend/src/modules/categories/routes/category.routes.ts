import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authMiddleware } from '../../../middlewares/auth.middleware';

const router = Router();

// GET /api/v1/categories - Get default categories & user custom categories
router.get('/', authMiddleware, CategoryController.getCategories);

export default router;
