import multer, { MulterError } from 'multer';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/utils/appError';
import path from 'path';

// Configure multer instance using memory storage and limit to 5MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = ['.jpg', '.jpeg', '.png'];
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];

    const ext = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype;

    if (!allowedExtensions.includes(ext) || !allowedMimeTypes.includes(mimeType)) {
      return cb(
        new AppError(
          'Định dạng ảnh không hợp lệ. Chỉ cho phép .jpg, .jpeg, .png.',
          400,
          'INVALID_FILE_TYPE',
        ),
      );
    }

    cb(null, true);
  },
});

/**
 * Factory middleware to handle single image upload under specified field name.
 * Maps Multer errors to clean AppErrors (e.g. LIMIT_FILE_SIZE -> FILE_TOO_LARGE).
 * If no file is provided in the request, it passes silently to let the controller decide
 * whether the file is mandatory or optional.
 */
export const uploadImageMiddleware = (fieldName: string) => {
  const uploadSingle = upload.single(fieldName);

  return (req: Request, res: Response, next: NextFunction): void => {
    uploadSingle(req, res, (err: unknown) => {
      if (err) {
        if (err instanceof MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new AppError('Kích thước ảnh quá lớn. Tối đa 5MB.', 400, 'FILE_TOO_LARGE'));
          }
          return next(new AppError(err.message, 400, 'BAD_REQUEST'));
        }
        return next(err);
      }
      next();
    });
  };
};
