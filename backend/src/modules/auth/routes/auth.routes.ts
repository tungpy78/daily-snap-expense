import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../../../middlewares/validation.middleware';
import { registerSchema } from '../validators/auth.validator';

const router = Router();

/**
 * Route: POST /api/v1/auth/register
 * Description: Registers a new user.
 * Middleware: validateRequest - validates request body using registerSchema Zod validator.
 */
router.post('/register', validateRequest(registerSchema), AuthController.register);

export default router;
