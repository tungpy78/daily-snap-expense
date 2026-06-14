import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/utils/appError';

/**
 * Global error-handling middleware.
 * Ensures all errors are returned in a unified JSON format.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'Đã xảy ra lỗi hệ thống nghiêm trọng.';
  let details: unknown = null;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  }

  // Safely log the error info without leaking sensitive application secrets.
  // We log the type, message and stack trace if available.
  console.error(`[Error] [${code}] - ${err.message}`, {
    stack: err.stack,
  });

  const responseError: {
    code: string;
    message: string;
    details: unknown;
    stack?: string;
  } = {
    code,
    message,
    details,
  };

  if (process.env.NODE_ENV === 'development') {
    responseError.stack = err.stack;
  }

  res.status(statusCode).json({
    success: false,
    error: responseError,
  });
};

/**
 * Middleware to handle 404 (Not Found) routes.
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  const err = new AppError(
    `Không tìm thấy tài nguyên yêu cầu: ${req.method} ${req.originalUrl}`,
    404,
    'NOT_FOUND',
  );
  next(err);
};
