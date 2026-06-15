import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { z } from 'zod';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { AppError } from './shared/utils/appError';
import { validateRequest } from './middlewares/validation.middleware';
import authRoutes from './modules/auth/routes/auth.routes';
import { authMiddleware } from './middlewares/auth.middleware';

// Load environment variables
dotenv.config();

const app = express();

// Standard middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads (for MVP)
app.use('/public', express.static('public'));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      message: 'Server is running healthily.',
    },
  });
});

// Test error endpoint (Only for development/testing purpose)
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/test-error', (req: Request, _res: Response, next: NextFunction) => {
    const { type } = req.query;

    if (type === 'bad_request') {
      return next(new AppError('Yêu cầu không hợp lệ (Mock BadRequest).', 400, 'BAD_REQUEST'));
    }
    if (type === 'unauthorized') {
      return next(new AppError('Bạn chưa xác thực (Mock Unauthorized).', 401, 'UNAUTHORIZED'));
    }
    if (type === 'forbidden') {
      return next(new AppError('Bạn không có quyền truy cập (Mock Forbidden).', 403, 'FORBIDDEN'));
    }
    if (type === 'async_error') {
      Promise.resolve()
        .then(() => {
          throw new Error('Lỗi bất đồng bộ không xác định (Mock Async Error).');
        })
        .catch(next);
      return;
    }
    if (type === 'unknown') {
      throw new Error('Lỗi đồng bộ không xác định (Mock Sync Error).');
    }

    next(
      new AppError(
        'Vui lòng cung cấp tham số type hợp lệ (?type=bad_request|unauthorized|forbidden|async_error|unknown).',
        400,
        'BAD_REQUEST',
      ),
    );
  });

  // Test validation endpoint (Only for development/testing purpose)
  const testBodySchema = z.object({
    email: z.string().email('Email không đúng định dạng'),
    age: z.number().min(18, 'Tuổi phải từ 18 trở lên'),
  });

  const testQuerySchema = z.object({
    limit: z.coerce
      .number({ invalid_type_error: 'Limit phải là số' })
      .min(1, 'Limit phải từ 1 đến 100')
      .max(100, 'Limit phải từ 1 đến 100')
      .optional(),
  });

  app.post(
    '/api/test-validation',
    validateRequest({ body: testBodySchema, query: testQuerySchema }),
    (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        data: {
          body: req.body,
          query: req.query,
        },
      });
    },
  );

  app.get('/api/test-auth', authMiddleware, (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  });
}

// Authentication Routes
app.use('/api/v1/auth', authRoutes);

// Handle 404 Not Found routes
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
