import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../../../middlewares/validation.middleware';
import { registerSchema, loginSchema } from '../validators/auth.validator';

const router = Router();

/**
 * Route: POST /api/v1/auth/register
 * Description: Registers a new user.
 * Middleware: validateRequest - validates request body using registerSchema Zod validator.
 */
router.post('/register', validateRequest(registerSchema), AuthController.register);

/**
 * Route: POST /api/v1/auth/login
 * Description: Logins a user.
 * Middleware: validateRequest - validates request body using loginSchema Zod validator.
 */
router.post('/login', validateRequest(loginSchema), AuthController.login);

export default router;
