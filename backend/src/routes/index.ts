import { Router } from 'express';
import authRoutes from '../modules/auth/routes/auth.routes';
import userRoutes from '../modules/users/routes/user.routes';
import categoryRoutes from '../modules/categories/routes/category.routes';
import expenseRoutes from '../modules/expenses/routes/expense.routes';
import snapRoutes from '../modules/snaps/routes/snap.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/expenses', expenseRoutes);
router.use('/snaps', snapRoutes);

export default router;
