import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../../../middlewares/validation.middleware';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} from '../validators/auth.validator';

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

/**
 * Route: POST /api/v1/auth/refresh
 * Description: Refreshes access token and refresh token.
 * Middleware: validateRequest - validates request body using refreshSchema Zod validator.
 */
router.post('/refresh', validateRequest(refreshSchema), AuthController.refresh);

/**
 * Route: POST /api/v1/auth/logout
 * Description: Logs out a user by invalidating the refresh token.
 * Middleware: validateRequest - validates request body using logoutSchema Zod validator.
 */
router.post('/logout', validateRequest(logoutSchema), AuthController.logout);

export default router;
