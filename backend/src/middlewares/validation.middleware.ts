import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../shared/utils/appError';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Express middleware to validate request params, query, and body using Zod.
 * Aggregates all errors and forwards them to the global error handler.
 */
export const validateRequest = (schemas: ValidationSchemas): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const errors: { field: string; message: string }[] = [];

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        errors.push(
          ...result.error.errors.map((err) => ({
            field: `params.${err.path.join('.')}`,
            message: err.message,
          })),
        );
      } else {
        req.params = result.data;
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        errors.push(
          ...result.error.errors.map((err) => ({
            field: `query.${err.path.join('.')}`,
            message: err.message,
          })),
        );
      } else {
        req.query = result.data;
      }
    }

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        errors.push(
          ...result.error.errors.map((err) => ({
            field: `body.${err.path.join('.')}`,
            message: err.message,
          })),
        );
      } else {
        req.body = result.data;
      }
    }

    if (errors.length > 0) {
      return next(new AppError('Dữ liệu yêu cầu không hợp lệ.', 400, 'VALIDATION_ERROR', errors));
    }

    next();
  };
};
